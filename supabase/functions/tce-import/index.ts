import { z } from "npm:zod";
import { handleOptionsRequest, jsonResponse } from "../_shared/cors.ts";
import { HttpError, toHttpError } from "../_shared/errors.ts";
import { logError, logInfo } from "../_shared/logger.ts";
import { ensureRole, resolveAuthContext } from "../_shared/auth.ts";
import { getServiceClient } from "../_shared/supabase.ts";

const TCE_API_BASE = "https://transparencia.tce.sp.gov.br/api/json";

const requestSchema = z.object({
  municipioCodigo: z.string().min(3).max(32).default("pedreira"),
  exercicio: z.number().int().min(2000).max(2100).default(new Date().getFullYear()),
  mes: z.number().int().min(1).max(12).default(new Date().getMonth() + 1),
  force: z.boolean().default(false),
  replaceMonth: z.boolean().default(false),
  dryRun: z.boolean().default(false),
});

type JsonRecord = Record<string, unknown>;

function pickString(row: JsonRecord, keys: string[]) {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
    if (typeof value === "number" && Number.isFinite(value)) {
      return String(value);
    }
  }
  return null;
}

function pickNumber(row: JsonRecord, keys: string[]) {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === "string") {
      const normalized = Number.parseFloat(value.replace(/\./g, "").replace(",", "."));
      if (Number.isFinite(normalized)) {
        return normalized;
      }
    }
  }
  return null;
}

