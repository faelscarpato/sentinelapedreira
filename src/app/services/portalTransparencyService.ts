type PortalDatasetId =
  | "convenios-terceiro-setor"
  | "convenios-gerais"
  | "emendas-impositivas-2026"
  | "licitacoes-2026"
  | "licitacoes-pedreira-completo"
  | "despesas-pedreira-2025"
  | "receitas-pedreira-2025"
  | "transferencias-entidades-2026"
  | "patrimonio-imoveis"
  | "patrimonio-intangiveis"
  | "patrimonio-veiculos"
  | "repasses-pedreira-completo";

interface PortalSummaryEntry {
  numericTotals: Record<string, number>;
  numericCounts: Record<string, number>;
  dateRanges: Record<string, { min: string; max: string }>;
  topValues: Record<string, Array<{ value: string; count: number }>>;
}

interface PortalManifestDataset {
  id: PortalDatasetId;
  title: string;
  domain: string;
  sourceFile: string;
  outputFile: string;
  rowCount: number;
  columnCount: number;
  columns: string[];
  summary: PortalSummaryEntry;
  sourceUpdatedAt: string;
}

interface PortalManifest {
  generatedAt: string;
  sourceDir: string;
  outputDir: string;
  datasets: PortalManifestDataset[];
}

interface PortalDatasetPayload<TRow> {
  id: PortalDatasetId;
  title: string;
  domain: string;
  sourceFile: string;
  generatedAt: string;
  sourceUpdatedAt: string;
  rowCount: number;
  columns: Array<{ source: string; normalized: string }>;
  summary: PortalSummaryEntry;
  rows: TRow[];
}

export interface TransferenciaEntidadeRow {
  mes: number | null;
  entidade_pagadora: string | null;
  entidade_recebedora: string | null;
  cnpj_ent_pagadora: string | null;
  cnpj_ent_recebedora: string | null;
  concedida: number | null;
  recebida: number | null;
  previsto: number | null;
}

export interface RepassePedreiraRow {
  repasse: string | null;
  exercicio: number | null;
  funcao_de_governo: string | null;
  cnpj: string | null;
  razao_social: string | null;
  codigo_ibge: number | null;
  municipio: string | null;
  orgao: string | null;
  uo: string | null;
  ug: string | null;
  tipo_de_repasse: string | null;
  vl_pago: number | null;
  fonte_de_recursos: string | null;
  descricao: string | null;
  classificacao: string | null;
}

export interface DespesaPedreiraRow {
  id_despesa_detalhe: number | string | null;
  ano_exercicio: number | string | null;
  ds_municipio: string | null;
  ds_orgao: string | null;
  mes_referencia: number | string | null;
  mes_ref_extenso: string | null;
  tp_despesa: string | null;
  nr_empenho: string | null;
  identificador_despesa: string | null;
  ds_despesa: string | null;
  dt_emissao_despesa: string | null;
  vl_despesa: number | string | null;
  ds_funcao_governo: string | null;
  ds_subfuncao_governo: string | null;
  cd_programa: number | string | null;
  ds_programa: string | null;
  cd_acao: number | string | null;
  ds_acao: string | null;
  ds_fonte_recurso: string | null;
  ds_cd_aplicacao_fixo: string | null;
  ds_modalidade_lic: string | null;
  ds_elemento: string | null;
  historico_despesa: string | null;
}

export interface ReceitaPedreiraRow {
  id_rec_arrec_detalhe: number | string | null;
  ano_exercicio: number | string | null;
  ds_municipio: string | null;
  ds_orgao: string | null;
  mes_referencia: number | string | null;
  mes_ref_extenso: string | null;
  ds_poder: string | null;
  ds_fonte_recurso: string | null;
  ds_cd_aplicacao_fixo: string | null;
  ds_cd_aplicacao_variavel: string | null;
  ds_categoria: string | null;
  ds_subcategoria: string | null;
  ds_fonte: string | null;
  ds_d1: string | null;
  ds_dd2: string | null;
  ds_d3: string | null;
  ds_tipo: string | null;
  vl_arrecadacao: number | string | null;
}

