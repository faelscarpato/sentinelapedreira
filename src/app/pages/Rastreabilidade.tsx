import { useState, useCallback, useEffect, useMemo, type ElementType, type ReactNode } from "react";
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  FileX,
  GitBranch,
  Loader2,
  Search,
  Shield,
  TrendingUp,
  XCircle,
} from "lucide-react";
import type { RastreabilidadeAnalysis, TraceStep } from "../../lib/rastreabilidadeTypes";
import { fetchFinancialTraceabilityHistory, runFinancialTraceability } from "../services/traceabilityService";
import {
  AuthBadge,
  InlineStatus,
  PageContainer,
  PageHero,
  PageState,
  SectionBlock,
  StatKpi,
} from "../components/layout/PagePrimitives";
import { cn } from "../components/ui/utils";

const RISK_CONFIG = {
  critical: {
    badge: "border-red-200 bg-red-50 text-red-700",
    chip: "bg-red-100 text-red-700",
    label: "Crítico",
    icon: XCircle,
  },
  high: {
    badge: "border-orange-200 bg-orange-50 text-orange-700",
    chip: "bg-orange-100 text-orange-700",
    label: "Alto",
    icon: AlertTriangle,
  },
  medium: {
    badge: "border-amber-200 bg-amber-50 text-amber-700",
    chip: "bg-amber-100 text-amber-700",
    label: "Médio",
    icon: AlertCircle,
  },
  low: {
    badge: "border-emerald-200 bg-emerald-50 text-emerald-700",
    chip: "bg-emerald-100 text-emerald-700",
    label: "Baixo",
    icon: CheckCircle2,
  },
};

const TREASURY_CONFIG = {
  red: {
    box: "border-red-200 bg-red-50",
    label: "Cofre crítico",
    labelColor: "text-red-700",
    desc: "Abaixo do mínimo operacional.",
  },
  yellow: {
    box: "border-amber-200 bg-amber-50",
    label: "Cofre limitado",
    labelColor: "text-amber-700",
    desc: "Capacidade reduzida para novos compromissos.",
  },
  green: {
    box: "border-emerald-200 bg-emerald-50",
    label: "Cofre regular",
    labelColor: "text-emerald-700",
    desc: "Situação operacional dentro do esperado.",
  },
};

const TRACE_TYPE_CONFIG: Record<string, { label: string; chip: string }> = {
  origem: { label: "Origem", chip: "bg-slate-200 text-slate-700" },
  proposta: { label: "Proposta", chip: "bg-blue-100 text-blue-700" },
  aprovacao: { label: "Aprovação", chip: "bg-violet-100 text-violet-700" },
  recurso: { label: "Recurso", chip: "bg-orange-100 text-orange-700" },
  destino: { label: "Destino", chip: "bg-cyan-100 text-cyan-700" },
  impacto: { label: "Impacto", chip: "bg-rose-100 text-rose-700" },
};

function formatCurrency(value?: number): string {
  if (value == null) return "N/D";
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

function RiskBadge({ level, score }: { level: string; score: number }) {
  const cfg = RISK_CONFIG[level as keyof typeof RISK_CONFIG] ?? RISK_CONFIG.medium;
  const Icon = cfg.icon;

  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold", cfg.badge)}>
      <Icon className="h-3.5 w-3.5" />
      Risco {cfg.label} - {score}/100
    </span>
  );
}

function TraceChainView({ steps }: { steps: TraceStep[] }) {
  return (
    <div className="space-y-0">
      {steps.map((step, index) => {
        const cfg = TRACE_TYPE_CONFIG[step.type] ?? { label: step.type.toUpperCase(), chip: "bg-slate-200 text-slate-700" };
        return (
          <div key={`${step.step}-${index}`} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                {step.step}
              </div>
              {index < steps.length - 1 ? <div className="h-full min-h-6 w-px bg-slate-200" /> : null}
            </div>
            <div className="flex-1 pb-5">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", cfg.chip)}>{cfg.label}</span>
                <span className="text-xs text-slate-600">{step.entity}</span>
                {step.date ? <span className="text-xs text-slate-500">• {step.date}</span> : null}
              </div>
              <p className="text-sm text-slate-700">{step.description}</p>
              {step.flags && step.flags.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {step.flags.map((flag) => (
                    <span
                      key={`${step.step}-${flag}`}
                      className="rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-700"
                    >
                      {flag}
                    </span>
                  ))}
                </div>
              ) : null}
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
  const risk = RISK_CONFIG[analysis.riskLevel] ?? RISK_CONFIG.medium;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "w-full rounded-xl border p-4 text-left transition-colors",
        selected
          ? "border-slate-900 bg-slate-900 text-white"
          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50",
      )}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[11px] font-semibold",
            selected ? "bg-white/15 text-white" : risk.chip,
          )}
        >
          {risk.label}
        </span>
        <span className={cn("text-xs", selected ? "text-slate-300" : "text-slate-500")}>
          {new Date(analysis.analyzedAt).toLocaleDateString("pt-BR")}
        </span>
      </div>

      <h3 className={cn("line-clamp-2 text-sm font-semibold", selected ? "text-white" : "text-slate-900")}>
        {analysis.documentTitle}
      </h3>

      {analysis.financialRequest.hasRequest ? (
        <p className={cn("mt-2 text-xs font-semibold", selected ? "text-orange-300" : "text-orange-700")}>
          Pedido financeiro: {formatCurrency(analysis.financialRequest.value)}
        </p>
      ) : null}
    </button>
  );
}

