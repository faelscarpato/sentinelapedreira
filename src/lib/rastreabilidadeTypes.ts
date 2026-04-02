// ===================================================================
// rastreabilidadeTypes.ts — Tipos centrais do sistema de rastreabilidade
// ===================================================================

export type RiskLevel = "critical" | "high" | "medium" | "low";
export type TreasuryStatus = "red" | "yellow" | "green";
export type TraceStepType = "origem" | "proposta" | "aprovacao" | "recurso" | "destino" | "impacto";
export type AnalysisRelationship = "complementa" | "contradiz" | "duplica" | "substitui" | "sem_relacao";
export type FinancialCategory = "investimento" | "custeio" | "pessoal" | "transferencia" | "outro";
export type FinancialSource = "tesouro_municipal" | "repasse_federal" | "fundo_especifico" | "convenio";

export interface TreasurySnapshot {
  capturedAt: string;
  executionPercentage: number;       // % do orçamento anual já gasto
  availableBalance: number;           // saldo disponível em R$
  status: TreasuryStatus;
  fiscalGoalOk: boolean;
  personnelExpenseRate?: number;      // % gasto com pessoal (limite LRF: 54%)
  notes: string;
}

export interface MissingDocument {
  name: string;
  severity: "critical" | "high" | "medium";
  reason: string;
}

export interface TraceStep {
  step: number;
  type: TraceStepType;
  description: string;
  entity: string;
  date?: string;
  flags?: string[];
}

export interface RelatedAnalysis {
  id: string;
  relationship: AnalysisRelationship;
  relevanceScore: number;
  note?: string;
}

export interface ImportanceRanking {
  score: number;        // 0-100
  justification: string;
  priority: "urgente" | "alta" | "media" | "baixa";
}

export interface TreasuryImpact {
  riskLevel: TreasuryStatus;
  canFulfillCommitment: boolean;
  impactOnFiscalGoal: "positivo" | "neutro" | "negativo";
  explanation: string;
}

export interface FinancialRequest {
  hasRequest: boolean;
  value?: number;
  category?: FinancialCategory;
  source?: FinancialSource;
  destination?: string;
  description?: string;
}

export interface RastreabilidadeAnalysis {
  documentId: string;
  documentTitle: string;
  analyzedAt: string;
  financialRequest: FinancialRequest;
  missingDocuments: MissingDocument[];
  treasuryImpact: TreasuryImpact;
  traceChain: TraceStep[];
  relatedAnalyses: RelatedAnalysis[];
  importanceRanking: ImportanceRanking;
  riskScore: number;
  riskLevel: RiskLevel;
  summary: string;
  recommendations: string[];
  // Metadados locais (não vêm da IA)
  _status?: "pending" | "analyzing" | "done" | "error";
  _error?: string;
  _treasuryAtAnalysis?: TreasurySnapshot;
}

// Snapshot financeiro que alimenta a análise — conecte com seus dados reais
export interface FinancialContext {
  treasury: TreasurySnapshot;
  currentYear: number;
  revenueYTD: number;
  expenseYTD: number;
  openLicitacoes: number;
}
