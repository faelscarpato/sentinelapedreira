// ===================================================================
// Rastreabilidade.tsx — Página de análise de rastreabilidade financeira
// IA: NVIDIA Nemotron (interno) | Store: rastreabilidadeStore
// ===================================================================

import { useState, useCallback, useEffect, useMemo } from "react";
import type { ElementType, ReactNode } from "react";
import {
  GitBranch, AlertTriangle, CheckCircle, Clock, TrendingUp,
  Search, ChevronDown, ChevronRight, Loader2, Shield,
  DollarSign, FileX, BarChart3, ArrowRight, RefreshCw,
  AlertCircle, XCircle
} from "lucide-react";
import type { RastreabilidadeAnalysis, TraceStep } from "../../lib/rastreabilidadeTypes";
import { fetchFinancialTraceabilityHistory, runFinancialTraceability } from "../services/traceabilityService";

// ----- helpers de UI -----
const RISK_CONFIG = {
  critical: { color: "text-red-400", bg: "bg-red-950", border: "border-red-800", label: "CRÍTICO", icon: XCircle },
  high:     { color: "text-orange-400", bg: "bg-orange-950", border: "border-orange-800", label: "ALTO", icon: AlertTriangle },
  medium:   { color: "text-yellow-400", bg: "bg-yellow-950", border: "border-yellow-800", label: "MÉDIO", icon: AlertCircle },
  low:      { color: "text-green-400", bg: "bg-green-950", border: "border-green-800", label: "BAIXO", icon: CheckCircle },
};

const TREASURY_CONFIG = {
  red:    { color: "text-red-400", label: "🔴 COFRE CRÍTICO", desc: "Abaixo do mínimo operacional" },
  yellow: { color: "text-yellow-400", label: "🟡 COFRE LIMITADO", desc: "Capacidade reduzida" },
  green:  { color: "text-green-400", label: "🟢 COFRE REGULAR", desc: "Dentro da normalidade" },
};

const TRACE_TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  origem:    { label: "ORIGEM", color: "bg-neutral-700" },
  proposta:  { label: "PROPOSTA", color: "bg-blue-900" },
  aprovacao: { label: "APROVAÇÃO", color: "bg-purple-900" },
  recurso:   { label: "RECURSO", color: "bg-orange-900" },
  destino:   { label: "DESTINO", color: "bg-teal-900" },
  impacto:   { label: "IMPACTO", color: "bg-red-900" },
};