function AnalysisDetail({ analysis }: { analysis: RastreabilidadeAnalysis }) {
  const [openSection, setOpenSection] = useState("trace");
  const treasury = TREASURY_CONFIG[analysis.treasuryImpact.riskLevel] ?? TREASURY_CONFIG.yellow;

  const toggleSection = (sectionId: string) => {
    setOpenSection((previous) => (previous === sectionId ? "" : sectionId));
  };

  const DetailSection = ({
    id,
    label,
    icon: Icon,
    children,
  }: {
    id: string;
    label: string;
    icon: ElementType;
    children: ReactNode;
  }) => (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <button
        type="button"
        onClick={() => toggleSection(id)}
        className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-slate-50"
      >
        <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-800">
          <Icon className="h-4 w-4" />
          {label}
        </span>
        {openSection === id ? (
          <ChevronDown className="h-4 w-4 text-slate-500" />
        ) : (
          <ChevronRight className="h-4 w-4 text-slate-500" />
        )}
      </button>
      {openSection === id ? <div className="border-t border-slate-200 p-4">{children}</div> : null}
    </div>
  );

  return (
    <div className="space-y-4">
      <SectionBlock title={analysis.documentTitle} description={analysis.summary}>
        <div className="flex flex-wrap items-center gap-2">
          <RiskBadge level={analysis.riskLevel} score={analysis.riskScore} />
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
            Prioridade {analysis.importanceRanking.priority.toUpperCase()}
          </span>
          <span className="text-xs text-slate-500">
            Analisado em {new Date(analysis.analyzedAt).toLocaleString("pt-BR")}
          </span>
        </div>
      </SectionBlock>

      <div className={cn("rounded-xl border p-4", treasury.box)}>
        <p className={cn("text-sm font-semibold", treasury.labelColor)}>{treasury.label}</p>
        <p className="mt-1 text-xs text-slate-600">{treasury.desc}</p>
        <p className="mt-2 text-sm text-slate-700">{analysis.treasuryImpact.explanation}</p>
        {!analysis.treasuryImpact.canFulfillCommitment ? (
          <InlineStatus kind="error" className="mt-3">
            Cofre pode não cumprir este compromisso sem ajuste de execução.
          </InlineStatus>
        ) : null}
      </div>

      {analysis.financialRequest.hasRequest ? (
        <SectionBlock
          title="Pedido de Recurso Identificado"
          description="Resumo estruturado do pedido financeiro detectado pela análise."
        >
          <div className="grid gap-3 text-sm sm:grid-cols-2">
            <p>
              <span className="font-semibold text-slate-700">Valor:</span> {formatCurrency(analysis.financialRequest.value)}
            </p>
            <p>
              <span className="font-semibold text-slate-700">Categoria:</span> {analysis.financialRequest.category ?? "N/D"}
            </p>
            <p>
              <span className="font-semibold text-slate-700">Fonte:</span> {analysis.financialRequest.source ?? "N/D"}
            </p>
            <p>
              <span className="font-semibold text-slate-700">Destino:</span> {analysis.financialRequest.destination ?? "N/D"}
            </p>
          </div>
          {analysis.financialRequest.description ? (
            <p className="mt-3 text-sm text-slate-700">{analysis.financialRequest.description}</p>
          ) : null}
        </SectionBlock>
      ) : null}

      {analysis.missingDocuments.length > 0 ? (
        <DetailSection id="docs" label={`Documentos faltantes (${analysis.missingDocuments.length})`} icon={FileX}>
          <div className="space-y-2">
            {analysis.missingDocuments.map((document) => (
              <div
                key={`${document.name}-${document.reason}`}
                className={cn(
                  "rounded-lg border p-3",
                  document.severity === "critical"
                    ? "border-red-200 bg-red-50"
                    : document.severity === "high"
                      ? "border-orange-200 bg-orange-50"
                      : "border-amber-200 bg-amber-50",
                )}
              >
                <p className="text-sm font-semibold text-slate-900">{document.name}</p>
                <p className="mt-1 text-xs text-slate-600">{document.reason}</p>
              </div>
            ))}
          </div>
        </DetailSection>
      ) : null}

      <DetailSection id="trace" label="Cadeia de rastreabilidade" icon={GitBranch}>
        <TraceChainView steps={analysis.traceChain} />
      </DetailSection>

      <DetailSection id="importance" label="Importância relativa" icon={BarChart3}>
        <div className="mb-2 flex items-center justify-between text-xs">
          <span className="font-semibold uppercase tracking-[0.12em] text-slate-500">Score</span>
          <span className="font-semibold text-slate-800">{analysis.importanceRanking.score}/100</span>
        </div>
        <div className="h-2 rounded-full bg-slate-200">
          <div className="h-2 rounded-full bg-slate-900" style={{ width: `${analysis.importanceRanking.score}%` }} />
        </div>
        <p className="mt-3 text-sm text-slate-700">{analysis.importanceRanking.justification}</p>
      </DetailSection>

      <DetailSection id="recommendations" label="Recomendações" icon={TrendingUp}>
        <ul className="space-y-2">
          {analysis.recommendations.map((recommendation) => (
            <li key={recommendation} className="flex items-start gap-2 text-sm text-slate-700">
              <ArrowRight className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-500" />
              {recommendation}
            </li>
          ))}
        </ul>
      </DetailSection>

      {analysis.relatedAnalyses.length > 0 ? (
        <DetailSection id="related" label={`Análises relacionadas (${analysis.relatedAnalyses.length})`} icon={GitBranch}>
          <div className="space-y-2">
            {analysis.relatedAnalyses.map((related) => (
              <div key={`${related.id}-${related.relationship}`} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="font-semibold text-slate-900">{related.id}</span>
                  <span className="rounded-full bg-white px-2 py-0.5 font-semibold text-slate-600">
                    {related.relationship.replaceAll("_", " ")}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-600">Relevância: {related.relevanceScore}%</p>
              </div>
            ))}
          </div>
        </DetailSection>
      ) : null}
    </div>
  );
}

