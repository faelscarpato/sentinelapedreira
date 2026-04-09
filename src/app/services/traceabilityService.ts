import type { RastreabilidadeAnalysis, TreasurySnapshot } from "../../lib/rastreabilidadeTypes";
import { getClient } from "./serviceUtils";

export interface TraceabilityInput {
  documentId: string;
  documentTitle: string;
  documentContent: string;
  treasury: TreasurySnapshot;
  previousAnalyses: Array<{
    id: string;
    title: string;
    riskScore: number;
    summary: string;
    financialValue?: number;
  }>;
}

export async function runFinancialTraceability(payload: TraceabilityInput) {
  const client = getClient();

  const { data, error } = await client.functions.invoke("financial-traceability", {
    body: payload,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data || !data.analysis) {
    throw new Error("Payload inválido retornado por financial-traceability.");
  }

  return {
    analysisId: data.analysisId as string,
    analysis: data.analysis as RastreabilidadeAnalysis,
  };
}

export async function fetchFinancialTraceabilityHistory() {
  const client = getClient();
  const { data, error } = await client
    .from("analyses")
    .select("id, metadata, created_at")
    .eq("analysis_type", "financial_traceability")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    throw new Error(error.message);
  }

  const rows = data ?? [];
  return rows
    .map((row) => {
      const structured = (row.metadata as { structured?: RastreabilidadeAnalysis } | null)?.structured;
      if (!structured) return null;
      return structured;
    })
    .filter((item): item is RastreabilidadeAnalysis => Boolean(item));
}