function formatCurrency(value?: number): string {
  if (!value) return "N/D";
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function buildCurrentTreasurySnapshot() {
  return {
    capturedAt: new Date().toISOString(),
    executionPercentage: 68,
    availableBalance: 2_400_000,
    status: "yellow" as const,
    fiscalGoalOk: true,
    personnelExpenseRate: 51.2,
    notes: "Snapshot operacional inicial. Substituir por ingestão automatizada do portal de transparência.",
  };
}

// ----- Componentes internos -----

function RiskBadge({ level, score }: { level: string; score: number }) {
  const cfg = RISK_CONFIG[level as keyof typeof RISK_CONFIG] ?? RISK_CONFIG.medium;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 font-mono text-xs border ${cfg.color} ${cfg.bg} ${cfg.border}`}>
      <Icon className="w-3.5 h-3.5" />
      {cfg.label} — {score}/100
    </span>
  );
}

function TraceChainView({ steps }: { steps: TraceStep[] }) {
  return (
    <div className="space-y-0">
      {steps.map((step, i) => {
        const cfg = TRACE_TYPE_CONFIG[step.type] ?? { label: step.type.toUpperCase(), color: "bg-neutral-700" };
        return (
          <div key={i} className="flex gap-4">
            {/* Linha vertical */}
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 flex items-center justify-center text-xs font-mono font-bold text-white ${cfg.color} flex-shrink-0`}>
                {step.step}
              </div>
              {i < steps.length - 1 && <div className="w-px flex-1 bg-neutral-700 min-h-[24px]" />}
            </div>
            {/* Conteúdo */}
            <div className={`pb-6 flex-1 ${i < steps.length - 1 ? "" : ""}`}>
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs font-mono px-2 py-0.5 ${cfg.color} text-white`}>{cfg.label}</span>
                <span className="text-xs text-neutral-500 font-mono">{step.entity}</span>
                {step.date && <span className="text-xs text-neutral-600 font-mono">• {step.date}</span>}
              </div>
              <p className="text-sm text-neutral-300">{step.description}</p>
              {step.flags && step.flags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {step.flags.map((f, fi) => (
                    <span key={fi} className="text-xs font-mono px-2 py-0.5 bg-red-950 text-red-400 border border-red-800">
                      ⚠ {f}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AnalysisCard({
  analysis,
  onSelect,
  selected,
}: {
  analysis: RastreabilidadeAnalysis;
  onSelect: () => void;
  selected: boolean;
}) {
  const riskCfg = RISK_CONFIG[analysis.riskLevel] ?? RISK_CONFIG.medium;
  return (
    <button
      onClick={onSelect}
      className={`w-full text-left p-4 border transition-colors ${
        selected
          ? "border-neutral-400 bg-neutral-800"
          : "border-neutral-800 bg-neutral-900 hover:border-neutral-600"
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className={`text-xs font-mono ${riskCfg.color}`}>{riskCfg.label}</span>
        <span className="text-xs text-neutral-600 font-mono">
          {new Date(analysis.analyzedAt).toLocaleDateString("pt-BR")}
        </span>
      </div>
      <h4 className="text-sm font-mono text-white line-clamp-2 mb-2">{analysis.documentTitle}</h4>
      {analysis.financialRequest.hasRequest && (
        <div className="flex items-center gap-1.5 text-xs text-orange-400 font-mono">
          <DollarSign className="w-3 h-3" />
          {formatCurrency(analysis.financialRequest.value)}
        </div>
      )}
    </button>
  );
}

