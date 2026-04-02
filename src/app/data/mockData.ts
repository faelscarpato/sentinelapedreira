import { fiscalizaData } from "./generated/fiscalizaData";

type BaseDocument = (typeof fiscalizaData.documents)[number];
type BaseMissingDocument = (typeof fiscalizaData.missingDocuments)[number];
type BaseReport = (typeof fiscalizaData.reports)[number];

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

export const allDocuments: Document[] = documents.map(toFrontendDocument);
export const reports: Report[] = reportsBase.map(toFrontendReport);
export const documentosFaltantes: Document[] = missingDocumentsBase.map(toMissingDocument);

function byCategory(category: BaseDocument["category"]) {
  return allDocuments.filter((document) => document.category === categoryLabel[category]);
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
