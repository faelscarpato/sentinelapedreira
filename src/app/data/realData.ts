import { fiscalizaData } from "./generated/fiscalizaData";
import prestacaoSource0 from "./sources/prestacao-2026-04-02-0.json";
import prestacaoSource1 from "./sources/prestacao-2026-04-02-1.json";
import prestacaoSource2 from "./sources/prestacao-2026-04-02-2.json";
import prestacaoSource3 from "./sources/prestacao-2026-04-02-3.json";
import prestacaoSource4 from "./sources/prestacao-2026-04-02-4.json";
import portaisSource from "./sources/pedreira_portais_coleta.json";

type BaseDocument = (typeof fiscalizaData.documents)[number];
type BaseMissingDocument = (typeof fiscalizaData.missingDocuments)[number];
type BaseReport = (typeof fiscalizaData.reports)[number];
type PrestacaoSourceRow = Record<string, unknown>;
type PortalSourceRow = {
  fonte?: string;
  categoria?: string;
  subtipo?: string;
  ano?: number | string | null;
  url_pagina?: string | null;
  titulo?: string | null;
  documento_url?: string | null;
  observacao?: string | null;
};

export interface Document {
  id: string;
  source: string;
  domain: string;
  categoryKey: string;
  category: string;
  subtype?: string;
  title: string;
  summary: string;
  date: string;
  year: number;
  month: number;
  tags: string[];
  sourceEntity: string;
  originalUrl?: string;
  previewMode?: "pdf" | "download" | "page" | "external";
  analysisUrl?: string;
  hasAnalysis: boolean;
  riskLevel?: "critical" | "high" | "medium" | "low";
  isFeatured: boolean;
  status: "published" | "pending" | "missing";
}

export interface Report {
  id: string;
  title: string;
  category: string;
  date: string;
  summary: string;
  tags: string[];
  content: string;
  sources: string[];
  confidenceLevel: "high" | "medium" | "preliminary";
}

const documents = fiscalizaData.documents as BaseDocument[];
const missingDocumentsBase = fiscalizaData.missingDocuments as BaseMissingDocument[];
const reportsBase = fiscalizaData.reports as BaseReport[];

const categoryLabel: Record<BaseDocument["category"], string> = {
  "diario-oficial": "Diário Oficial",
  "camara-legislativa": "Câmara Legislativa",
  "contas-publicas": "Contas Públicas",
  "controle-externo": "Controle Externo",
  repasses: "Repasses",
  "terceiro-setor": "Terceiro Setor",
};

export const categoryRouteByKey: Record<BaseDocument["category"], string> = {
  "diario-oficial": "/diario-oficial",
  "camara-legislativa": "/camara",
  "contas-publicas": "/contas-publicas",
  "controle-externo": "/controle-externo",
  repasses: "/repasses",
  "terceiro-setor": "/terceiro-setor",
};

export const categoryRouteByLabel: Record<string, string> = Object.entries(categoryLabel).reduce(
  (accumulator, [key, label]) => {
    accumulator[label] = categoryRouteByKey[key as BaseDocument["category"]];
    return accumulator;
  },
  {} as Record<string, string>,
);

const categoryReportFallback: Partial<Record<BaseDocument["category"], string>> = {
  "diario-oficial": "relatorio-radar-diario-oficial",
  "camara-legislativa": "relatorio-radar-legislativo",
  "contas-publicas": "relatorio-painel-orcamentario-2025",
  "controle-externo": "relatorio-radar-controle-externo",
  repasses: "relatorio-radar-repasses",
  "terceiro-setor": "relatorio-radar-terceiro-setor",
};

const reportByRelatedDocumentId = new Map<string, string>();
for (const report of reportsBase) {
  for (const documentId of report.relatedDocumentIds) {
    if (!reportByRelatedDocumentId.has(documentId)) {
      reportByRelatedDocumentId.set(documentId, report.id);
    }
  }
}

function toRiskLevel(value: BaseDocument["riskLevel"]): Document["riskLevel"] {
  if (value === "critico") return "critical";
  if (value === "alto") return "high";
  if (value === "medio") return "medium";
  return "low";
}

function toDocumentStatus(value: BaseDocument["status"]): Document["status"] {
  if (value === "pendente" || value === "em-tramite") return "pending";
  return "published";
}