function AnalysisDetail({ analysis }: { analysis: RastreabilidadeAnalysis }) {
  const [openSection, setOpenSection] = useState<string>("summary");

  const toggle = (s: string) => setOpenSection((prev) => (prev === s ? "" : s));
  const Section = ({
    id, label, icon: Icon, children,
  }: { id: string; label: string; icon: ElementType; children: ReactNode }) => (
    <div className="border border-neutral-800">
      <button
        onClick={() => toggle(id)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-neutral-800 transition-colors"
      >
        <div className="flex items-center gap-2 font-mono text-sm text-neutral-200">
          <Icon className="w-4 h-4" />
          {label}
        </div>
        {openSection === id ? <ChevronDown className="w-4 h-4 text-neutral-500" /> : <ChevronRight className="w-4 h-4 text-neutral-500" />}
      </button>
      {openSection === id && <div className="px-4 pb-4 pt-2">{children}</div>}
    </div>
  );

  const treasury = TREASURY_CONFIG[analysis.treasuryImpact.riskLevel] ?? TREASURY_CONFIG.yellow;

  return (
    <div className="space-y-px">
      {/* Header */}
      <div className="bg-neutral-900 border border-neutral-800 p-4 mb-4">
        <RiskBadge level={analysis.riskLevel} score={analysis.riskScore} />
        <h3 className="text-lg font-mono text-white mt-3 mb-2">{analysis.documentTitle}</h3>
        <p className="text-sm text-neutral-300">{analysis.summary}</p>
        <div className="flex flex-wrap gap-3 mt-4 text-xs font-mono text-neutral-500">
          <span>Analisado: {new Date(analysis.analyzedAt).toLocaleString("pt-BR")}</span>
          <span>Importância: {analysis.importanceRanking.priority.toUpperCase()}</span>
        </div>
      </div>

      {/* Status do Cofre */}
      <div className={`p-4 border ${analysis.treasuryImpact.riskLevel === "red" ? "border-red-800 bg-red-950/30" : analysis.treasuryImpact.riskLevel === "yellow" ? "border-yellow-800 bg-yellow-950/20" : "border-green-800 bg-green-950/20"}`}>
        <div className={`font-mono text-sm font-bold mb-1 ${treasury.color}`}>{treasury.label}</div>
        <p className="text-xs text-neutral-400 mb-2">{treasury.desc}</p>
        <p className="text-sm text-neutral-300">{analysis.treasuryImpact.explanation}</p>
        {!analysis.treasuryImpact.canFulfillCommitment && (
          <div className="mt-2 text-xs font-mono text-red-400 border border-red-800 px-3 py-1.5">
            ⚠ COFRE PODE NÃO CUMPRIR ESTE COMPROMISSO
          </div>
        )}
      </div>

      {/* Recurso financeiro */}
      {analysis.financialRequest.hasRequest && (
        <div className="p-4 border border-orange-800 bg-orange-950/20">
          <div className="font-mono text-sm text-orange-400 mb-2">💰 PEDIDO DE RECURSO IDENTIFICADO</div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm font-mono">
            <span className="text-neutral-500">Valor:</span>
            <span className="text-white">{formatCurrency(analysis.financialRequest.value)}</span>
            <span className="text-neutral-500">Categoria:</span>
            <span className="text-white">{analysis.financialRequest.category ?? "N/D"}</span>
            <span className="text-neutral-500">Fonte:</span>
            <span className="text-white">{analysis.financialRequest.source ?? "N/D"}</span>
            <span className="text-neutral-500">Destino:</span>
            <span className="text-white">{analysis.financialRequest.destination ?? "N/D"}</span>
          </div>
          {analysis.financialRequest.description && (
            <p className="mt-3 text-sm text-neutral-300">{analysis.financialRequest.description}</p>
          )}
        </div>
      )}

      {/* Docs faltantes */}
      {analysis.missingDocuments.length > 0 && (
        <Section id="docs" label={`Documentos Faltantes (${analysis.missingDocuments.length})`} icon={FileX}>
          <div className="space-y-2">
            {analysis.missingDocuments.map((doc, i) => (
              <div key={i} className={`flex items-start gap-3 p-3 border ${
                doc.severity === "critical" ? "border-red-800 bg-red-950/20" :
                doc.severity === "high" ? "border-orange-800 bg-orange-950/20" : "border-yellow-800 bg-yellow-950/10"
              }`}>
                <AlertTriangle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                  doc.severity === "critical" ? "text-red-400" : doc.severity === "high" ? "text-orange-400" : "text-yellow-400"
                }`} />
                <div>
                  <div className="font-mono text-sm text-white">{doc.name}</div>
                  <div className="text-xs text-neutral-400 mt-0.5">{doc.reason}</div>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Cadeia de rastreabilidade */}
      <Section id="trace" label="Cadeia de Rastreabilidade" icon={GitBranch}>
        <TraceChainView steps={analysis.traceChain} />
      </Section>

      {/* Importância relativa */}
      <Section id="importance" label="Importância Relativa" icon={BarChart3}>
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-mono text-neutral-400">Score de Importância</span>
            <span className="text-xs font-mono text-white">{analysis.importanceRanking.score}/100</span>
          </div>
          <div className="h-2 bg-neutral-800">
            <div
              className="h-2 bg-teal-600 transition-all"
              style={{ width: `${analysis.importanceRanking.score}%` }}
            />
          </div>
        </div>
        <p className="text-sm text-neutral-300">{analysis.importanceRanking.justification}</p>
      </Section>

      {/* Recomendações */}
      <Section id="recs" label="Recomendações" icon={TrendingUp}>
        <ul className="space-y-2">
          {analysis.recommendations.map((rec, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-neutral-300">
              <ArrowRight className="w-4 h-4 mt-0.5 flex-shrink-0 text-teal-500" />
              {rec}
            </li>
          ))}
        </ul>
      </Section>

      {/* Análises relacionadas */}
      {analysis.relatedAnalyses.length > 0 && (
        <Section id="related" label={`Análises Relacionadas (${analysis.relatedAnalyses.length})`} icon={GitBranch}>
          <div className="space-y-2">
            {analysis.relatedAnalyses.map((rel, i) => (
              <div key={i} className="flex items-center justify-between p-2 border border-neutral-800">
                <span className="text-xs font-mono text-neutral-400">{rel.id}</span>
                <span className="text-xs font-mono text-teal-400">{rel.relationship}</span>
                <span className="text-xs text-neutral-500">{rel.relevanceScore}% relevante</span>
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

// ----- Página principal -----
export function Rastreabilidade() {
  const [analyses, setAnalyses] = useState<RastreabilidadeAnalysis[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [manualDocId, setManualDocId] = useState("");
  const [manualDocTitle, setManualDocTitle] = useState("");
  const [manualDocContent, setManualDocContent] = useState("");

  const selectedAnalysis = analyses.find((a) => a.documentId === selectedId);
  const stats = useMemo(() => {
    const all = analyses;
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
    };
  }, [analyses]);

  useEffect(() => {
    let active = true;

    const loadHistory = async () => {
      try {
        const history = await fetchFinancialTraceabilityHistory();
        if (!active) return;
        setAnalyses(history);
      } catch (err) {
        if (!active) return;
        setAnalyzeError(err instanceof Error ? err.message : "Falha ao carregar histórico de rastreabilidade.");
      }
    };

    void loadHistory();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedId && analyses.length > 0) {
      setSelectedId(analyses[0].documentId);
    }
  }, [analyses, selectedId]);

  const filteredAnalyses = analyses.filter(
    (a) =>
      !searchTerm ||
      a.documentTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.summary.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const runAnalysis = useCallback(async () => {
    if (!manualDocId || !manualDocTitle || !manualDocContent.trim()) return;
    setAnalyzing(true);
    setAnalyzeError(null);

    try {
      const treasury = buildCurrentTreasurySnapshot();
      const previousAnalyses = analyses.slice(0, 10).map((item) => ({
        id: item.documentId,
        title: item.documentTitle,
        riskScore: item.riskScore,
        summary: item.summary,
        financialValue: item.financialRequest.value,
      }));

      const result = await runFinancialTraceability({
        documentContent: manualDocContent,
        documentTitle: manualDocTitle,
        documentId: manualDocId,
        treasury,
        previousAnalyses,
      });

      const normalized = {
        ...result.analysis,
        _status: "done" as const,
        _treasuryAtAnalysis: treasury,
      };

      setAnalyses((previous) => [
        normalized,
        ...previous.filter((item) => item.documentId !== normalized.documentId),
      ]);
      setSelectedId(normalized.documentId);
      setManualDocId("");
      setManualDocTitle("");
      setManualDocContent("");
    } catch (err) {
      setAnalyzeError(err instanceof Error ? err.message : "Erro na análise");
    } finally {
      setAnalyzing(false);
    }
  }, [manualDocId, manualDocTitle, manualDocContent, analyses]);

  return (
    <div className="min-h-screen bg-neutral-950">
      {/* Header */}
      <div className="bg-neutral-900 text-white py-10 border-b border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 mb-6">
            <GitBranch className="w-10 h-10 text-teal-400" />
              <div>
                <h1 className="text-3xl font-mono">Rastreabilidade Financeira</h1>
                <p className="text-neutral-400 mt-1 text-sm">
                  Análise de fluxo de recursos públicos via IA · Processamento server-side em Edge Function
                </p>
              </div>
            <div className="ml-auto flex items-center gap-2">
              <span className="text-xs font-mono px-3 py-1 bg-neutral-800 border border-neutral-700 text-neutral-400">
                🔒 USO INTERNO
              </span>
            </div>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: "Total", value: stats.total, color: "text-white" },
              { label: "Crítico", value: stats.critical, color: "text-red-400" },
              { label: "Alto", value: stats.high, color: "text-orange-400" },
              { label: "Médio", value: stats.medium, color: "text-yellow-400" },
              { label: "Baixo", value: stats.low, color: "text-green-400" },
            ].map((s) => (
              <div key={s.label} className="bg-neutral-800 p-3">
                <div className={`text-2xl font-mono font-bold ${s.color}`}>{s.value}</div>
                <div className="text-xs text-neutral-500 font-mono">{s.label}</div>
              </div>
            ))}
          </div>
          {stats.withFinancialRequest > 0 && (
            <div className="mt-3 text-xs font-mono text-orange-400">
              {stats.withFinancialRequest} análise(s) com pedido de recurso ·{" "}
              {formatCurrency(stats.totalValueAtRisk)} em risco monitorado
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sidebar: lista + nova análise */}
          <div className="space-y-4">
            {/* Formulário: nova análise */}
            <div className="border border-neutral-700 p-4">
              <h3 className="font-mono text-sm text-teal-400 mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4" /> NOVA ANÁLISE
              </h3>
              <div className="space-y-2">
                <input
                  className="w-full bg-neutral-900 border border-neutral-700 px-3 py-2 text-sm font-mono text-white placeholder-neutral-600 focus:outline-none focus:border-teal-600"
                  placeholder="ID do documento (ex: PL-2024-047)"
                  value={manualDocId}
                  onChange={(e) => setManualDocId(e.target.value)}
                />
                <input
                  className="w-full bg-neutral-900 border border-neutral-700 px-3 py-2 text-sm font-mono text-white placeholder-neutral-600 focus:outline-none focus:border-teal-600"
                  placeholder="Título do documento"
                  value={manualDocTitle}
                  onChange={(e) => setManualDocTitle(e.target.value)}
                />
                <textarea
                  className="w-full bg-neutral-900 border border-neutral-700 px-3 py-2 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-teal-600 resize-none"
                  placeholder="Cole o conteúdo do documento aqui (texto, PDF extraído, etc.)"
                  rows={6}
                  value={manualDocContent}
                  onChange={(e) => setManualDocContent(e.target.value)}
                />
                {analyzeError && (
                  <p className="text-xs text-red-400 font-mono">{analyzeError}</p>
                )}
                <button
                  onClick={runAnalysis}
                  disabled={analyzing || !manualDocId || !manualDocTitle || !manualDocContent}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-900 border border-teal-700 text-teal-200 font-mono text-sm hover:bg-teal-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {analyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processando análise...
                    </>
                  ) : (
                    <>
                      <GitBranch className="w-4 h-4" />
                      ANALISAR VIA EDGE FUNCTION
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Busca + lista */}
            <div>
              <div className="relative mb-2">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-neutral-600" />
                <input
                  className="w-full bg-neutral-900 border border-neutral-800 pl-9 pr-3 py-2 text-sm font-mono text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-600"
                  placeholder="Buscar análises..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              {filteredAnalyses.length === 0 ? (
                <div className="p-6 text-center text-sm text-neutral-600 font-mono border border-neutral-800">
                  {analyses.length === 0 ? "Nenhuma análise ainda. Inicie acima." : "Sem resultados."}
                </div>
              ) : (
                <div className="space-y-px">
                  {filteredAnalyses.map((a) => (
                    <AnalysisCard
                      key={a.documentId}
                      analysis={a}
                      selected={selectedId === a.documentId}
                      onSelect={() => setSelectedId(a.documentId)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Main: detalhe */}
          <div className="lg:col-span-2">
            {selectedAnalysis ? (
              <AnalysisDetail analysis={selectedAnalysis} />
            ) : (
              <div className="border border-neutral-800 p-12 text-center">
                <GitBranch className="w-12 h-12 text-neutral-700 mx-auto mb-4" />
                <p className="text-neutral-500 font-mono text-sm">
                  Selecione uma análise à esquerda ou inicie uma nova
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