export interface LicitacaoCompletaRow {
  municipio: string | null;
  orgao: string | null;
  uo: string | null;
  ue: string | null;
  mod_de_licitacao: string | null;
  nr_licitacao: string | null;
  funcao_de_governo: string | null;
  subfuncao_de_governo: string | null;
  programa: string | null;
  acao: string | null;
  fonte_de_recurso: string | null;
  cod_aplicacao_fixo: string | null;
  cod_aplicacao_variavel: string | null;
  categoria: string | null;
  grupo: string | null;
  modalidade: string | null;
  elemento: string | null;
  subelemento: string | null;
  id_credor: string | null;
  nome_do_credor: string | null;
  nr_empenho: number | string | null;
  ano_empenho: number | string | null;
  mes_balancete: number | string | null;
  ano_balancete: number | string | null;
  dt_referencia: string | null;
  vl_inscrito_rp_proc: number | string | null;
  vl_saldo_inicial_rp_proc: number | string | null;
  vl_cancelado_rp_proc: number | string | null;
  vl_pago_rp_proc: number | string | null;
  vl_estorno_pago_rp_proc: number | string | null;
  vl_inscrito_rp_nao_proc: number | string | null;
  vl_saldo_inicial_rp_nao_proc: number | string | null;
  vl_liquidado_rp_nao_proc: number | string | null;
  vl_estorno_liquidado_rp_nao_proc: number | string | null;
  vl_cancelado_rp_nao_proc: number | string | null;
  vl_pago_rp_nao_proc: number | string | null;
  vl_estorno_pago_rp_nao_proc: number | string | null;
}

export interface ConvenioRow {
  numero: string | null;
  processo: string | null;
  tipo: string | null;
  convenio: string | null;
  objeto: string | null;
  inicio: string | null;
  fim: string | null;
  valor: number | null;
  valor_contra_partida: number | null;
  valor_aditamento: number | null;
  valor_empenhado?: number | null;
  valor_liquidado?: number | null;
  valor_pago?: number | null;
  valor_prestado?: number | null;
  valor_receita?: number | null;
  cnpj_concessor: string | null;
  concessor: string | null;
  cnpj_favorecido: string | null;
  favorecido: string | null;
}

export interface EmendaImpositivaRow {
  tipo_transferencia: string | null;
  receitas_de_transferencia: number | null;
  receitas_de_aplicacao_financeira: number | null;
  empenhado: number | null;
  liquidado: number | null;
  pago: number | null;
}

export interface LicitacaoRow {
  exercicio: number | null;
  proc_administrativo: string | null;
  proc_licitatorio: string | null;
  modalidade: string | null;
  data_do_edital: string | null;
  data_encerramento: string | null;
  reg_preco: string | null;
  prazo_de_entrega_inicio: string | null;
  n_mod: string | null;
  objeto: string | null;
  situacao: string | null;
  valor_previsto: number | null;
  carona: string | null;
  data_abert_propost: string | null;
  hora_abert_propost: string | null;
  valor_total_licitacao: number | null;
  artigo_inciso: string | null;
  data_inicio_proposta: string | null;
  data_fim_proposta: string | null;
}

interface PatrimonioItemRow {
  data_aquisicao: string | null;
  grupo_chapa: string | null;
  descricao: string | null;
  tipo: string | null;
  localizacao: string | null;
  origem: string | null;
}

export interface PatrimonioImovelRow extends PatrimonioItemRow {
  codigo: string | null;
}

export interface PatrimonioVeiculoRow extends PatrimonioItemRow {
  placa: string | null;
}

export type PatrimonioIntangivelRow = PatrimonioItemRow;

