import { z } from "npm:zod";
import { handleOptionsRequest, jsonResponse } from "../_shared/cors.ts";
import { toHttpError, HttpError } from "../_shared/errors.ts";
import { logError, logInfo } from "../_shared/logger.ts";
import { resolveAuthContext, ensureRole } from "../_shared/auth.ts";
import { getServiceClient } from "../_shared/supabase.ts";

const SOURCE_SLUG = "prefeitura-pedreira-diario-oficial";
const SOURCE_URL = "https://www.pedreira.sp.gov.br/diario-oficial";
const SOURCE_DOMAIN = "pedreira.sp.gov.br";

const providedItemSchema = z.object({
  editionNumber: z.number().int().min(1).max(999999),
  dateBr: z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/).optional(),
  dateIso: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  pdfUrl: z.string().url(),
  sourcePage: z.number().int().min(1).max(500).default(1),
}).superRefine((value, ctx) => {
  if (!value.dateBr && !value.dateIso) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Cada item deve conter dateBr ou dateIso.",
    });
  }
});

const requestSchema = z.object({
  mode: z.enum(["incremental", "backfill"]).default("incremental"),
  startPage: z.number().int().min(1).max(500).default(1),
  maxPages: z.number().int().min(1).max(500).optional(),
  dryRun: z.boolean().default(false),
  items: z.array(providedItemSchema).max(10000).optional(),
});

interface ParsedEdition {
  editionNumber: number;
  dateBr: string;
  dateIso: string;
  pdfUrl: string;
  sourcePage: number;
}

function decodeHtmlEntities(value: string) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&#225;", "á")
    .replaceAll("&#233;", "é")
    .replaceAll("&#237;", "í")
    .replaceAll("&#243;", "ó")
    .replaceAll("&#250;", "ú")
    .replaceAll("&#231;", "ç")
    .replaceAll("&nbsp;", " ");
}

function toIsoDate(dateBr: string) {
  const [day, month, year] = dateBr.split("/");
  if (!day || !month || !year) {
    throw new HttpError(422, "invalid_date", `Data inválida no HTML de origem: ${dateBr}`);
  }
  return `${year}-${month}-${day}`;
}

function toBrDate(dateIso: string) {
  const [year, month, day] = dateIso.split("-");
  if (!day || !month || !year) {
    throw new HttpError(422, "invalid_date", `Data ISO inválida no payload: ${dateIso}`);
  }
  return `${day}/${month}/${year}`;
}

function parseTotalPages(html: string) {
  const byAriaLabel = html.match(/aria-label="Paginação:\s*página\s*\d+\s*de\s*(\d+)"/i);
  if (byAriaLabel?.[1]) {
    return Number.parseInt(byAriaLabel[1], 10);
  }

  const selectMatch = html.match(/<select class="pagination__select"[\s\S]*?<\/select>/i);
  if (!selectMatch?.[0]) return null;
  const options = [...selectMatch[0].matchAll(/<option[^>]*>\s*(\d+)\s*<\/option>/gi)];
  if (options.length === 0) return null;
  return Number.parseInt(options[options.length - 1][1], 10);
}

