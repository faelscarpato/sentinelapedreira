import { z } from "npm:zod";
import { handleOptionsRequest, jsonResponse } from "../_shared/cors.ts";
import { toHttpError, HttpError } from "../_shared/errors.ts";
import { logError, logInfo } from "../_shared/logger.ts";
import { ensureRole, resolveAuthContext } from "../_shared/auth.ts";
import { runChatCompletion } from "../_shared/ai-provider.ts";
import { getServiceClient } from "../_shared/supabase.ts";

const treasurySchema = z.object({
  capturedAt: z.string().datetime(),
  executionPercentage: z.number().min(0).max(100),
  availableBalance: z.number(),
  status: z.enum(["red", "yellow", "green"]),
  fiscalGoalOk: z.boolean(),
  personnelExpenseRate: z.number().min(0).max(100).optional(),
  notes: z.string().max(2000),
});

const requestSchema = z.object({
  documentId: z.string().min(1),
  documentTitle: z.string().min(1).max(300),
  documentContent: z.string().min(50).max(40000),
  treasury: treasurySchema,
  previousAnalyses: z.array(z.object({
    id: z.string(),
    title: z.string(),
    riskScore: z.number().min(0).max(100),
    summary: z.string(),
    financialValue: z.number().optional(),
  })).max(20).optional().default([]),
  provider: z.enum(["openai", "groq", "nvidia"]).optional(),
  model: z.string().optional(),
});

const analysisSchema = z.object({
  documentId: z.string(),
  documentTitle: z.string(),
  analyzedAt: z.string().datetime(),
  financialRequest: z.object({
    hasRequest: z.boolean(),
    value: z.number().nullable().optional(),
    category: z.string().nullable().optional(),
    source: z.string().nullable().optional(),
    destination: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
  }),
  missingDocuments: z.array(z.object({
    name: z.string(),
    severity: z.enum(["critical", "high", "medium"]),
    reason: z.string(),
  })),
  treasuryImpact: z.object({
    riskLevel: z.enum(["red", "yellow", "green"]),
    canFulfillCommitment: z.boolean(),
    impactOnFiscalGoal: z.enum(["positivo", "neutro", "negativo"]),
    explanation: z.string(),
  }),
  traceChain: z.array(z.object({
    step: z.number().int().min(1),
    type: z.enum(["origem", "proposta", "aprovacao", "recurso", "destino", "impacto"]),
    description: z.string(),
    entity: z.string(),
    date: z.string().optional().nullable(),
    flags: z.array(z.string()).optional(),
  })),
  relatedAnalyses: z.array(z.object({
    id: z.string(),
    relationship: z.string(),
    relevanceScore: z.number().min(0).max(100),
    note: z.string().optional(),
  })),
  importanceRanking: z.object({
    score: z.number().min(0).max(100),
    justification: z.string(),
    priority: z.enum(["urgente", "alta", "media", "baixa"]),
  }),
  riskScore: z.number().min(0).max(100),
  riskLevel: z.enum(["critical", "high", "medium", "low"]),
  summary: z.string(),
  recommendations: z.array(z.string()).max(12),
});

