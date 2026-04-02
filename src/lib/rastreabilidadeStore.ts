// ===================================================================
// rastreabilidadeStore.ts — Armazenamento local das análises
// Persiste em memória + sessionStorage (sem backend)
// ===================================================================

import type { RastreabilidadeAnalysis, TreasurySnapshot } from "./rastreabilidadeTypes";

const STORAGE_KEY = "sentinela_rastreabilidade_v1";
const TREASURY_KEY = "sentinela_treasury_snapshot_v1";

// Carrega análises salvas
function loadAnalyses(): RastreabilidadeAnalysis[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// Salva análises
function saveAnalyses(analyses: RastreabilidadeAnalysis[]): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(analyses));
  } catch {
    // sessionStorage pode estar bloqueado em alguns contextos
  }
}

let _analyses: RastreabilidadeAnalysis[] = loadAnalyses();

export const rastreabilidadeStore = {
  getAll(): RastreabilidadeAnalysis[] {
    return [..._analyses].sort(
      (a, b) => new Date(b.analyzedAt).getTime() - new Date(a.analyzedAt).getTime()
    );
  },

  getById(id: string): RastreabilidadeAnalysis | undefined {
    return _analyses.find((a) => a.documentId === id);
  },

  save(analysis: RastreabilidadeAnalysis): void {
    const idx = _analyses.findIndex((a) => a.documentId === analysis.documentId);
    if (idx >= 0) {
      _analyses[idx] = analysis;
    } else {
      _analyses.push(analysis);
    }
    saveAnalyses(_analyses);
  },

  remove(documentId: string): void {
    _analyses = _analyses.filter((a) => a.documentId !== documentId);
    saveAnalyses(_analyses);
  },

  clear(): void {
    _analyses = [];
    saveAnalyses(_analyses);
  },

  getStats() {
    const all = _analyses;
    return {
      total: all.length,
      critical: all.filter((a) => a.riskLevel === "critical").length,
      high: all.filter((a) => a.riskLevel === "high").length,
      medium: all.filter((a) => a.riskLevel === "medium").length,
      low: all.filter((a) => a.riskLevel === "low").length,
      withFinancialRequest: all.filter((a) => a.financialRequest.hasRequest).length,
      totalValueAtRisk: all
        .filter((a) => a.financialRequest.hasRequest && a.financialRequest.value)
        .reduce((sum, a) => sum + (a.financialRequest.value ?? 0), 0),
      avgRiskScore: all.length ? all.reduce((s, a) => s + a.riskScore, 0) / all.length : 0,
    };
  },

  // Retorna resumos para contexto de novas análises
  getSummariesForContext() {
    return _analyses.slice(-10).map((a) => ({
      id: a.documentId,
      title: a.documentTitle,
      riskScore: a.riskScore,
      summary: a.summary,
      financialValue: a.financialRequest.value,
    }));
  },

  // Snapshot do tesouro municipal — atualize com dados reais
  getTreasurySnapshot(): TreasurySnapshot {
    try {
      const raw = sessionStorage.getItem(TREASURY_KEY);
      if (raw) return JSON.parse(raw);
    } catch { /* ignore */ }
    // Fallback: retorna snapshot padrão — SUBSTITUA por dados reais do seu scraper
    return {
      capturedAt: new Date().toISOString(),
      executionPercentage: 68,
      availableBalance: 2_400_000,
      status: "yellow",
      fiscalGoalOk: true,
      personnelExpenseRate: 51.2,
      notes: "Dados de referência — integre com Portal da Transparência para valores reais",
    };
  },

  setTreasurySnapshot(snapshot: TreasurySnapshot): void {
    try {
      sessionStorage.setItem(TREASURY_KEY, JSON.stringify(snapshot));
    } catch { /* ignore */ }
  },
};
