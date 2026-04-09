import { z } from "npm:zod";
import { handleOptionsRequest, jsonResponse } from "../_shared/cors.ts";
import { toHttpError } from "../_shared/errors.ts";
import { logError, logInfo } from "../_shared/logger.ts";
import { resolveAuthContext } from "../_shared/auth.ts";
import { getServiceClient } from "../_shared/supabase.ts";
import { checkRateLimit, extractClientIp } from "../_shared/rate-limit.ts";
import { runChatCompletion } from "../_shared/ai-provider.ts";

const schema = z.object({
  query: z.string().min(3).max(4000),
  history: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string().min(1).max(4000),
  })).max(12).optional().default([]),
  sessionId: z.string().uuid().optional(),
  provider: z.enum(["openai", "groq", "nvidia"]).optional(),
  model: z.string().optional(),
});

const SYSTEM_PROMPT = `Você é o Assistente Jurídico do Sentinela Pedreira.

Regras obrigatórias:
- Responda em português do Brasil com linguagem clara.
- Priorize transparência pública, controle social, LAI, LRF e governança municipal.
- Não invente fontes. Quando houver base documental, cite pelo slug no formato [fonte:slug].
- Se não houver evidência suficiente, diga explicitamente.
- Não exponha segredos, tokens, chaves, nem dados pessoais sensíveis.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return handleOptionsRequest();
  }

  const requestId = crypto.randomUUID();

  try {
    if (req.method !== "POST") {
      return jsonResponse({ error: "method_not_allowed" }, 405);
    }

    const payload = schema.parse(await req.json());
    const authHeader = req.headers.get("Authorization");
    const ctx = await resolveAuthContext(authHeader, false);
    const service = getServiceClient();
    const clientIp = extractClientIp(req);

    const rateLimit = await checkRateLimit({
      scope: "legal_assistant.chat",
      key: ctx.user?.id ? `user:${ctx.user.id}` : `ip:${clientIp}`,
      limit: ctx.user
        ? Number(Deno.env.get("RATE_LIMIT_LEGAL_ASSISTANT_USER_MAX") ?? "40")
        : Number(Deno.env.get("RATE_LIMIT_LEGAL_ASSISTANT_ANON_MAX") ?? "12"),
      windowSeconds: Number(Deno.env.get("RATE_LIMIT_LEGAL_ASSISTANT_WINDOW_SECONDS") ?? "60"),
    });

    if (!rateLimit.allowed) {
      logInfo("legal-assistant.rate_limited", {
        requestId,
        userId: ctx.user?.id ?? null,
        clientIp,
        retryAfterSeconds: rateLimit.retryAfterSeconds,
        resetAt: rateLimit.resetAt,
      });

      return jsonResponse({
        requestId,
        error: "rate_limited",
        message: "Muitas solicitações para o Assistente Jurídico. Aguarde e tente novamente.",
        details: {
          retryAfterSeconds: rateLimit.retryAfterSeconds,
          resetAt: rateLimit.resetAt,
        },
      }, 429, {
        "Retry-After": String(rateLimit.retryAfterSeconds),
        "X-RateLimit-Limit": String(ctx.user
          ? Number(Deno.env.get("RATE_LIMIT_LEGAL_ASSISTANT_USER_MAX") ?? "40")
          : Number(Deno.env.get("RATE_LIMIT_LEGAL_ASSISTANT_ANON_MAX") ?? "12")),
        "X-RateLimit-Remaining": String(rateLimit.remaining),
        "X-RateLimit-Reset": rateLimit.resetAt,
      });
    }

    const { data: hits, error: searchError } = await service.rpc("search_public_documents", {
      p_query: payload.query,
      p_limit: 6,
      p_offset: 0,
    });

    if (searchError) {
      throw searchError;
    }

    const documents = (hits ?? []) as Array<{
      id: string;
      slug: string;
      title: string;
      summary: string | null;
      category: string;
    }>;

    const contextualDocs = documents
      .map((doc, index) => {
        const summary = (doc.summary ?? "").slice(0, 320);
        return `${index + 1}. [${doc.slug}] ${doc.title} (${doc.category}) - ${summary}`;
      })
      .join("\n");

    const userPrompt = `Pergunta do cidadão: ${payload.query}\n\nContexto recuperado:\n${contextualDocs || "Nenhum documento recuperado."}`;

    const messages = [
      { role: "system" as const, content: SYSTEM_PROMPT },
      ...payload.history.map((msg) => ({ role: msg.role as "user" | "assistant", content: msg.content })),
      { role: "user" as const, content: userPrompt },
    ];

    const completion = await runChatCompletion({
      provider: payload.provider,
      model: payload.model,
      messages,
      temperature: 0.2,
      maxTokens: 1400,
      timeoutMs: 30000,
    });

    let sessionId = payload.sessionId;
    let assistantMessageId: string | null = null;

    if (ctx.user) {
      if (!sessionId) {
        const { data: session, error: sessionError } = await service
          .from("chat_sessions")
          .insert({ user_id: ctx.user.id, title: payload.query.slice(0, 90), status: "active" })
          .select("id")
          .single();

        if (sessionError) throw sessionError;
        sessionId = session.id;
      }

      const { error: userMessageError } = await service.from("chat_messages").insert({
        session_id: sessionId,
        role: "user",
        content: payload.query,
        created_by: ctx.user.id,
      });
      if (userMessageError) throw userMessageError;

      const { data: assistantMessage, error: assistantMessageError } = await service
        .from("chat_messages")
        .insert({
          session_id: sessionId,
          role: "assistant",
          content: completion.content,
          citations: documents.map((doc) => ({ slug: doc.slug, title: doc.title })),
          confidence_score: 70,
          model_provider: completion.provider,
          model_name: completion.model,
          prompt_tokens: completion.usage?.prompt_tokens,
          completion_tokens: completion.usage?.completion_tokens,
          total_tokens: completion.usage?.total_tokens,
        })
        .select("id")
        .single();

      if (assistantMessageError) throw assistantMessageError;
      assistantMessageId = assistantMessage.id;

      const { error: retrievalLogError } = await service.from("retrieval_logs").insert({
        session_id: sessionId,
        message_id: assistantMessage.id,
        query: payload.query,
        top_k: 6,
        result_count: documents.length,
        retrieved_chunks: documents.map((doc) => ({
          id: doc.id,
          slug: doc.slug,
          title: doc.title,
          category: doc.category,
        })),
      });

      if (retrievalLogError) throw retrievalLogError;
    }

    logInfo("legal-assistant.success", {
      requestId,
      userId: ctx.user?.id ?? null,
      sessionId: sessionId ?? null,
      hits: documents.length,
      provider: completion.provider,
      model: completion.model,
    });

    return jsonResponse({
      requestId,
      sessionId: sessionId ?? null,
      messageId: assistantMessageId,
      content: completion.content,
      citations: documents.map((doc) => ({ slug: doc.slug, title: doc.title, category: doc.category })),
      usage: completion.usage,
      provider: completion.provider,
      model: completion.model,
    }, 200, {
      "X-RateLimit-Remaining": String(rateLimit.remaining),
      "X-RateLimit-Reset": rateLimit.resetAt,
    });
  } catch (error) {
    const normalized = toHttpError(error);
    logError("legal-assistant.error", {
      requestId,
      status: normalized.status,
      code: normalized.code,
      message: normalized.message,
      details: normalized.details,
    });

    const headers = normalized.status === 429
      ? {
        "Retry-After": String((normalized.details as { retryAfterSeconds?: number } | undefined)?.retryAfterSeconds ?? 60),
      }
      : {};

    return jsonResponse({
      requestId,
      error: normalized.code,
      message: normalized.message,
      details: normalized.details,
    }, normalized.status, headers);
  }
});
