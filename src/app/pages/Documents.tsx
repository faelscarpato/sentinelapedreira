import { useState } from "react";
import { useNavigate } from "react-router";
import { FileText, Download } from "lucide-react";
import {
  PageContainer,
  SectionBlock,
  SectionHeading,
} from "../components/layout/PagePrimitives";
import { SearchBar, DataTable, LoadingSkeleton, EmptyState } from "../components/common";
import { Button } from "../components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { SEO } from "../components/ui/SEO";

export function Documents() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [documentType, setDocumentType] = useState("all");
  const [isLoading] = useState(false);

  // Mock data - replace with real data from Supabase
  const mockDocuments = [
    {
      id: "doc1",
      title: "Relatório Financeiro 2025",
      type: "Relatório",
      date: "2025-11-04",
      source: "Prefeitura",
      status: "Publicado",
    },
    {
      id: "doc2",
      title: "Licitação - Serviços de Limpeza",
      type: "Licitação",
      date: "2025-11-03",
      source: "Câmara",
      status: "Aberta",
    },
    {
      id: "doc3",
      title: "Parecer Jurídico nº 42/2025",
      type: "Parecer",
      date: "2025-11-02",
      source: "TCE-SP",
      status: "Arquivado",
    },
  ];

  const filteredDocuments = mockDocuments.filter((doc) => {
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = documentType === "all" || doc.type === documentType;
    return matchesSearch && matchesType;
  });

  const columns = [
    {
      key: "title",
      label: "Documento",
      sortable: true,
      render: (value: string) => (
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-blue-500" />
          {value}
        </div>
      ),
    },
    { key: "type", label: "Tipo", sortable: true },
    { key: "date", label: "Data", sortable: true },
    { key: "source", label: "Origem", sortable: true },
    { key: "status", label: "Status", sortable: true },
  ];

  return (
    <PageContainer>
      <SEO title="Documentos" description="Navegue e busque documentos públicos" />
      <SectionBlock>
        <div className="flex items-center justify-between mb-6">
          <SectionHeading>Documentos Públicos</SectionHeading>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>

        <SearchBar
          placeholder="Buscar documentos por título, tipo ou origem..."
          onSearch={setSearchQuery}
          className="mb-6"
        />

        <div className="flex gap-3 mb-6">
          <Select value={documentType} onValueChange={setDocumentType}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrar por tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              <SelectItem value="Relatório">Relatórios</SelectItem>
              <SelectItem value="Licitação">Licitações</SelectItem>
              <SelectItem value="Parecer">Pareceres</SelectItem>
              <SelectItem value="Decreto">Decretos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <LoadingSkeleton type="table" count={5} />
        ) : filteredDocuments.length > 0 ? (
          <DataTable
            columns={columns}
            data={filteredDocuments}
            pageSize={10}
            onRowClick={(row) => navigate(`/documentos/${row.id}`)}
          />
        ) : (
          <EmptyState
            title="Nenhum documento encontrado"
            description="Tente ajustar seus filtros ou realizar uma nova busca"
            action={{
              label: "Limpar filtros",
              onClick: () => {
                setSearchQuery("");
                setDocumentType("all");
              },
            }}
          />
        )}
      </SectionBlock>
    </PageContainer>
  );
}