function parseEditionsFromPage(html: string, page: number): ParsedEdition[] {
  const blocks = [...html.matchAll(/<article class="list-item">([\s\S]*?)<\/article>/gi)];
  const parsed: ParsedEdition[] = [];

  for (const blockMatch of blocks) {
    const block = blockMatch[1];
    if (!block) continue;

    const editionMatch =
      block.match(/Edição\s*n[º°]\s*(\d+)/i) ??
      block.match(/Baixar\s+Di(?:á|&#225;)rio\s+Oficial\s*n[º°]\s*(\d+)/i);
    const dateMatch = block.match(/(\d{2}\/\d{2}\/\d{4})/);
    const linkMatch = block.match(/<a\s+href="([^"]+)"[^>]*title="Baixar\s+Di(?:á|&#225;)rio\s+Oficial/i);

    if (!editionMatch?.[1] || !dateMatch?.[1] || !linkMatch?.[1]) {
      continue;
    }

    const editionNumber = Number.parseInt(editionMatch[1], 10);
    if (!Number.isFinite(editionNumber)) continue;

    const dateBr = dateMatch[1];
    const dateIso = toIsoDate(dateBr);
    const pdfUrl = decodeHtmlEntities(linkMatch[1].trim());

    parsed.push({
      editionNumber,
      dateBr,
      dateIso,
      pdfUrl,
      sourcePage: page,
    });
  }

  return parsed;
}

function getPageUrl(page: number) {
  if (page <= 1) return SOURCE_URL;
  return `${SOURCE_URL}?pagina=${page}`;
}

function getCandidateUrls(page: number) {
  if (page <= 1) {
    return [
      SOURCE_URL,
      `${SOURCE_URL}/`,
      `${SOURCE_URL}?pagina=1`,
    ];
  }
  return [
    `${SOURCE_URL}?pagina=${page}`,
    `${SOURCE_URL}/?pagina=${page}`,
  ];
}

function getRequestHeaderProfiles() {
  return [
    {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36",
      "Accept":
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
      "Cache-Control": "no-cache",
      "Pragma": "no-cache",
      "Referer": "https://www.pedreira.sp.gov.br/",
    },
    {
      "User-Agent":
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36",
      "Accept":
        "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "pt-BR,pt;q=0.9",
      "Cache-Control": "no-cache",
      "Pragma": "no-cache",
      "Referer": "https://www.pedreira.sp.gov.br/",
    },
  ];
}

async function fetchPageHtml(page: number) {
  const urls = getCandidateUrls(page);
  const headerProfiles = getRequestHeaderProfiles();
  const attemptErrors: Array<{ url: string; status: number; bodyPreview?: string }> = [];

  for (const url of urls) {
    for (const headers of headerProfiles) {
      const response = await fetch(url, {
        method: "GET",
        headers,
        redirect: "follow",
      });

      const body = await response.text();
      if (response.ok && body.includes('<article class="list-item">')) {
        return body;
      }

      attemptErrors.push({
        url,
        status: response.status,
        bodyPreview: body.slice(0, 220),
      });

      // backoff curto para reduzir bloqueio por burst
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  }

  throw new HttpError(502, "source_fetch_failed", `Falha ao consultar página ${page} do Diário Oficial.`, {
    page,
    attempts: attemptErrors,
  });
}

function isSecretAuthorized(req: Request) {
  const expected = Deno.env.get("DIARIO_SYNC_SECRET");
  const provided = req.headers.get("x-sync-secret");
  return Boolean(expected && provided && expected === provided);
}

function normalizeProvidedItems(items: z.infer<typeof providedItemSchema>[]): ParsedEdition[] {
  return items.map((item) => {
    const dateIso = item.dateIso ?? toIsoDate(item.dateBr ?? "");
    const dateBr = item.dateBr ?? toBrDate(dateIso);
    return {
      editionNumber: item.editionNumber,
      dateBr,
      dateIso,
      pdfUrl: item.pdfUrl,
      sourcePage: item.sourcePage ?? 1,
    };
  });
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

    const secretAuthorized = isSecretAuthorized(req);
    let actorUserId: string | null = null;

    if (!secretAuthorized) {
      const auth = await resolveAuthContext(req.headers.get("Authorization"), true);
      ensureRole(auth, ["editor", "admin"]);
      actorUserId = auth.user?.id ?? null;
    }

    const payload = requestSchema.parse(await req.json().catch(() => ({})));
    const service = getServiceClient();

    const { data: sourceRow, error: sourceError } = await service
      .from("sources")
      .upsert({
        slug: SOURCE_SLUG,
        name: "Diário Oficial - Prefeitura de Pedreira",
        domain: SOURCE_DOMAIN,
        source_type: "official_gazette",
        is_official: true,
        ingestion_status: "active",
        metadata: {
          source_url: SOURCE_URL,
          provider: "portal_prefeitura",
        },
        updated_by: actorUserId,
      }, { onConflict: "slug" })
      .select("id")
      .single();

    if (sourceError || !sourceRow) {
      throw new HttpError(500, "source_upsert_failed", "Falha ao preparar registro da fonte no banco.", sourceError);
    }

    const parsedBySlug = new Map<string, ParsedEdition>();
    let totalPages = payload.startPage;
    let lastPage = payload.startPage;
    let ingestionMode: "remote_fetch" | "provided_items" = "remote_fetch";

    if ((payload.items?.length ?? 0) > 0) {
      ingestionMode = "provided_items";
      const normalizedItems = normalizeProvidedItems(payload.items ?? []);
      for (const edition of normalizedItems) {
        const slug = `diario-oficial-pedreira-edicao-${edition.editionNumber}`;
        if (!parsedBySlug.has(slug)) {
          parsedBySlug.set(slug, edition);
        }
      }
    } else {
      const firstPageHtml = await fetchPageHtml(payload.startPage);
      totalPages = parseTotalPages(firstPageHtml) ?? payload.startPage;

      const resolvedMaxPages = payload.maxPages ??
        (payload.mode === "backfill" ? totalPages : 3);
      lastPage = Math.min(totalPages, payload.startPage + resolvedMaxPages - 1);

      for (let page = payload.startPage; page <= lastPage; page += 1) {
        const html = page === payload.startPage ? firstPageHtml : await fetchPageHtml(page);
        const editions = parseEditionsFromPage(html, page);

        for (const edition of editions) {
          const slug = `diario-oficial-pedreira-edicao-${edition.editionNumber}`;
          if (!parsedBySlug.has(slug)) {
            parsedBySlug.set(slug, edition);
          }
        }

        if (payload.mode === "incremental" && editions.length === 0) {
          break;
        }
      }
    }

    const parsedEditions = [...parsedBySlug.entries()].map(([slug, edition]) => ({
      slug,
      ...edition,
    }));

    if (parsedEditions.length === 0) {
      throw new HttpError(404, "no_editions_found", "Nenhuma edição encontrada para sincronização.");
    }

    const documentsPayload = parsedEditions.map((item) => ({
      source_id: sourceRow.id,
      external_ref: `pedreira-diario-oficial:${item.editionNumber}`,
      slug: item.slug,
      title: `Diário Oficial — Edição nº ${item.editionNumber}`,
      summary: `Edição nº ${item.editionNumber} publicada em ${item.dateBr}.`,
      category: "Diário Oficial",
      subtype: "diario-oficial",
      status: "published",
      publication_date: item.dateIso,
      published_at: `${item.dateIso}T12:00:00.000Z`,
      risk_level: "low",
      metadata: {
        edition_number: item.editionNumber,
        original_url: item.pdfUrl,
        source_page: item.sourcePage,
        source_url: getPageUrl(item.sourcePage),
        synced_at: new Date().toISOString(),
      },
      updated_by: actorUserId,
    }));

    let upsertedCount = 0;
    if (!payload.dryRun) {
      const { data: upserted, error: upsertError } = await service
        .from("documents")
        .upsert(documentsPayload, { onConflict: "slug" })
        .select("id");

      if (upsertError) {
        throw new HttpError(500, "documents_upsert_failed", "Falha ao persistir edições do Diário Oficial.", upsertError);
      }
      upsertedCount = upserted?.length ?? documentsPayload.length;

      const { error: sourceUpdateError } = await service
        .from("sources")
        .update({
          ingestion_status: "active",
          last_synced_at: new Date().toISOString(),
          updated_by: actorUserId,
        })
        .eq("id", sourceRow.id);

      if (sourceUpdateError) {
        throw new HttpError(500, "source_sync_update_failed", "Falha ao atualizar status de sincronização da fonte.", sourceUpdateError);
      }

      const { error: auditError } = await service.from("audit_logs").insert({
        action: "source.sync.diario_oficial",
        entity_type: "sources",
        entity_id: sourceRow.id,
        metadata: {
          requestId,
          mode: payload.mode,
          ingestionMode,
          startPage: payload.startPage,
          endPage: lastPage,
          parsedCount: parsedEditions.length,
          upsertedCount,
        },
        request_id: requestId,
        actor_user_id: actorUserId,
      });

      if (auditError) {
        throw new HttpError(500, "audit_log_failed", "Falha ao registrar auditoria da sincronização.", auditError);
      }
    }

    logInfo("diario-oficial-sync.success", {
      requestId,
      mode: payload.mode,
      ingestionMode,
      startPage: payload.startPage,
      endPage: lastPage,
      totalPages,
      parsedCount: parsedEditions.length,
      upsertedCount,
      dryRun: payload.dryRun,
      actorUserId,
      secretAuthorized,
    });

    return jsonResponse({
      requestId,
      sourceSlug: SOURCE_SLUG,
      mode: payload.mode,
      ingestionMode,
      startPage: payload.startPage,
      endPage: lastPage,
      totalPages,
      parsedCount: parsedEditions.length,
      upsertedCount,
      dryRun: payload.dryRun,
      items: parsedEditions.slice(0, 15),
    });
  } catch (error) {
    const normalized = toHttpError(error);
    logError("diario-oficial-sync.error", {
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
