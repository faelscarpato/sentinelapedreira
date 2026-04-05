import { camaraPublicFiles } from "./generated/camaraPublicFiles";
import { camaraProposicoes2026 } from "./generated/camaraProposicoes2026";
import type { Document } from "./realData";
import {
  buildCamaraAnalysisRef,
  buildCamaraAnalysisRouteFromRef,
  CAMARA_TYPE_LABELS,
  CAMARA_TYPE_ORDER,
  type CamaraTipoSigla,
} from "../lib/camaraAnalysis";

export interface CamaraPublicDocument extends Document {
  camaraType: CamaraTipoSigla;
  tipoNome: string;
  hasReportFile: boolean;
  reportPath?: string;
}

export interface CamaraTypeOption {
  value: CamaraTipoSigla;
  label: string;
}

function parseDateFromFileName(fileName: string, fallbackYear: number) {
  const matched = fileName.match(/(\d{2})-(\d{2})-(20\d{2})/);
  if (!matched) return `${fallbackYear}-01-01`;
  return `${matched[3]}-${matched[2]}-${matched[1]}`;
}

function normalizeType(type: string): CamaraTipoSigla | null {
  if (Object.prototype.hasOwnProperty.call(CAMARA_TYPE_LABELS, type)) {
    return type as CamaraTipoSigla;
  }
  return null;
}

const orderByType = new Map(CAMARA_TYPE_ORDER.map((sigla, index) => [sigla, index]));

function normalizeJsonType(type: string) {
  if (type === "REQ") return "RQ";
  return type;
}

const remoteByKey = new Map<string, (typeof camaraProposicoes2026)[number]>();

for (const item of camaraProposicoes2026) {
  const normalizedType = normalizeJsonType(item.type);
  const key = `${normalizedType}:${item.number}:${item.year}`;
  if (!remoteByKey.has(key)) {
    remoteByKey.set(key, item);
  }
}

export const camaraTypeOptions: CamaraTypeOption[] = CAMARA_TYPE_ORDER.map((sigla) => ({
  value: sigla,
  label: `${sigla} - ${CAMARA_TYPE_LABELS[sigla]}`,
}));

const baseDocuments: CamaraPublicDocument[] = camaraPublicFiles
  .map((file): CamaraPublicDocument | null => {
    const camaraType = normalizeType(file.type);
    if (!camaraType) return null;

    const ref = buildCamaraAnalysisRef(camaraType, file.number, file.year);
    const analysisUrl = file.hasReport ? buildCamaraAnalysisRouteFromRef(ref) : undefined;
    const tipoNome = CAMARA_TYPE_LABELS[camaraType];
    const remote = remoteByKey.get(`${camaraType}:${file.number}:${file.year}`);
    const remoteOriginalUrl = remote?.originalUrl;
    const resolvedOriginalUrl =
      remoteOriginalUrl && /\.pdf(\?|#|$)/i.test(remoteOriginalUrl)
        ? remoteOriginalUrl
        : file.pdfPath;
    const date = remote?.date ?? parseDateFromFileName(file.fileName, file.year);

    return {
      id: file.id,
      source: "camara-public-pdf",
      domain: "camarapedreira.sp.gov.br",
      categoryKey: "camara-legislativa",
      category: "Câmara Legislativa",
      subtype: camaraType,
      title: remote?.title ?? `${camaraType} ${file.number}/${file.year}`,
      summary: file.hasReport
        ? remote?.summary ?? `Relatorio em Markdown disponivel em ${camaraType}/analises.`
        : "Analise em andamento.",
      date,
      year: file.year,
      month: Number(date.slice(5, 7)),
      tags: [camaraType, tipoNome, file.hasReport ? "Relatorio publicado" : "Analise em andamento"],
      sourceEntity: remote?.sourceEntity ?? "Câmara Municipal de Pedreira",
      originalUrl: resolvedOriginalUrl,
      previewMode: "pdf",
      analysisUrl,
      hasAnalysis: file.hasReport,
      riskLevel: "low",
      isFeatured: false,
      status: "published",
      camaraType,
      tipoNome,
      hasReportFile: file.hasReport,
      reportPath: file.reportPath,
    };
  })
  .filter((document): document is CamaraPublicDocument => document !== null);

export const camaraPublicDocuments: CamaraPublicDocument[] = baseDocuments.sort((left, right) => {
  const leftOrder = orderByType.get(left.camaraType) ?? Number.MAX_SAFE_INTEGER;
  const rightOrder = orderByType.get(right.camaraType) ?? Number.MAX_SAFE_INTEGER;
  if (leftOrder !== rightOrder) return leftOrder - rightOrder;

  return right.number - left.number;
});

export const camaraPublishedMarkdownAnalyses: CamaraPublicDocument[] = camaraPublicDocuments
  .filter((document) => document.hasReportFile)
  .sort((left, right) => right.date.localeCompare(left.date));
