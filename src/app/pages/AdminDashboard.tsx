import { useState } from "react";
import { LayoutDashboard, Users, FileText, Settings, BarChart3 } from "lucide-react";
import {
  PageContainer,
  SectionBlock,
  SectionHeading,
} from "../components/layout/PagePrimitives";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { DataTable, StatCard, LoadingSkeleton } from "../components/common";
import { SEO } from "../components/ui/SEO";
import { AlertCircle, CheckCircle, Clock } from "lucide-react";

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");

  const recentContents = [
    {
      id: "1",
      title: "Relatório Financeiro Nov/2025",
      type: "Relatório",
      status: "published",
      date: "2025-11-04",
    },
    {
      id: "2",
      title: "Edital Licitação nº 45/2025",
      type: "Licitação",
      status: "draft",
      date: "2025-11-03",
    },
    {
      id: "3",
      title: "Parecer TCE-SP",
      type: "Parecer",
      status: "review",
      date: "2025-11-02",
    },
  ];

  const columns = [
    { key: "title", label: "Título", sortable: true },
    { key: "type", label: "Tipo", sortable: true },
    {
      key: "status",
      label: "Status",
      render: (status: string) => (
        <Badge
          variant={
            status === "published" ? "default" : status === "draft" ? "outline" : "secondary"
          }
        >
          {status === "published"
            ? "Publicado"
            : status === "draft"
              ? "Rascunho"
              : "Revisão"}
        </Badge>
      ),
    },
    { key: "date", label: "Data", sortable: true },
  ];

  return (
    <PageContainer>
      <SEO title="Painel Admin" description="Painel de administração de conteúdo" />
      <SectionBlock>
        <div className="flex items-center justify-between mb-6">
          <SectionHeading>Painel Editorial</SectionHeading>
          <Button>+ Novo Conteúdo</Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="contents">Conteúdos</TabsTrigger>
            <TabsTrigger value="users">Usuários</TabsTrigger>
            <TabsTrigger value="analytics">Análises</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <StatCard
                title="Conteúdos Publicados"
                value="247"
                description="Total de documentos"
                icon={<FileText className="h-4 w-4" />}
                variant="default"
              />
              <StatCard
                title="Pendentes de Revisão"
                value="12"
                description="Aguardando aprovação"
                icon={<Clock className="h-4 w-4" />}
                variant="warning"
              />
              <StatCard
                title="Usuários Ativos"
                value="1,547"
                description="Último mês"
                icon={<Users className="h-4 w-4" />}
                variant="success"
              />
              <StatCard
                title="Denúncias Recebidas"
                value="8"
                description="Última semana"
                icon={<AlertCircle className="h-4 w-4" />}
                variant="danger"
              />
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Atividade Recente</CardTitle>
                <CardDescription>Últimos conteúdos publicados</CardDescription>
              </CardHeader>
              <CardContent>
                <DataTable columns={columns} data={recentContents} pageSize={10} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contents" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Gerenciar Conteúdos</CardTitle>
                <CardDescription>
                  Publique, edite e delete documentos e relatórios
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2 mb-4">
                  <Input placeholder="Buscar conteúdo..." />
                  <Button variant="outline">Filtrar</Button>
                </div>
                <DataTable columns={columns} data={recentContents} pageSize={20} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Gerenciar Usuários</CardTitle>
                <CardDescription>Controle de acesso e permissões</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2 mb-4">
                  <Input placeholder="Buscar usuário..." />
                  <Button variant="outline">Filtrar</Button>
                </div>
                <LoadingSkeleton type="table" count={5} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Estatísticas</CardTitle>
                <CardDescription>Visão geral de uso e acesso</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">Documentos Visitados</h4>
                    <p className="text-2xl font-bold">3,847</p>
                    <p className="text-sm text-muted-foreground">+12% semana anterior</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">Usuários Únicos</h4>
                    <p className="text-2xl font-bold">892</p>
                    <p className="text-sm text-muted-foreground">+5% semana anterior</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </SectionBlock>
    </PageContainer>
  );
}
