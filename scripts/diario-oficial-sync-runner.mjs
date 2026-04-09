#!/usr/bin/env node

const SOURCE_URL = "https://www.pedreira.sp.gov.br/diario-oficial";

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) {
      args[key] = true;
      continue;
    }
    args[key] = next;
    i += 1;
  }
  return args;
}

function decodeHtmlEntities(value) {
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

function parseTotalPages(html) {
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

function parseEditionsFromPage(html, page) {
  const blocks = [...html.matchAll(/<article class="list-item">([\s\S]*?)<\/article>/gi)];
  const parsed = [];

  for (const blockMatch of blocks) {
    const block = blockMatch[1];
    if (!block) continue;

    const editionMatch =
      block.match(/Edição\s*n[º°]\s*(\d+)/i) ??
      block.match(/Baixar\s+Di(?:á|&#225;)rio\s+Oficial\s*n[º°]\s*(\d+)/i);
    const dateMatch = block.match(/(\d{2}\/\d{2}\/\d{4})/);
    const linkMatch = block.match(/<a\s+href="([^"]+)"[^>]*title="Baixar\s+Di(?:á|&#225;)rio\s+Oficial/i);

    if (!editionMatch?.[1] || !dateMatch?.[1] || !linkMatch?.[1]) continue;
    const editionNumber = Number.parseInt(editionMatch[1], 10);
    if (!Number.isFinite(editionNumber)) continue;

    parsed.push({
      editionNumber,
      dateBr: dateMatch[1],
      pdfUrl: decodeHtmlEntities(linkMatch[1].trim()),
      sourcePage: page,
    });
  }

  return parsed;
}

function candidateUrls(page) {
  if (page <= 1) {
    return [SOURCE_URL, `${SOURCE_URL}/`, `${SOURCE_URL}?pagina=1`];
  }
  return [`${SOURCE_URL}?pagina=${page}`, `${SOURCE_URL}/?pagina=${page}`];
}

function requestHeaderProfiles() {
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
  ];
}

async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchPageHtml(page) {
  const attempts = [];
  for (const url of candidateUrls(page)) {
    for (const headers of requestHeaderProfiles()) {
      let response;
      try {
        response = await fetchWithTimeout(
          url,
          {
            method: "GET",
            headers,
            redirect: "follow",
          },
          25000,
        );
      } catch (error) {
        attempts.push({ url, error: String(error) });
        continue;
      }

      const body = await response.text();
      if (response.ok && body.includes('<article class="list-item">')) {
        return body;
      }

      attempts.push({
        url,
        status: response.status,
        bodyPreview: body.slice(0, 180),
      });
    }
  }

  const details = JSON.stringify(attempts, null, 2);
  throw new Error(`Falha ao coletar página ${page}. Tentativas:\n${details}`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const mode = args.mode === "backfill" ? "backfill" : "incremental";
  const startPage = Number.parseInt(String(args["start-page"] ?? "1"), 10);
  const dryRun = Boolean(args["dry-run"]);

  if (!Number.isFinite(startPage) || startPage < 1) {
    throw new Error("--start-page inválido.");
  }

  const maxPagesArg = args["max-pages"] == null ? null : Number.parseInt(String(args["max-pages"]), 10);
  if (maxPagesArg != null && (!Number.isFinite(maxPagesArg) || maxPagesArg < 1)) {
    throw new Error("--max-pages inválido.");
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const syncSecret = process.env.DIARIO_SYNC_SECRET;
  const functionUrl = process.env.SUPABASE_FUNCTION_URL ??
    (supabaseUrl ? `${supabaseUrl.replace(/\/$/, "")}/functions/v1/diario-oficial-sync` : null);

  if (!functionUrl) {
    throw new Error("Defina SUPABASE_URL ou SUPABASE_FUNCTION_URL.");
  }
  if (!syncSecret) {
    throw new Error("Defina DIARIO_SYNC_SECRET.");
  }

  console.log(`[sync] Coletando Diário Oficial (${mode})...`);
  const firstPageHtml = await fetchPageHtml(startPage);
  const totalPages = parseTotalPages(firstPageHtml) ?? startPage;
  const defaultMaxPages = mode === "backfill" ? totalPages : 3;
  const resolvedMaxPages = maxPagesArg ?? defaultMaxPages;
  const lastPage = Math.min(totalPages, startPage + resolvedMaxPages - 1);

  const parsedBySlug = new Map();
  for (let page = startPage; page <= lastPage; page += 1) {
    const html = page === startPage ? firstPageHtml : await fetchPageHtml(page);
    const editions = parseEditionsFromPage(html, page);
    for (const item of editions) {
      const slug = `diario-oficial-pedreira-edicao-${item.editionNumber}`;
      if (!parsedBySlug.has(slug)) {
        parsedBySlug.set(slug, item);
      }
    }
    if (mode === "incremental" && editions.length === 0) {
      break;
    }
  }

  const items = [...parsedBySlug.values()];
  if (items.length === 0) {
    throw new Error("Nenhuma edição encontrada no HTML coletado.");
  }

  console.log(`[sync] ${items.length} edições coletadas. Enviando para Edge Function...`);

  const response = await fetch(functionUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-sync-secret": syncSecret,
    },
    body: JSON.stringify({
      mode,
      startPage,
      maxPages: resolvedMaxPages,
      dryRun,
      items,
    }),
  });

  const bodyText = await response.text();
  let bodyJson = null;
  try {
    bodyJson = JSON.parse(bodyText);
  } catch {
    bodyJson = bodyText;
  }

  if (!response.ok) {
    throw new Error(`Edge Function retornou ${response.status}: ${JSON.stringify(bodyJson, null, 2)}`);
  }

  console.log("[sync] Sucesso:", JSON.stringify(bodyJson, null, 2));
}

main().catch((error) => {
  console.error("[sync] Falha:", error.message ?? error);
  process.exit(1);
});