function normalizeSubtype(value: string) {
  return value.replace(/-/g, " ").replace(/\b\w/g, (match) => match.toUpperCase());
}

function cleanPlaceholders(value: string | undefined) {
  if (!value) return "";
  return value
    .replace(/\bundefined\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+,/g, ",")
    .trim();
}

function normalizeUrlTitle(value: string) {
  return value
    .replace(/\s+/g, " ")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .toLowerCase();
}

function slugify(value: string) {
  return normalizeUrlTitle(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function asNonEmptyString(value: unknown) {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
}

function resolveSocialShareUrl(url: URL) {
  const host = url.hostname.toLowerCase();

  if (host.includes("facebook.com")) {
    const candidate = url.searchParams.get("u");
    return asNonEmptyString(candidate);
  }

  if (host === "twitter.com" || host === "x.com") {
    const candidate = url.searchParams.get("url");
    return asNonEmptyString(candidate);
  }

  if (host.includes("linkedin.com")) {
    const candidate = url.searchParams.get("url");
    return asNonEmptyString(candidate);
  }

  if (host === "wa.me" || host === "api.whatsapp.com") {
    const message = url.searchParams.get("text");
    if (!message) return undefined;
    const decodedMessage = decodeURIComponent(message.replace(/\+/g, " "));
    const matchedUrl = decodedMessage.match(/https?:\/\/\S+/i);
    return matchedUrl?.[0];
  }

  return undefined;
}

function normalizeSourceUrl(url: string | undefined) {
  const normalized = asNonEmptyString(url);
  if (!normalized) return undefined;
  if (!/^https?:\/\//i.test(normalized)) return undefined;

  let parsed: URL;
  try {
    parsed = new URL(normalized);
  } catch {
    return undefined;
  }

  const shareTarget = resolveSocialShareUrl(parsed);
  if (shareTarget) {
    return normalizeSourceUrl(shareTarget);
  }

  const host = parsed.hostname.toLowerCase();
  const pathname = parsed.pathname.replace(/\/+$/, "") || "/";

  if (host === "intranet.pedreira.sp.gov.br") return undefined;
  if (host === "ecrie.com.br" && pathname === "/") return undefined;
  if (host === "ecrie20.com.br" && pathname.endsWith("/feed.xml")) return undefined;

  if ((host === "pedreira.sp.gov.br" || host === "www.pedreira.sp.gov.br") && pathname === "/" && !parsed.search) {
    return undefined;
  }

  if (host === "pedreira.sp.gov.br") {
    parsed.hostname = "www.pedreira.sp.gov.br";
  }

  parsed.hash = "";
  if (parsed.pathname.length > 1) {
    parsed.pathname = parsed.pathname.replace(/\/+$/, "");
  }

  return parsed.toString();
}

function scoreSourceQuality(document: Document) {
  let score = 0;

  if (document.originalUrl) score += 100;
  if (document.previewMode === "pdf") score += 30;
  if (document.previewMode === "download") score += 15;
  if (document.previewMode === "page" || document.previewMode === "external") score += 10;
  if (document.originalUrl === "https://transparencia.tce.sp.gov.br/municipio/pedreira") score -= 5;

  return score;
}

function inferPreviewMode(url: string | undefined, fallback: Document["previewMode"] | undefined) {
  if (!url) return fallback;
  if (/\.pdf(\?|#|$)/i.test(url)) return "pdf";
  if (/\.(ppt|pptx|doc|docx|xls|xlsx|csv)(\?|#|$)/i.test(url)) return "download";
  return fallback ?? "external";
}

function normalizeDocumentSource(document: Document): Document {
  const normalizedUrl = normalizeSourceUrl(document.originalUrl);
  return {
    ...document,
    originalUrl: normalizedUrl,
    previewMode: inferPreviewMode(normalizedUrl, document.previewMode),
  };
}

function dedupeDocuments(documents: Document[]) {
  const dedupedByContent = new Map<string, Document>();

  for (const document of documents) {
    const key = [
      document.categoryKey,
      normalizeUrlTitle(document.subtype ?? ""),
      normalizeUrlTitle(document.title),
      document.date,
    ].join("|");

    const existing = dedupedByContent.get(key);
    if (!existing || scoreSourceQuality(document) > scoreSourceQuality(existing)) {
      dedupedByContent.set(key, document);
    }
  }

  return Array.from(dedupedByContent.values());
}

function dedupeByUrl(documents: Document[]) {
  const documentsByUrl = new Map<string, Document>();
  const documentsWithoutUrl: Document[] = [];

  for (const document of documents) {
    const normalizedUrl = document.originalUrl?.toLowerCase();
    if (!normalizedUrl) {
      documentsWithoutUrl.push(document);
      continue;
    }

    const existing = documentsByUrl.get(normalizedUrl);
    if (!existing || scoreSourceQuality(document) > scoreSourceQuality(existing)) {
      documentsByUrl.set(normalizedUrl, document);
    }
  }

  return [...documentsByUrl.values(), ...documentsWithoutUrl];
}

function isBrokenContasDocument(document: Document) {
  if (document.categoryKey !== "contas-publicas") return false;
  const url = document.originalUrl;
  if (!url) return true;
  return url === "https://transparencia.tce.sp.gov.br/municipio/pedreira";
}

function isRelevantContasDocument(document: Document) {
  if (document.categoryKey !== "contas-publicas") return true;
  if (!document.originalUrl) return false;
  return isLikelyContasUrl(document.originalUrl);
}

function isLikelyContasUrl(url: string) {
  const normalized = url.toLowerCase();
  return (
    normalized.includes("/contas-publicas/") ||
    normalized.endsWith("/contas-publicas") ||
    normalized.includes("transparencia.tce.sp.gov.br") ||
    /\.(pdf|ppt|pptx|doc|docx|xls|xlsx|csv)(\?|#|$)/i.test(normalized)
  );
}

function inferPortalSubtype(title: string, url: string) {
  const text = `${title} ${url}`.toLowerCase();
  if (text.includes("rreo")) return "RREO";
  if (text.includes("rgf")) return "RGF";
  if (text.includes("balanc")) return "Balanço";
  if (text.includes("receita")) return "Receita";
  if (text.includes("despesa")) return "Despesa";
  if (text.includes("loa")) return "LOA";
  if (text.includes("ldo")) return "LDO";
  if (text.includes("ppa")) return "PPA";
  if (text.includes("metas")) return "Metas Fiscais";
  if (text.includes("terceiro-setor") || text.includes("terceiro setor")) return "Terceiro Setor";
  if (text.includes("parecer")) return "Pareceres";
  if (text.includes("audien")) return "Audiência Pública";
  if (text.includes("planejamento")) return "Planejamento";
  return "Documentação Fiscal";
}

function inferYearFromText(text: string, fallbackYear: number) {
  const matched = text.match(/\b(20\d{2})\b/);
  return matched ? Number(matched[1]) : fallbackYear;
}

function sortDocuments(documents: Document[]) {
  return [...documents].sort((left, right) => {
    const dateDelta = Date.parse(right.date) - Date.parse(left.date);
    if (dateDelta !== 0) return dateDelta;

    const sourceDelta = scoreSourceQuality(right) - scoreSourceQuality(left);
    if (sourceDelta !== 0) return sourceDelta;

    return left.title.localeCompare(right.title, "pt-BR");
  });
}

function parsePrestacaoLinks(rows: PrestacaoSourceRow[]) {
  const links: Array<{ title: string; url: string }> = [];

  for (const row of rows) {
    const hrefKeys = Object.keys(row)
      .filter((key) => key.startsWith("page-grid href"))
      .sort((left, right) => {
        const leftOrder = Number(left.match(/\((\d+)\)/)?.[1] ?? "1");
        const rightOrder = Number(right.match(/\((\d+)\)/)?.[1] ?? "1");
        return leftOrder - rightOrder;
      });

    for (const hrefKey of hrefKeys) {
      const sourceUrl = normalizeSourceUrl(asNonEmptyString(row[hrefKey]));
      if (!sourceUrl) continue;

      const titleKey = hrefKey.replace(" href", "");
      const title =
        asNonEmptyString(row[titleKey]) ??
        asNonEmptyString(row["page-grid"]) ??
        "Documento de prestação de contas";

      links.push({ title, url: sourceUrl });
    }
  }

  return links;
}

function buildSupplementalPrestacaoDocuments() {
  const sourceConfigs: Array<{
    rows: PrestacaoSourceRow[];
    subtype: string;
    tag: string;
    contexto: string;
  }> = [
    {
      rows: prestacaoSource0 as PrestacaoSourceRow[],
      subtype: "Prestação PPA",
      tag: "PPA",
      contexto: "planejamento plurianual",
    },
    {
      rows: prestacaoSource1 as PrestacaoSourceRow[],
      subtype: "Prestação LDO",
      tag: "LDO",
      contexto: "diretrizes orçamentárias",
    },
    {
      rows: prestacaoSource2 as PrestacaoSourceRow[],
      subtype: "Prestação LDO Quadrimestral",
      tag: "LDO",
      contexto: "prestação quadrimestral",
    },
    {
      rows: prestacaoSource3 as PrestacaoSourceRow[],
      subtype: "Metas Fiscais",
      tag: "Metas Fiscais",
      contexto: "avaliação de metas fiscais",
    },
    {
      rows: prestacaoSource4 as PrestacaoSourceRow[],
      subtype: "Relatório de Gestão Fiscal",
      tag: "RGF",
      contexto: "gestão fiscal quadrimestral",
    },
  ];

  const analysisUrl = categoryReportFallback["contas-publicas"]
    ? `/relatorios/${categoryReportFallback["contas-publicas"]}`
    : undefined;

  const indexed = new Map<string, Document>();
  const baseDate = "2026-04-02";

  sourceConfigs.forEach((config, sourceIndex) => {
    const links = parsePrestacaoLinks(config.rows);

    links.forEach((item, itemIndex) => {
      const dedupeKey = `${config.subtype}|${normalizeUrlTitle(item.title)}|${item.url}`;
      if (indexed.has(dedupeKey)) return;

      const isPdf = /\.pdf(\?|#|$)/i.test(item.url);
      const generatedId = [
        "prestacao",
        sourceIndex + 1,
        itemIndex + 1,
        slugify(item.title).slice(0, 48) || `item-${itemIndex + 1}`,
      ].join("-");

      const document: Document = {
        id: generatedId,
        source: "prestacao-de-contas-json",
        domain: new URL(item.url).hostname,
        categoryKey: "contas-publicas",
        category: "Contas Públicas",
        subtype: config.subtype,
        title: item.title,
        summary: isPdf
          ? `Documento oficial de ${config.contexto} com arquivo PDF para leitura imediata.`
          : `Página oficial de ${config.contexto} para consulta pública do conteúdo completo.`,
        date: baseDate,
        year: 2026,
        month: 4,
        tags: ["Prestação de Contas", config.tag, isPdf ? "PDF oficial" : "Página oficial"],
        sourceEntity: "Prefeitura de Pedreira",
        originalUrl: item.url,
        previewMode: isPdf ? "pdf" : "external",
        analysisUrl,
        hasAnalysis: Boolean(analysisUrl),
        riskLevel: "low",
        isFeatured: false,
        status: "published",
      };

      indexed.set(dedupeKey, document);
    });
  });

  return Array.from(indexed.values());
}

function buildPortalContasDocuments() {
  const rows = portaisSource as PortalSourceRow[];
  const analysisUrl = categoryReportFallback["contas-publicas"]
    ? `/relatorios/${categoryReportFallback["contas-publicas"]}`
    : undefined;

  const baseYear = Number(fiscalizaData.updatedAt.slice(0, 4));
  const indexed = new Map<string, Document>();

  rows.forEach((row, rowIndex) => {
    if (row.categoria !== "contas_publicas") return;

    const normalizedUrl = normalizeSourceUrl(asNonEmptyString(row.documento_url));
    if (!normalizedUrl || !isLikelyContasUrl(normalizedUrl)) return;

    const title = asNonEmptyString(row.titulo) ?? "Documento de Contas Públicas";
    const sourcePage = normalizeSourceUrl(asNonEmptyString(row.url_pagina));
    const summaryPrefix = sourcePage
      ? "Link oficial indexado a partir do portal de contas públicas municipal."
      : "Link oficial indexado a partir da base consolidada de portais municipais.";
    const summary = cleanPlaceholders(row.observacao ?? "")
      ? `${summaryPrefix} ${cleanPlaceholders(row.observacao ?? "")}`
      : summaryPrefix;

    const year =
      typeof row.ano === "number"
        ? row.ano
        : inferYearFromText(`${title} ${normalizedUrl}`, baseYear);

    const generatedId = [
      "contas-link",
      rowIndex + 1,
      slugify(title).slice(0, 40) || `item-${rowIndex + 1}`,
    ].join("-");

    const previewMode = inferPreviewMode(normalizedUrl, "external");
    const document: Document = {
      id: generatedId,
      source: asNonEmptyString(row.fonte) ?? "pedreira-portais-coleta",
      domain: new URL(normalizedUrl).hostname,
      categoryKey: "contas-publicas",
      category: "Contas Públicas",
      subtype: inferPortalSubtype(title, normalizedUrl),
      title,
      summary,
      date: fiscalizaData.updatedAt,
      year,
      month: 1,
      tags: [
        "Contas Públicas",
        "Link oficial",
        previewMode === "pdf" ? "PDF oficial" : "Página oficial",
      ],
      sourceEntity: "Portal de Transparência de Pedreira",
      originalUrl: normalizedUrl,
      previewMode,
      analysisUrl,
      hasAnalysis: Boolean(analysisUrl),
      riskLevel: "low",
      isFeatured: false,
      status: "published",
    };

    const dedupeKey = `${normalizeUrlTitle(title)}|${normalizedUrl}`;
    const existing = indexed.get(dedupeKey);
    if (!existing || scoreSourceQuality(document) > scoreSourceQuality(existing)) {
      indexed.set(dedupeKey, document);
    }
  });

  return Array.from(indexed.values());
}

function buildSupplementalLeiOrganicaDocuments() {
  const analysisUrl = categoryReportFallback["camara-legislativa"]
    ? `/relatorios/${categoryReportFallback["camara-legislativa"]}`
    : undefined;

  const files = [
    {
      id: "lei-organica-lc-2260-2001",
      title: "Lei Complementar nº 2.260/2001",
      file: "/documentos/lei-organica/lc-2260-2001-pedreira-sp.pdf",
      tags: ["Lei Complementar", "Base legal"],
    },
    {
      id: "lei-organica-ord-1765-1994",
      title: "Lei Ordinária nº 1.765/1994",
      file: "/documentos/lei-organica/ord-1765-1994-pedreira-sp.pdf",
      tags: ["Lei Ordinária", "Base legal"],
    },
    {
      id: "lei-organica-ord-2551-2005",
      title: "Lei Ordinária nº 2.551/2005",
      file: "/documentos/lei-organica/ord-2551-2005-pedreira-sp.pdf",
      tags: ["Lei Ordinária", "Base legal"],
    },
    {
      id: "lei-organica-anexo-vii-1765-1994",
      title: "Anexo VII - Lei Ordinária nº 1.765/1994",
      file: "/documentos/lei-organica/anexo-lei-ordinaria-1765-1994-pedreira-sp-2-anexo-vii.pdf",
      tags: ["Anexo legal", "Lei Orgânica"],
    },
  ];

  return files.map((file) => ({
    id: file.id,
    source: "lei-organica-local",
    domain: "pedreira.sp.gov.br",
    categoryKey: "camara-legislativa",
    category: "Câmara Legislativa",
    subtype: "Lei Orgânica",
    title: file.title,
    summary: "Documento normativo municipal disponibilizado em PDF para leitura direta no portal.",
    date: "2026-04-02",
    year: 2026,
    month: 4,
    tags: [...file.tags, "PDF oficial"],
    sourceEntity: "Legislação Municipal de Pedreira",
    originalUrl: file.file,
    previewMode: "pdf" as const,
    analysisUrl,
    hasAnalysis: Boolean(analysisUrl),
    riskLevel: "low" as const,
    isFeatured: false,
    status: "published" as const,
  }));
}

function resolveReportPath(document: BaseDocument) {
  const relatedReportId = reportByRelatedDocumentId.get(document.id);
  if (relatedReportId) return `/relatorios/${relatedReportId}`;

  const fallbackReport = categoryReportFallback[document.category];
  if (fallbackReport) return `/relatorios/${fallbackReport}`;

  const firstReport = reportsBase[0];
  return firstReport ? `/relatorios/${firstReport.id}` : undefined;
}

function toFrontendDocument(document: BaseDocument): Document {
  const analysisUrl = resolveReportPath(document);

  return {
    id: document.id,
    source: document.source,
    domain: document.domain,
    categoryKey: document.category,
    category: categoryLabel[document.category],
    subtype: normalizeSubtype(document.subtype),
    title: document.title,
    summary: document.summary,
    date: document.date,
    year: document.year ?? Number(document.date.slice(0, 4)),
    month: document.month ?? Number(document.date.slice(5, 7)),
    tags: document.tags,
    sourceEntity: document.sourceEntity,
    originalUrl: document.originalUrl,
    previewMode: document.previewMode,
    analysisUrl,
    hasAnalysis: Boolean(analysisUrl),
    riskLevel: toRiskLevel(document.riskLevel),
    isFeatured: document.isFeatured,
    status: toDocumentStatus(document.status),
  };
}

function inferMissingYear(period: string) {
  const match = period.match(/\b(20\d{2})\b/);
  if (match) return Number(match[1]);
  return Number(fiscalizaData.updatedAt.slice(0, 4));
}

function toMissingRisk(status: BaseMissingDocument["status"]): Document["riskLevel"] {
  if (status === "nao-localizado") return "high";
  if (status === "pendente-de-verificacao") return "medium";
  return "medium";
}

function toMissingDocument(item: BaseMissingDocument, index: number): Document {
  const year = inferMissingYear(item.expectedPeriod);
  const reportId = reportsBase.find((report) => report.id === "relatorio-radar-transparencia-ativa")?.id;
  const subtype = cleanPlaceholders(item.category) || "documento-faltante";
  const title = cleanPlaceholders(item.documentName) || `Documento faltante ${index + 1}`;
  const expectedPeriod = cleanPlaceholders(item.expectedPeriod);
  const summary = [cleanPlaceholders(item.summary), cleanPlaceholders(item.note)]
    .filter(Boolean)
    .join(" ");
  const normalizedStatus = cleanPlaceholders(item.status.replace(/-/g, " "));
  const generatedId = cleanPlaceholders(item.id);
  const id = `${generatedId || "faltante"}-${index}`;

  return {
    id,
    source: "radar-transparencia",
    domain: "pedreira.sp.gov.br",
    categoryKey: "documentos-faltantes",
    category: "Documentos Faltantes",
    subtype,
    title,
    summary,
    date: fiscalizaData.updatedAt,
    year,
    month: 1,
    tags: [normalizedStatus, subtype, expectedPeriod].filter(Boolean),
    sourceEntity: "Radar de Transparência",
    originalUrl: item.relatedUrl,
    previewMode: "external",
    analysisUrl: reportId ? `/relatorios/${reportId}` : undefined,
    hasAnalysis: Boolean(reportId),
    riskLevel: toMissingRisk(item.status),
    isFeatured: true,
    status: "missing",
  };
}

function toReportConfidence(level: BaseReport["confidence"]): Report["confidenceLevel"] {
  if (level === "alta") return "high";
  if (level === "media") return "medium";
  return "preliminary";
}

function toFrontendReport(report: BaseReport): Report {
  return {
    id: report.id,
    title: report.title,
    category: report.category,
    date: report.date,
    summary: report.summary,
    tags: report.tags,
    content: report.markdown,
    sources: report.sources,
    confidenceLevel: toReportConfidence(report.confidence),
  };
}

const normalizedBaseDocuments = documents
  .map(toFrontendDocument)
  .map(normalizeDocumentSource)
  .filter((document) => !isBrokenContasDocument(document))
  .filter(isRelevantContasDocument);
const supplementalDocuments = [
  ...buildPortalContasDocuments(),
  ...buildSupplementalPrestacaoDocuments(),
  ...buildSupplementalLeiOrganicaDocuments(),
];

export const allDocuments: Document[] = sortDocuments(
  dedupeByUrl(dedupeDocuments([...normalizedBaseDocuments, ...supplementalDocuments])),
);
export const reports: Report[] = reportsBase.map(toFrontendReport);
export const documentosFaltantes: Document[] = missingDocumentsBase.map(toMissingDocument);

function byCategory(category: BaseDocument["category"]) {
  return allDocuments.filter((document) => document.categoryKey === category);
}

export const diarioOficialDocuments = byCategory("diario-oficial");
export const camaraDocuments = byCategory("camara-legislativa");
export const contasPublicasDocuments = byCategory("contas-publicas");
export const controleExternoDocuments = byCategory("controle-externo");
export const repassesDocuments = byCategory("repasses");
export const terceiroSetorDocuments = byCategory("terceiro-setor");

export const featuredDocuments =
  allDocuments.filter((document) => document.isFeatured).slice(0, 8);

export const lastUpdatedAt = fiscalizaData.updatedAt;