const manifestCache: { value?: Promise<PortalManifest> } = {};
const datasetCache = new Map<PortalDatasetId, Promise<PortalDatasetPayload<unknown>>>();

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Falha ao carregar ${url}: HTTP ${response.status}`);
  }
  return (await response.json()) as T;
}

export async function fetchPortalTransparencyManifest(): Promise<PortalManifest> {
  if (!manifestCache.value) {
    manifestCache.value = fetchJson<PortalManifest>("/data/portal-transparencia/manifest.json");
  }
  return manifestCache.value;
}

async function fetchPortalDataset<TRow>(id: PortalDatasetId): Promise<PortalDatasetPayload<TRow>> {
  const cached = datasetCache.get(id);
  if (cached) return cached as Promise<PortalDatasetPayload<TRow>>;

  const promise = (async () => {
    const manifest = await fetchPortalTransparencyManifest();
    const dataset = manifest.datasets.find((item) => item.id === id);
    if (!dataset) {
      throw new Error(`Dataset ${id} não encontrado no manifest.`);
    }
    return fetchJson<PortalDatasetPayload<TRow>>(`/data/portal-transparencia/${dataset.outputFile}`);
  })();

  datasetCache.set(id, promise as Promise<PortalDatasetPayload<unknown>>);
  return promise;
}

function sortByDateDesc<T extends { data_aquisicao?: string | null }>(rows: T[]) {
  return [...rows].sort((left, right) => {
    const leftTime = left.data_aquisicao ? Date.parse(left.data_aquisicao) : 0;
    const rightTime = right.data_aquisicao ? Date.parse(right.data_aquisicao) : 0;
    return rightTime - leftTime;
  });
}

export async function fetchTransferenciasEntidades() {
  const dataset = await fetchPortalDataset<TransferenciaEntidadeRow>("transferencias-entidades-2026");
  return dataset;
}

export async function fetchRepassesPedreiraCompleto() {
  const dataset = await fetchPortalDataset<RepassePedreiraRow>("repasses-pedreira-completo");
  return dataset;
}

export async function fetchDespesasPedreira2025() {
  const dataset = await fetchPortalDataset<DespesaPedreiraRow>("despesas-pedreira-2025");
  return dataset;
}

export async function fetchReceitasPedreira2025() {
  const dataset = await fetchPortalDataset<ReceitaPedreiraRow>("receitas-pedreira-2025");
  return dataset;
}

export async function fetchLicitacoesPedreiraCompleto() {
  const dataset = await fetchPortalDataset<LicitacaoCompletaRow>("licitacoes-pedreira-completo");
  return dataset;
}

export async function fetchConveniosTerceiroSetor() {
  const dataset = await fetchPortalDataset<ConvenioRow>("convenios-terceiro-setor");
  return dataset;
}

export async function fetchConveniosGerais() {
  const dataset = await fetchPortalDataset<ConvenioRow>("convenios-gerais");
  return dataset;
}

export async function fetchEmendasImpositivas() {
  const dataset = await fetchPortalDataset<EmendaImpositivaRow>("emendas-impositivas-2026");
  return dataset;
}

export async function searchLicitacoes(query: string, limit = 120) {
  const dataset = await fetchPortalDataset<LicitacaoRow>("licitacoes-2026");
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return {
      ...dataset,
      rows: dataset.rows.slice(0, limit),
    };
  }

  const matches = dataset.rows.filter((row) => {
    const haystack = `${row.objeto ?? ""} ${row.modalidade ?? ""} ${row.situacao ?? ""} ${row.proc_licitatorio ?? ""}`
      .toLowerCase();
    return haystack.includes(normalizedQuery);
  });

  return {
    ...dataset,
    rows: matches.slice(0, limit),
  };
}

export async function fetchPatrimonioDatasets() {
  const [imoveis, veiculos, intangiveis] = await Promise.all([
    fetchPortalDataset<PatrimonioImovelRow>("patrimonio-imoveis"),
    fetchPortalDataset<PatrimonioVeiculoRow>("patrimonio-veiculos"),
    fetchPortalDataset<PatrimonioIntangivelRow>("patrimonio-intangiveis"),
  ]);

  return {
    imoveis: {
      ...imoveis,
      rows: sortByDateDesc(imoveis.rows).slice(0, 80),
    },
    veiculos: {
      ...veiculos,
      rows: sortByDateDesc(veiculos.rows).slice(0, 80),
    },
    intangiveis,
  };
}