export function Rastreabilidade() {
  const [analyses, setAnalyses] = useState<RastreabilidadeAnalysis[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [manualDocId, setManualDocId] = useState("");
  const [manualDocTitle, setManualDocTitle] = useState("");
  const [manualDocContent, setManualDocContent] = useState("");

  const selectedAnalysis = analyses.find((analysis) => analysis.documentId === selectedId);

  const stats = useMemo(() => {
    return {
      total: analyses.length,
      critical: analyses.filter((analysis) => analysis.riskLevel === "critical").length,
      high: analyses.filter((analysis) => analysis.riskLevel === "high").length,
      medium: analyses.filter((analysis) => analysis.riskLevel === "medium").length,
      low: analyses.filter((analysis) => analysis.riskLevel === "low").length,
      withFinancialRequest: analyses.filter((analysis) => analysis.financialRequest.hasRequest).length,
      totalValueAtRisk: analyses
        .filter((analysis) => analysis.financialRequest.hasRequest && analysis.financialRequest.value)
        .reduce((total, analysis) => total + (analysis.financialRequest.value ?? 0), 0),
    };
  }, [analyses]);

  useEffect(() => {
    let active = true;

    const loadHistory = async () => {
      try {
        const history = await fetchFinancialTraceabilityHistory();
        if (!active) return;
        setAnalyses(history);
        setHistoryError(null);
      } catch (error) {
        if (!active) return;
        setHistoryError(
          error instanceof Error ? error.message : "Falha ao carregar histórico de rastreabilidade.",
        );
      } finally {
        if (active) {
          setLoadingHistory(false);
        }
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
    (analysis) =>
      !searchTerm ||
      analysis.documentTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      analysis.summary.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const runAnalysis = useCallback(async () => {
    if (!manualDocId || !manualDocTitle || !manualDocContent.trim()) return;

    setAnalyzing(true);
    setAnalyzeError(null);

    try {
      const treasury = buildCurrentTreasurySnapshot();
      const previousAnalyses = analyses.slice(0, 10).map((analysis) => ({
        id: analysis.documentId,
        title: analysis.documentTitle,
        riskScore: analysis.riskScore,
        summary: analysis.summary,
        financialValue: analysis.financialRequest.value,
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

      setAnalyses((previous) => [normalized, ...previous.filter((item) => item.documentId !== normalized.documentId)]);
      setSelectedId(normalized.documentId);
      setManualDocId("");
      setManualDocTitle("");
      setManualDocContent("");
    } catch (error) {
      setAnalyzeError(error instanceof Error ? error.message : "Erro ao executar análise.");
    } finally {
      setAnalyzing(false);
    }
  }, [manualDocId, manualDocTitle, manualDocContent, analyses]);

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      <PageHero
        title="Rastreabilidade Financeira"
        description="Análise auditável de fluxo de recursos públicos, risco fiscal e cadeia de decisão de documentos."
        eyebrow="Governança Interna"
        icon={GitBranch}
        actions={<AuthBadge text="Uso interno" />}
      />

      <PageContainer className="space-y-6 pt-8">
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
          <StatKpi label="Análises" value={stats.total} />
          <StatKpi label="Crítico" value={stats.critical} className="border-red-200 bg-red-50" />
          <StatKpi label="Alto" value={stats.high} className="border-orange-200 bg-orange-50" />
          <StatKpi label="Médio" value={stats.medium} className="border-amber-200 bg-amber-50" />
          <StatKpi label="Baixo" value={stats.low} className="border-emerald-200 bg-emerald-50" />
          <StatKpi label="Com Pedido" value={stats.withFinancialRequest} />
        </section>

        {stats.withFinancialRequest > 0 ? (
          <InlineStatus kind="warning">
            {stats.withFinancialRequest} análise(s) com pedido de recurso. Volume em risco monitorado:{" "}
            <strong>{formatCurrency(stats.totalValueAtRisk)}</strong>.
          </InlineStatus>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[minmax(320px,380px)_minmax(0,1fr)]">
          <div className="space-y-4">
            <SectionBlock
              title="Nova Análise"
              description="Envie ID, título e conteúdo bruto para processar via Edge Function."
            >
              <div className="space-y-3">
                <input
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400"
                  placeholder="ID do documento (ex: PL-2024-047)"
                  value={manualDocId}
                  onChange={(event) => setManualDocId(event.target.value)}
                />
                <input
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400"
                  placeholder="Título do documento"
                  value={manualDocTitle}
                  onChange={(event) => setManualDocTitle(event.target.value)}
                />
                <textarea
                  className="w-full resize-none rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400"
                  placeholder="Cole o conteúdo do documento (texto extraído, corpo de projeto etc.)"
                  rows={7}
                  value={manualDocContent}
                  onChange={(event) => setManualDocContent(event.target.value)}
                />

                {analyzeError ? <InlineStatus kind="error">{analyzeError}</InlineStatus> : null}

                <button
                  type="button"
                  onClick={runAnalysis}
                  disabled={analyzing || !manualDocId || !manualDocTitle || !manualDocContent.trim()}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {analyzing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Processando análise...
                    </>
                  ) : (
                    <>
                      <Shield className="h-4 w-4" />
                      Analisar via Edge Function
                    </>
                  )}
                </button>
              </div>
            </SectionBlock>

            <SectionBlock title="Histórico de Análises" description="Selecione um item para abrir os detalhes completos.">
              <div className="relative mb-3">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm placeholder:text-slate-400"
                  placeholder="Buscar por título ou resumo"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
              </div>

              {historyError ? <InlineStatus kind="error" className="mb-3">{historyError}</InlineStatus> : null}

              {loadingHistory ? (
                <PageState mode="loading" title="Carregando histórico" />
              ) : filteredAnalyses.length === 0 ? (
                <PageState
                  mode="empty"
                  title={analyses.length === 0 ? "Nenhuma análise registrada" : "Sem resultados para o filtro"}
                />
              ) : (
                <div className="space-y-2">
                  {filteredAnalyses.map((analysis) => (
                    <AnalysisCard
                      key={analysis.documentId}
                      analysis={analysis}
                      selected={selectedId === analysis.documentId}
                      onSelect={() => setSelectedId(analysis.documentId)}
                    />
                  ))}
                </div>
              )}
            </SectionBlock>
          </div>

          <div>
            {selectedAnalysis ? (
              <AnalysisDetail analysis={selectedAnalysis} />
            ) : (
              <PageState
                mode="empty"
                title="Selecione uma análise"
                description="Escolha um item na coluna lateral para visualizar o diagnóstico completo."
              />
            )}
          </div>
        </div>
      </PageContainer>
    </div>
  );
}