function pickDate(row: JsonRecord, keys: string[]) {
  for (const key of keys) {
    const value = row[key];
    if (typeof value !== "string") continue;
    const trimmed = value.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
      const [day, month, year] = trimmed.split("/");
      return `${year}-${month}-${day}`;
    }
  }
  return null;
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const keys = Object.keys(record).sort();
    return `{${keys.map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`).join(",")}}`;
  }

  return JSON.stringify(value);
}

async function sha256(input: string) {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function fetchJson(path: string) {
  const url = `${TCE_API_BASE}${path}`;
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Accept": "application/json",
      "User-Agent": "sentinela-pedreira/1.0 (+https://sentinela-pedreira.local)",
    },
  });

  if (!response.ok) {
    const bodyPreview = (await response.text()).slice(0, 280);
    throw new HttpError(502, "tce_source_fetch_failed", `Falha ao consultar endpoint TCE: ${path}`, {
      status: response.status,
      url,
      bodyPreview,
    });
  }

  return await response.json();
}

function toArray(payload: unknown) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    if (Array.isArray(record.data)) return record.data;
    if (Array.isArray(record.resultados)) return record.resultados;
  }

  return [];
}

function resolveMunicipioName(municipios: JsonRecord[], municipioCodigo: string) {
  const normalizedTarget = municipioCodigo.trim().toLowerCase();
  const match = municipios.find((item) => {
    const code = pickString(item, ["codigo", "codMunicipio", "id", "ibge", "cd_municipio", "municipio"]);
    const nomeExtenso = pickString(item, ["municipio_extenso", "nome", "nomeMunicipio", "nm_municipio"]);
    return (code?.toLowerCase() === normalizedTarget) || (nomeExtenso?.toLowerCase() === normalizedTarget);
  });

  if (!match) return null;
  return pickString(match, ["municipio", "nome", "nomeMunicipio", "nm_municipio"]);
}

async function normalizeReceitas(rows: JsonRecord[], context: {
  municipioCodigo: string;
  municipioNome: string | null;
  exercicio: number;
  mes: number;
  jobId: string;
}) {
  const result: Array<Record<string, unknown>> = [];

  for (const row of rows) {
    const rowHash = await sha256(stableStringify({
      scope: "receitas",
      municipioCodigo: context.municipioCodigo,
      exercicio: context.exercicio,
      mes: context.mes,
      row,
    }));

    result.push({
      job_id: context.jobId,
      municipio_codigo: context.municipioCodigo,
      municipio_nome: context.municipioNome,
      exercicio: context.exercicio,
      mes: context.mes,
      orgao: pickString(row, ["orgao", "nm_orgao", "nome_orgao", "Orgao", "unidade"]),
      conta: pickString(row, ["conta", "codigo_conta", "cd_conta", "conta_receita", "classificacao"]),
      categoria: pickString(row, ["categoria", "categoria_economica", "grupo", "tipo_receita"]),
      descricao: pickString(row, ["descricao", "historico", "receita", "nome", "ds_receita"]),
      fornecedor: pickString(row, ["contribuinte", "fornecedor", "favorecido", "credor"]),
      valor: pickNumber(row, ["valor", "valor_arrecadado", "vl_arrecadado", "valor_receita", "valorRealizado"]) ?? 0,
      valor_previsto: pickNumber(row, ["valor_previsto", "vl_previsto", "previsao", "valor_orcado"]),
      data_competencia: pickDate(row, ["data", "data_competencia", "dt_receita"]),
      external_id: pickString(row, ["id", "codigo", "sequencial", "cd_receita"]),
      row_hash: rowHash,
      raw: row,
    });
  }

  return result;
}

async function normalizeDespesas(rows: JsonRecord[], context: {
  municipioCodigo: string;
  municipioNome: string | null;
  exercicio: number;
  mes: number;
  jobId: string;
}) {
  const result: Array<Record<string, unknown>> = [];

  for (const row of rows) {
    const rowHash = await sha256(stableStringify({
      scope: "despesas",
      municipioCodigo: context.municipioCodigo,
      exercicio: context.exercicio,
      mes: context.mes,
      row,
    }));

    result.push({
      job_id: context.jobId,
      municipio_codigo: context.municipioCodigo,
      municipio_nome: context.municipioNome,
      exercicio: context.exercicio,
      mes: context.mes,
      orgao: pickString(row, ["orgao", "nm_orgao", "nome_orgao", "Orgao", "unidade"]),
      conta: pickString(row, ["conta", "codigo_conta", "cd_conta", "elemento"]),
      categoria: pickString(row, ["categoria", "categoria_economica", "grupo", "natureza"]),
      descricao: pickString(row, ["descricao", "historico", "despesa", "objeto", "descricao_despesa"]),
      fornecedor: pickString(row, ["fornecedor", "favorecido", "credor", "nome_fornecedor"]),
      valor: pickNumber(row, ["valor", "valor_pago", "vl_despesa", "valor_total"]) ?? 0,
      valor_empenhado: pickNumber(row, ["valor_empenhado", "empenhado", "vl_empenhado"]),
      valor_liquidado: pickNumber(row, ["valor_liquidado", "liquidado", "vl_liquidado"]),
      valor_pago: pickNumber(row, ["valor_pago", "pago", "vl_pago"]),
      data_competencia: pickDate(row, ["data", "data_competencia", "dt_despesa", "data_pagamento"]),
      external_id: pickString(row, ["id", "codigo", "sequencial", "numero_empenho"]),
      row_hash: rowHash,
      raw: row,
    });
  }

  return result;
}

async function upsertInChunks(
  table: "tce_receitas" | "tce_despesas",
  rows: Array<Record<string, unknown>>,
  onConflict: string,
) {
  const service = getServiceClient();
  const chunkSize = 500;

  for (let index = 0; index < rows.length; index += chunkSize) {
    const chunk = rows.slice(index, index + chunkSize);
    if (chunk.length === 0) continue;

    const { error } = await service
      .from(table)
      .upsert(chunk, { onConflict });

    if (error) {
      throw new HttpError(500, "tce_upsert_failed", `Falha ao persistir ${table}.`, {
        table,
        index,
        message: error.message,
      });
    }
  }
}

function dedupeByRowHash(rows: Array<Record<string, unknown>>) {
  const map = new Map<string, Record<string, unknown>>();
  for (const row of rows) {
    const rowHash = row.row_hash;
    if (typeof rowHash !== "string" || rowHash.length === 0) {
      continue;
    }
    if (!map.has(rowHash)) {
      map.set(rowHash, row);
    }
  }
  return [...map.values()];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return handleOptionsRequest();
  }

  const requestId = crypto.randomUUID();
  const service = getServiceClient();
  let jobId: string | null = null;

  try {
    if (req.method !== "POST") {
      return jsonResponse({ error: "method_not_allowed" }, 405);
    }

    const authHeader = req.headers.get("Authorization");
    const auth = await resolveAuthContext(authHeader, false);

    if (!auth.user) {
      const automationSecret = Deno.env.get("AUTOMATION_SECRET");
      const incomingSecret = req.headers.get("x-automation-secret");
      if (!automationSecret || incomingSecret !== automationSecret) {
        throw new HttpError(401, "unauthorized", "Chamada não autorizada para importação TCE.");
      }
    } else {
      ensureRole(auth, ["editor", "admin"]);
    }

    const payload = requestSchema.parse(await req.json().catch(() => ({})));
    const idempotencyKey = [
      "tce-sp-api",
      payload.municipioCodigo,
      payload.exercicio,
      payload.mes,
    ].join(":");

    const { data: existingJob, error: existingError } = await service
      .from("tce_import_jobs")
      .select("id, status, receitas_count, despesas_count, finished_at")
      .eq("idempotency_key", idempotencyKey)
      .maybeSingle();

    if (existingError) {
      throw new HttpError(500, "tce_existing_job_lookup_failed", "Falha ao consultar histórico de importação TCE.", existingError);
    }

    if (existingJob && existingJob.status === "completed" && !payload.force) {
      return jsonResponse({
        requestId,
        skipped: true,
        reason: "already_imported",
        idempotencyKey,
        previousJob: existingJob,
      });
    }

    const { data: runningJob, error: upsertJobError } = await service
      .from("tce_import_jobs")
      .upsert({
        id: existingJob?.id,
        source: "tce-sp-api",
        municipio_codigo: payload.municipioCodigo,
        exercicio: payload.exercicio,
        mes: payload.mes,
        status: "running",
        idempotency_key: idempotencyKey,
        payload,
        summary: { requestId, dryRun: payload.dryRun, force: payload.force },
        started_at: new Date().toISOString(),
        finished_at: null,
        error_message: null,
        requested_by: auth.user?.id ?? null,
      }, { onConflict: "idempotency_key" })
      .select("id")
      .single();

    if (upsertJobError || !runningJob) {
      throw new HttpError(500, "tce_job_upsert_failed", "Falha ao criar job de importação TCE.", upsertJobError);
    }

    jobId = runningJob.id;

    const municipiosPayload = await fetchJson("/municipios");
    const municipiosRows = toArray(municipiosPayload) as JsonRecord[];
    const municipioNome = resolveMunicipioName(municipiosRows, payload.municipioCodigo);

    const [receitasPayload, despesasPayload] = await Promise.all([
      fetchJson(`/receitas/${payload.municipioCodigo}/${payload.exercicio}/${payload.mes}`),
      fetchJson(`/despesas/${payload.municipioCodigo}/${payload.exercicio}/${payload.mes}`),
    ]);

    const receitasRows = toArray(receitasPayload) as JsonRecord[];
    const despesasRows = toArray(despesasPayload) as JsonRecord[];

    const [normalizedReceitas, normalizedDespesas] = await Promise.all([
      normalizeReceitas(receitasRows, {
        municipioCodigo: payload.municipioCodigo,
        municipioNome,
        exercicio: payload.exercicio,
        mes: payload.mes,
        jobId,
      }),
      normalizeDespesas(despesasRows, {
        municipioCodigo: payload.municipioCodigo,
        municipioNome,
        exercicio: payload.exercicio,
        mes: payload.mes,
        jobId,
      }),
    ]);

    const dedupedReceitas = dedupeByRowHash(normalizedReceitas);
    const dedupedDespesas = dedupeByRowHash(normalizedDespesas);

    if (!payload.dryRun) {
      if (payload.replaceMonth) {
        const [deleteReceitas, deleteDespesas] = await Promise.all([
          service
            .from("tce_receitas")
            .delete()
            .eq("municipio_codigo", payload.municipioCodigo)
            .eq("exercicio", payload.exercicio)
            .eq("mes", payload.mes),
          service
            .from("tce_despesas")
            .delete()
            .eq("municipio_codigo", payload.municipioCodigo)
            .eq("exercicio", payload.exercicio)
            .eq("mes", payload.mes),
        ]);

        if (deleteReceitas.error) {
          throw new HttpError(500, "tce_replace_receitas_failed", "Falha ao limpar receitas anteriores.", deleteReceitas.error);
        }
        if (deleteDespesas.error) {
          throw new HttpError(500, "tce_replace_despesas_failed", "Falha ao limpar despesas anteriores.", deleteDespesas.error);
        }
      }

      await upsertInChunks("tce_receitas", dedupedReceitas, "municipio_codigo,exercicio,mes,row_hash");
      await upsertInChunks("tce_despesas", dedupedDespesas, "municipio_codigo,exercicio,mes,row_hash");
    }

    const { error: completeError } = await service
      .from("tce_import_jobs")
      .update({
        municipio_nome: municipioNome,
        status: "completed",
        receitas_count: dedupedReceitas.length,
        despesas_count: dedupedDespesas.length,
        finished_at: new Date().toISOString(),
        summary: {
          requestId,
          dryRun: payload.dryRun,
          replaceMonth: payload.replaceMonth,
          municipiosEndpointCount: municipiosRows.length,
          receitasSourceCount: receitasRows.length,
          despesasSourceCount: despesasRows.length,
          receitasUpsertCount: dedupedReceitas.length,
          despesasUpsertCount: dedupedDespesas.length,
          receitasDroppedDuplicates: normalizedReceitas.length - dedupedReceitas.length,
          despesasDroppedDuplicates: normalizedDespesas.length - dedupedDespesas.length,
        },
      })
      .eq("id", jobId);

    if (completeError) {
      throw new HttpError(500, "tce_job_complete_failed", "Falha ao finalizar status do job TCE.", completeError);
    }

    logInfo("tce-import.success", {
      requestId,
      jobId,
      municipioCodigo: payload.municipioCodigo,
      exercicio: payload.exercicio,
      mes: payload.mes,
      dryRun: payload.dryRun,
      receitasCount: dedupedReceitas.length,
      despesasCount: dedupedDespesas.length,
    });

    return jsonResponse({
      requestId,
      jobId,
      dryRun: payload.dryRun,
      municipio: {
        codigo: payload.municipioCodigo,
        nome: municipioNome,
      },
      exercicio: payload.exercicio,
      mes: payload.mes,
      receitas: {
        sourceCount: receitasRows.length,
        persistedCount: dedupedReceitas.length,
      },
      despesas: {
        sourceCount: despesasRows.length,
        persistedCount: dedupedDespesas.length,
      },
    });
  } catch (error) {
    const normalized = toHttpError(error);

    if (jobId) {
      await service
        .from("tce_import_jobs")
        .update({
          status: "failed",
          finished_at: new Date().toISOString(),
          error_message: normalized.message,
          summary: {
            requestId,
            error: normalized.code,
            details: normalized.details,
          },
        })
        .eq("id", jobId);
    }

    logError("tce-import.error", {
      requestId,
      jobId,
      status: normalized.status,
      code: normalized.code,
      message: normalized.message,
      details: normalized.details,
    });

    return jsonResponse({
      requestId,
      jobId,
      error: normalized.code,
      message: normalized.message,
      details: normalized.details,
    }, normalized.status);
  }
});
