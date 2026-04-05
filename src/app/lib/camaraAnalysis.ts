import { camaraPublicFiles, type CamaraPublicFile } from "../data/generated/camaraPublicFiles";

export type CamaraTipoSigla =
  | "CCJR"
  | "COFC"
  | "CPMAUOPS"
  | "CSECLT"
  | "IND"
  | "MOC"
  | "PDL"
  | "PLC"
  | "PLO"
  | "PR"
  | "R"
  | "RQ";

export interface CamaraAnalysisRef {
  tipo: CamaraTipoSigla;
  numero: number;
  ano: number;
  numeroPadded: string;
  slug: string;
}

export const CAMARA_TYPE_LABELS: Record<CamaraTipoSigla, string> = {
  PLO: "Projeto de Lei Ordinária",
  RQ: "Requerimento",
  IND: "Indicação",
  PLC: "Projeto de Lei Complementar",
  R: "Resolução",
  MOC: "Moção",
  CCJR: "COMISSÃO DE CONSTITUIÇÃO, JUSTIÇA E REDAÇÃO",
  COFC: "COMISSÃO DE ORÇAMENTO, FINANÇAS E CONTABILIDADE",
  CPMAUOPS: "COMISSÃO DE PLANEJAMENTO, MEIO AMBIENTE, USO, OCUPAÇÃO E PARCELAMENTO DO SOLO",
  CSECLT: "COMISSÃO DE SAÚDE, EDUCAÇÃO, CULTURA, LAZER E TURISMO",
  PR: "Projeto de Resolução",
  PDL: "Projeto de Decreto Legislativo",
};

export const CAMARA_TYPE_ORDER: CamaraTipoSigla[] = [
  "PLO",
  "RQ",
  "IND",
  "PLC",
  "R",
  "MOC",
  "CCJR",
  "COFC",
  "CPMAUOPS",
  "CSECLT",
  "PR",
  "PDL",
];

function isCamaraTipoSigla(value: string): value is CamaraTipoSigla {
  return Object.prototype.hasOwnProperty.call(CAMARA_TYPE_LABELS, value);
}

function createRef(tipo: CamaraTipoSigla, numero: number, ano: number): CamaraAnalysisRef {
  const numeroPadded = String(numero).padStart(3, "0");
  return {
    tipo,
    numero,
    ano,
    numeroPadded,
    slug: `${tipo.toLowerCase()}-${numeroPadded}-${ano}`,
  };
}

export function buildCamaraAnalysisRef(tipo: CamaraTipoSigla, numero: number, ano: number) {
  return createRef(tipo, numero, ano);
}

export function buildCamaraAnalysisRouteFromRef(ref: CamaraAnalysisRef) {
  return `/camara/analises/${ref.slug}`;
}

export function parseCamaraAnalysisSlug(slug: string | undefined) {
  if (!slug) return null;

  const matched = slug.match(/^([a-z0-9]+)-(\d{3})-(20\d{2})$/i);
  if (!matched) return null;

  const tipo = matched[1].toUpperCase();
  if (!isCamaraTipoSigla(tipo)) return null;

  const numero = Number(matched[2]);
  const ano = Number(matched[3]);
  if (!Number.isFinite(numero) || !Number.isFinite(ano)) return null;

  return createRef(tipo, numero, ano);
}

const camaraFileBySlug = new Map<string, CamaraPublicFile>();

for (const file of camaraPublicFiles) {
  if (!isCamaraTipoSigla(file.type)) continue;
  const ref = createRef(file.type, file.number, file.year);
  camaraFileBySlug.set(ref.slug, file);
}

export function getCamaraPublicFileBySlug(slug: string | undefined) {
  if (!slug) return undefined;
  return camaraFileBySlug.get(slug);
}
