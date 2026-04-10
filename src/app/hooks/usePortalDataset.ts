import { useState, useEffect, useMemo } from "react";

interface DatasetResponse<T> {
  rows: T[];
  error: string | null;
  loading: boolean;
}

export function usePortalDataset<T>(
  fetchFn: () => Promise<{ rows: T[] }>,
  dependencyArray: any[] = []
): DatasetResponse<T> {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<T[]>([]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    const run = async () => {
      try {
        const dataset = await fetchFn();
        if (!active) return;
        setRows(dataset.rows);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Falha ao carregar dados.");
      } finally {
        if (active) setLoading(false);
      }
    };

    run();
    return () => { active = false; };
  }, dependencyArray);

  return { rows, error, loading };
}

// Utility for formatting currency consistently
export function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

// Utility for unified number parsing across CSV/JSON
export function parseFinancialValue(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return 0;
  
  const cleaned = value
    .replace(/^R\$\s*/i, "")
    .replace(/\./g, "")
    .replace(",", ".")
    .replace(/[^\d.-]/g, "");

  if (!cleaned || cleaned === "-" || cleaned === ".") return 0;
  const parsed = parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}
