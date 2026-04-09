import type { Document } from "../data/realData";
import { getClient } from "./serviceUtils";

interface DiarioOficialRow {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  publication_date: string | null;
  published_at: string | null;
  category: string;
  subtype: string | null;
  original_url: string | null;
  edition_number: number | null;
  source_name: string | null;
  total_count: number;
}

export interface ListDiarioOficialOptions {
  page: number;
  pageSize: number;
  searchTerm?: string;
  year?: string;
}

export interface ListDiarioOficialResult {
  items: Document[];
  totalCount: number;
}

function toDocument(row: DiarioOficialRow): Document {
  const date = row.publication_date ?? row.published_at?.slice(0, 10) ?? "1970-01-01";
  const year = Number.parseInt(date.slice(0, 4), 10);
  const month = Number.parseInt(date.slice(5, 7), 10);

  return {
    id: row.id,
    source: "diario-oficial-sync",
    domain: "pedreira.sp.gov.br",
    categoryKey: "diario-oficial",
    category: row.category,
    subtype: row.subtype ?? "diario-oficial",
    title: row.title,
    summary: row.summary ?? "Edição oficial publicada pela Prefeitura Municipal de Pedreira.",
    date,
    year,
    month,
    tags: [
      "Diário Oficial",
      row.edition_number ? `Edição ${row.edition_number}` : "Edição",
    ],
    sourceEntity: row.source_name ?? "Prefeitura Municipal de Pedreira",
    originalUrl: row.original_url ?? undefined,
    previewMode: "pdf",
    hasAnalysis: false,
    isFeatured: false,
    status: "published",
  };
}

export async function listDiarioOficialDocuments(
  options: ListDiarioOficialOptions,
): Promise<ListDiarioOficialResult> {
  const client = getClient();
  const page = Math.max(1, options.page);
  const pageSize = Math.max(1, options.pageSize);
  const offset = (page - 1) * pageSize;
  const searchTerm = options.searchTerm?.trim() || null;

  let dataFrom = null as string | null;
  let dataTo = null as string | null;

  if (options.year && options.year !== "todos") {
    const selectedYear = Number.parseInt(options.year, 10);
    if (Number.isFinite(selectedYear)) {
      dataFrom = `${selectedYear}-01-01`;
      dataTo = `${selectedYear}-12-31`;
    }
  }

  const { data, error } = await client.rpc("list_diario_oficial_documents", {
    p_numero_edicao: null,
    p_data_de: dataFrom,
    p_data_ate: dataTo,
    p_palavra_chave: searchTerm,
    p_limit: pageSize,
    p_offset: offset,
  });

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as DiarioOficialRow[];
  return {
    items: rows.map(toDocument),
    totalCount: rows[0]?.total_count ?? 0,
  };
}