function extractJson(content: string) {
  const direct = JSON.parse(content);
  return direct;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return handleOptionsRequest();
  }

  const requestId = crypto.randomUUID();

  try {
    if (req.method !== "POST") {
      return jsonResponse({ error: "method_not_allowed" }, 405);
    }

    const auth = await resolveAuthContext(req.headers.get("Authorization"), true);
    ensureRole(auth, ["editor", "reviewer", "admin"]);

    const payload = requestSchema.parse(await req.json());
    const service = getServiceClient();

    const prompt = `Analise o documento abaixo e retorne APENAS JSON válido com o formato solicitado.\n\nDocumento: ${payload.documentTitle} (${payload.documentId})\n\nConteúdo:\n${payload.documentContent.slice(0, 12000)}\n\nContexto financeiro:\n${JSON.stringify(payload.treasury)}\n\nAnálises anteriores:\n${JSON.stringify(payload.previousAnalyses.slice(-8))}\n\nFormato obrigatório:\n${JSON.stringify({
      documentId: payload.documentId,
      documentTitle: payload.documentTitle,
      analyzedAt: "2026-01-01T00:00:00.000Z",
      financialRequest: {
        hasRequest: true,
        value: 1000,
        category: "investimento",
        source: "tesouro_municipal",
        destination: "secretaria",
        description: "descricao",
      },
      missingDocuments: [{ name: "nome", severity: "high", reason: "motivo" }],
      treasuryImpact: {
        riskLevel: "yellow",
        canFulfillCommitment: true,
        impactOnFiscalGoal: "neutro",
        explanation: "texto",
      },
      traceChain: [{ step: 1, type: "origem", description: "texto", entity: "orgao", date: null, flags: [] }],
      relatedAnalyses: [{ id: "abc", relationship: "complementa", relevanceScore: 70, note: "obs" }],
      importanceRanking: { score: 70, justification: "texto", priority: "alta" },
      riskScore: 65,
      riskLevel: "medium",
      summary: "resumo",
      recommendations: ["item 1", "item 2"],
    })}`;

    const completion = await runChatCompletion({
      provider: payload.provider,
      model: payload.model,
      messages: [
        {
          role: "system",
          content: "Você é um auditor de rastreabilidade financeira municipal. Responda somente JSON válido, sem markdown.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.1,
      maxTokens: 2200,
      timeoutMs: 35000,
    });

    let parsed: unknown;
    try {
      parsed = extractJson(completion.content);
    } catch {
      const matched = completion.content.match(/\{[\s\S]*\}/);
      if (!matched) {
        throw new HttpError(502, "invalid_model_payload", "Modelo não retornou JSON parseável.", completion.content);
      }
      parsed = JSON.parse(matched[0]);
    }

    const analysis = analysisSchema.parse(parsed);

    const markdown = [
      `## Resumo Executivo\n${analysis.summary}`,
      `## Risco\n- Score: ${analysis.riskScore}\n- Nível: ${analysis.riskLevel}`,
      `## Recomendações\n${analysis.recommendations.map((item) => `- ${item}`).join("\n")}`,
    ].join("\n\n");

    const { data: savedAnalysis, error: analysisInsertError } = await service
      .from("analyses")
      .insert({
        document_id: null,
        analysis_type: "financial_traceability",
        title: `Rastreabilidade: ${analysis.documentTitle}`,
        status: "draft",
        summary: analysis.summary,
        content_markdown: markdown,
        confidence_score: analysis.riskScore,
        metadata: {
          requestId,
          provider: completion.provider,
          model: completion.model,
          sourceDocumentId: analysis.documentId,
          structured: analysis,
        },
        created_by: auth.user?.id,
        updated_by: auth.user?.id,
      })
      .select("id")
      .single();

    if (analysisInsertError) throw analysisInsertError;

    const { error: versionError } = await service.from("analysis_versions").insert({
      analysis_id: savedAnalysis.id,
      version_number: 1,
      summary: analysis.summary,
      content_markdown: markdown,
      changed_by: auth.user?.id,
      change_reason: "initial_generation",
    });

    if (versionError) throw versionError;

    if (analysis.missingDocuments.length > 0) {
      const { error: flagsError } = await service.from("analysis_flags").insert(
        analysis.missingDocuments.map((item) => ({
          analysis_id: savedAnalysis.id,
          flag_type: "missing_document",
          severity: item.severity,
          message: `${item.name}: ${item.reason}`,
        })),
      );
      if (flagsError) throw flagsError;
    }

    logInfo("financial-traceability.success", {
      requestId,
      userId: auth.user?.id,
      analysisId: savedAnalysis.id,
      provider: completion.provider,
      model: completion.model,
    });

    return jsonResponse({
      requestId,
      analysisId: savedAnalysis.id,
      provider: completion.provider,
      model: completion.model,
      analysis,
    });
  } catch (error) {
    const normalized = toHttpError(error);
    logError("financial-traceability.error", {
      requestId,
      status: normalized.status,
      code: normalized.code,
      message: normalized.message,
      details: normalized.details,
    });

    return jsonResponse({
      requestId,
      error: normalized.code,
      message: normalized.message,
      details: normalized.details,
    }, normalized.status);
  }
});
