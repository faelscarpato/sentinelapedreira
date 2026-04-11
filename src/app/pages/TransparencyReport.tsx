import { Download, FileText, TrendingUp, Users } from "lucide-react";
import {
  PageContainer,
  SectionBlock,
  SectionHeading,
} from "../components/layout/PagePrimitives";
import {
  StatCard,
  ExpenseChart,
  FlowChart,
  Timeline,
  LoadingSkeleton,
} from "../components/common";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { SEO } from "../components/ui/SEO";
import { useState } from "react";

export function TransparencyReport() {
  const [reportMonth] = useState("Novembro/2025");
  const [isLoading] = useState(false);

  // Mock data
  const expenseData = [
    { label: "Educação", value: 245000 },
    { label: "Saúde", value: 189000 },
    { label: "Infraestrutura", value: 156000 },
    { label: "Segurança", value: 98000 },
    { label: "Administração", value: 67000 },
  ];

  const timelineEvents = [
    {
      id: "1",
      title: "Orçamento Aprovado",
      description: "Câmara Municipal aprovou orçamento 2025",
      timestamp: "01/01/2025",
      status: "completed" as const,
    },
    {
      id: "2",
      title: "Empenhos Emitidos",
      description: "Empenhos de November processados",
      timestamp: "30/11/2025",
      status: "completed" as const,
    },
    {
      id: "3",
      title: "Liquidações Realizadas",
      description: "Documentação de despesas liquidadas",
      timestamp: "Em progresso",
      status: "in_progress" as const,
    },
    {
      id: "4",
      title: "Pagamentos Efetuados",
      description: "Transferências bancárias completadas",
      timestamp: "Programado",
      status: "pending" as const,
    },
  ];

  const flowNodes = [
    { id: "1", label: "Solicitação", value: "1.247 reqs", status: "ok" as const },
    { id: "2", label: "Empenho", value: "1.198 docs", status: "ok" as const },
    { id: "3", label: "Liquidação", value: "1.156 docs", status: "warning" as const },
    { id: "4", label: "Pagamento", value: "1.142 docs", status: "ok" as const },
  ];

  return (
    <PageContainer>
      <SEO
        title="Relatório de Transparência"
        description="Relatório mensal de transparência financeira"
      />
      <SectionBlock>
        <div className="flex items-center justify-between mb-6">
          <div>
            <SectionHeading>Relatório de Transparência</SectionHeading>
            <p className="text-sm text-muted-foreground mt-2">Período: {reportMonth}</p>
          </div>
          <Button>
            <Download className="h-4 w-4 mr-2" />
            Baixar PDF
          </Button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Receita Total"
            value="R$ 2.456.000"
            description="Arrecadação do mês"
            icon={<TrendingUp className="h-4 w-4" />}
            variant="success"
          />
          <StatCard
            title="Despesas Realizadas"
            value="R$ 1.847.000"
            description="Pagamentos processados"
            icon={<FileText className="h-4 w-4" />}
            variant="default"
          />
          <StatCard
            title="Documentos"
            value="1,247"
            description="Processados e validados"
            icon={<FileText className="h-4 w-4" />}
            variant="default"
          />
          <StatCard
            title="Taxa de Conformidade"
            value="98.2%"
            description="Documentos em dia"
            icon={<Users className="h-4 w-4" />}
            variant="success"
          />
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="financial">Financeiro</TabsTrigger>
            <TabsTrigger value="compliance">Conformidade</TabsTrigger>
            <TabsTrigger value="details">Detalhes</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Flow Chart */}
            <FlowChart
              nodes={flowNodes}
              title="Rastreamento de Despesas"
              description="Fluxo de processamento de empenhos e pagamentos"
            />

            {/* Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Cronograma do Período</CardTitle>
                <CardDescription>Eventos e marcos do mês</CardDescription>
              </CardHeader>
              <CardContent>
                <Timeline events={timelineEvents} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="financial" className="space-y-6">
            {isLoading ? (
              <LoadingSkeleton type="card" count={2} />
            ) : (
              <>
                <ExpenseChart
                  data={expenseData}
                  title="Despesas por Departamento"
                  description="Distribuição de gastos no período"
                  height={350}
                />

                <Card>
                  <CardHeader>
                    <CardTitle>Receitas e Transferências</CardTitle>
                    <CardDescription>Origem dos recursos</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        { label: "ICMS", value: "R$ 1.234.567", pct: "50.2%" },
                        { label: "IPTU", value: "R$ 456.789", pct: "18.6%" },
                        { label: "ISS", value: "R$ 345.678", pct: "14.1%" },
                        { label: "Transferências", value: "R$ 419.000", pct: "17.1%" },
                      ].map((item) => (
                        <div key={item.label} className="flex justify-between items-center">
                          <span className="text-sm">{item.label}</span>
                          <div className="flex items-center gap-4">
                            <span className="font-semibold">{item.value}</span>
                            <span className="text-xs text-muted-foreground w-10 text-right">
                              {item.pct}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          <TabsContent value="compliance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Verificações de Conformidade</CardTitle>
                <CardDescription>Auditoria e validação de documentos</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: "Documentos validados", value: 1247, total: 1247, status: "ok" },
                  { label: "Com divergências menores", value: 5, total: 1247, status: "warning" },
                  { label: "Em análise", value: 8, total: 1247, status: "in_progress" },
                  { label: "Com problemas críticos", value: 0, total: 1247, status: "error" },
                ].map((item) => (
                  <div key={item.label} className="pb-4 border-b last:border-b-0">
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">{item.label}</span>
                      <span className="text-sm">{item.value} documentos</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className={`h-full rounded-full transition-all ${
                          item.status === "ok"
                            ? "bg-green-500"
                            : item.status === "warning"
                              ? "bg-yellow-500"
                              : "bg-blue-500"
                        }`}
                        style={{ width: `${(item.value / item.total) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="details" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informações Detalhadas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "Período", value: reportMonth },
                    { label: "Município", value: "Pedreira - SP (IBGE 3537107)" },
                    { label: "Gestor", value: "Prefeitura Municipal" },
                    { label: "Relatório ID", value: "REL-2025-11-001" },
                    { label: "Gerado em", value: "04/11/2025 às 14:32 UTC" },
                    { label: "Versão", value: "1.0" },
                  ].map((item) => (
                    <div key={item.label}>
                      <p className="text-xs text-muted-foreground">{item.label}</p>
                      <p className="font-semibold">{item.value}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </SectionBlock>
    </PageContainer>
  );
}
