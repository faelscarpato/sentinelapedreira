import { getClient } from "./serviceUtils";

export interface TceQueryFilters {
  municipioCodigo?: string;
  exercicio: number;
  mes: number;
  orgao?: string;
  fornecedor?: string;
  limit?: number;
}

export interface TceReceitaRow {
  id: number;
  orgao: string | null;
  conta: string | null;
  categoria: string | null;
  descricao: string | null;
  fornecedor: string | null;
  valor: number;
  valor_previsto: number | null;
  data_competencia: string | null;
}

export interface TceDespesaRow {
  id: number;
  orgao: string | null;
  conta: string | null;
  categoria: string | null;
  descricao: string | null;
  fornecedor: string | null;
  valor: number;
  valor_empenhado: number | null;
  valor_liquidado: number | null;
  valor_pago: number | null;
  data_competencia: string | null;
}

export interface TceImportJobSummary {
  id: string;
  municipio_codigo: string;
  municipio_nome: string | null;
  exercicio: number;
  mes: number;
  status: "queued" | "running" | "completed" | "failed";
  receitas_count: number;
  despesas_count: number;
  finished_at: string | null;
  updated_at: string;
}

function parseNumeric(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const normalized = Number.parseFloat(value);
    if (Number.isFinite(normalized)) {
      return normalized;
    }
  }

  return 0;
}

export async function fetchTceReceitas(filters: TceQueryFilters): Promise<TceReceitaRow[]> {
  const client = getClient();
  const limit = Math.max(1, Math.min(filters.limit ?? 300, 1000));
  const municipio = filters.municipioCodigo?.trim() || "3537108";

  let query = client
    .from("tce_receitas")
    .select("id, orgao, conta, categoria, descricao, fornecedor, valor, valor_previsto, data_competencia")
    .eq("municipio_codigo", municipio)
    .eq("exercicio", filters.exercicio)
    .eq("mes", filters.mes)
    .order("valor", { ascending: false })
    .limit(limit);

  if (filters.orgao && filters.orgao !== "todos") {
    query = query.ilike("orgao", filters.orgao);
  }

  if (filters.fornecedor && filters.fornecedor !== "todos") {
    query = query.ilike("fornecedor", filters.fornecedor);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => ({
    id: row.id as number,
    orgao: (row.orgao as string | null) ?? null,
    conta: (row.conta as string | null) ?? null,
    categoria: (row.categoria as string | null) ?? null,
    descricao: (row.descricao as string | null) ?? null,
    fornecedor: (row.fornecedor as string | null) ?? null,
    valor: parseNumeric(row.valor),
    valor_previsto: row.valor_previsto == null ? null : parseNumeric(row.valor_previsto),
    data_competencia: (row.data_competencia as string | null) ?? null,
  }));
}

export async function fetchTceDespesas(filters: TceQueryFilters): Promise<TceDespesaRow[]> {
  const client = getClient();
  const limit = Math.max(1, Math.min(filters.limit ?? 300, 1000));
  const municipio = filters.municipioCodigo?.trim() || "3537108";

  let query = client
    .from("tce_despesas")
    .select("id, orgao, conta, categoria, descricao, fornecedor, valor, valor_empenhado, valor_liquidado, valor_pago, data_competencia")
    .eq("municipio_codigo", municipio)
    .eq("exercicio", filters.exercicio)
    .eq("mes", filters.mes)
    .order("valor", { ascending: false })
    .limit(limit);

  if (filters.orgao && filters.orgao !== "todos") {
    query = query.ilike("orgao", filters.orgao);
  }

  if (filters.fornecedor && filters.fornecedor !== "todos") {
    query = query.ilike("fornecedor", filters.fornecedor);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => ({
    id: row.id as number,
    orgao: (row.orgao as string | null) ?? null,
    conta: (row.conta as string | null) ?? null,
    categoria: (row.categoria as string | null) ?? null,
    descricao: (row.descricao as string | null) ?? null,
    fornecedor: (row.fornecedor as string | null) ?? null,
    valor: parseNumeric(row.valor),
    valor_empenhado: row.valor_empenhado == null ? null : parseNumeric(row.valor_empenhado),
    valor_liquidado: row.valor_liquidado == null ? null : parseNumeric(row.valor_liquidado),
    valor_pago: row.valor_pago == null ? null : parseNumeric(row.valor_pago),
    data_competencia: (row.data_competencia as string | null) ?? null,
  }));
}

export async function fetchTceFilterOptions(baseFilters: Pick<TceQueryFilters, "municipioCodigo" | "exercicio" | "mes">) {
  const client = getClient();
  const municipio = baseFilters.municipioCodigo?.trim() || "3537108";

  const [orgaosReceitaResponse, orgaosDespesaResponse, fornecedoresResponse] = await Promise.all([
    client
      .from("tce_receitas")
      .select("orgao")
      .eq("municipio_codigo", municipio)
      .eq("exercicio", baseFilters.exercicio)
      .eq("mes", baseFilters.mes)
      .not("orgao", "is", null)
      .limit(2000),
    client
      .from("tce_despesas")
      .select("orgao")
      .eq("municipio_codigo", municipio)
      .eq("exercicio", baseFilters.exercicio)
      .eq("mes", baseFilters.mes)
      .not("orgao", "is", null)
      .limit(2000),
    client
      .from("tce_despesas")
      .select("fornecedor")
      .eq("municipio_codigo", municipio)
      .eq("exercicio", baseFilters.exercicio)
      .eq("mes", baseFilters.mes)
      .not("fornecedor", "is", null)
      .limit(2500),
  ]);

  if (orgaosReceitaResponse.error) {
    throw new Error(orgaosReceitaResponse.error.message);
  }
  if (orgaosDespesaResponse.error) {
    throw new Error(orgaosDespesaResponse.error.message);
  }
  if (fornecedoresResponse.error) {
    throw new Error(fornecedoresResponse.error.message);
  }

  const orgaos = [
    ...(orgaosReceitaResponse.data ?? []).map((item) => item.orgao as string | null),
    ...(orgaosDespesaResponse.data ?? []).map((item) => item.orgao as string | null),
  ]
    .filter((value): value is string => Boolean(value && value.trim().length > 0))
    .map((value) => value.trim());

  const fornecedores = (fornecedoresResponse.data ?? [])
    .map((item) => item.fornecedor as string | null)
    .filter((value): value is string => Boolean(value && value.trim().length > 0))
    .map((value) => value.trim());

  return {
    orgaos: Array.from(new Set(orgaos)).sort((a, b) => a.localeCompare(b, "pt-BR")),
    fornecedores: Array.from(new Set(fornecedores)).sort((a, b) => a.localeCompare(b, "pt-BR")),
  };
}

export async function fetchLatestTceImportJob(municipioCodigo = "3537108"): Promise<TceImportJobSummary | null> {
  const client = getClient();
  const { data, error } = await client
    .from("tce_import_jobs")
    .select("id, municipio_codigo, municipio_nome, exercicio, mes, status, receitas_count, despesas_count, finished_at, updated_at")
    .eq("municipio_codigo", municipioCodigo)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) return null;

  return data as TceImportJobSummary;
}
