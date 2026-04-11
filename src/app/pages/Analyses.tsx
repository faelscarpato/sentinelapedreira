import { useState } from "react";
import { BarChart3, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";
import {
  PageContainer,
  SectionBlock,
  SectionHeading,
  StatKpi,
} from "../components/layout/PagePrimitives";
import {
  AnalysisCard,
  StatCard,
  LoadingSkeleton,
  EmptyState,
} from "../components/common";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { SEO } from "../components/ui/SEO";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export function Analyses() {
  const [isLoading, setIsLoading] = useState(false);

  // Mock data
  const expenseData = [
    { month: "Jan", value: 120000 },
    { month: "Fev", value: 132000 },
    { month: "Mar", value: 101000 },
    { month: "Abr", value: 98000 },
    { month: "Mai", value: 125000 },
    { month: "Jun", value: 130000 },
  ];

  const analyses = [
    {
      id: "1",
      title: "Análise de Despesas 2025",
      description: "Rastreabilidade financeira dos empenhos",
      status: "completed" as const,
      metrics: [
        { label: "Total Despesas", value: "R$ 756.000" },
        { label: "Divergências", value: 3 },
        { label: "Conformidade", value: "98%" },
      ],
      riskLevel: "low" as const,
    },
    {
      id: "2",
      title: "Verificação de Licitações",
      description: "Análise de regularidade dos processos",
      status: "in_progress" as const,
      metrics: [
        { label: "Processos", value: 12 },
        { label: "Em análise", value: 5 },
        { label: "Conformes", value: 7 },
      ],
      riskLevel: "medium" as const,
    },
    {
      id: "3",
      title: "Repasses - TCE-SP",
      description: "Verificação de documentação",
      status: "pending" as const,
      metrics: [
        { label: "Valor Total", value: "R$ 2.3M" },
        { label: "Pendente", value: "R$ 450K" },
        { label: "Conformidade", value: "85%" },
      ],
      riskLevel: "high" as const,
    },
  ];

  return (
    <PageContainer>
      <SEO title="Análises" description="Análises financeiras e rastreabilidade" />
      <SectionBlock>
        <SectionHeading>Análises Financeiras</SectionHeading>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Despesas Totais"
            value="R$ 756.000"
            description="Mês de Novembro"
            variant="default"
            trend="up"
            trendValue="+12%"
            icon={<BarChart3 className="h-4 w-4" />}
          />
          <StatCard
            title="Documentos Verificados"
            value="127"
            description="Últimos 30 dias"
            variant="success"
            trend="up"
            trendValue="+8"
          />
          <StatCard
            title="Divergências Encontradas"
            value="3"
            description="Requer atenção"
            variant="warning"
            icon={<AlertTriangle className="h-4 w-4" />}
          />
          <StatCard
            title="Taxa de Conformidade"
            value="97.8%"
            description="Acima da média"
            variant="success"
            icon={<CheckCircle className="h-4 w-4" />}
          />
        </div>

        <Tabs defaultValue="chart" className="mb-8">
          <TabsList>
            <TabsTrigger value="chart">Gráficos</TabsTrigger>
            <TabsTrigger value="analyses">Análises</TabsTrigger>
          </TabsList>

          <TabsContent value="chart" className="space-y-6">
            <div className="bg-white dark:bg-slate-950 rounded-lg border p-6">
              <h3 className="font-semibold mb-4">Despesas Mensais</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={expenseData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => `R$ ${value.toLocaleString()}`} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#3b82f6"
                    name="Despesas"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="analyses" className="space-y-4">
            {isLoading ? (
              <LoadingSkeleton type="card" count={3} />
            ) : (
              analyses.map((analysis) => (
                <AnalysisCard
                  key={analysis.id}
                  title={analysis.title}
                  description={analysis.description}
                  status={analysis.status}
                  metrics={analysis.metrics}
                  riskLevel={analysis.riskLevel}
                  onViewDetails={() => console.log("View details:", analysis.id)}
                  onViewReport={() => console.log("View report:", analysis.id)}
                />
              ))
            )}
          </TabsContent>
        </Tabs>
      </SectionBlock>
    </PageContainer>
  );
}
