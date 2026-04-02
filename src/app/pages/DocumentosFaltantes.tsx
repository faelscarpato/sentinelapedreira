import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router";
import { DocumentCard } from "../components/DocumentCard";
import { PaginationControls } from "../components/PaginationControls";
import { PdfModal } from "../components/PdfModal";
import { documentosFaltantes } from "../data/realData";
import type { Document } from "../data/realData";
import { isPdfDocument, openExternalSource } from "../lib/sourceUtils";

const PAGE_SIZE = 12;

export function DocumentosFaltantes() {
  const [currentPage, setCurrentPage] = useState(1);
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const navigate = useNavigate();

  const handleViewOriginal = (document: Document) => {
    if (!document.originalUrl) return;
    if (isPdfDocument(document)) {
      setSelectedDocument(document);
      setPdfModalOpen(true);
      return;
    }

    openExternalSource(document.originalUrl);
  };

  const handleViewAnalysis = (document: Document) => {
    if (!document.analysisUrl) return;
    navigate(document.analysisUrl);
  };

  const totalPages = Math.max(1, Math.ceil(documentosFaltantes.length / PAGE_SIZE));
  const paginatedDocuments = documentosFaltantes.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-neutral-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-4 mb-4">
            <AlertTriangle className="w-10 h-10 text-orange-400" />
            <div>
              <h1 className="text-3xl font-mono">Documentos Faltantes</h1>
              <p className="text-neutral-300 mt-2">
                Documentos esperados que não foram localizados nos prazos legais
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Explanation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-orange-50 border border-orange-200 p-6 mb-8">
          <h2 className="font-mono text-sm mb-3 text-orange-900">COMO FUNCIONA ESTA SEÇÃO</h2>
          <div className="space-y-2 text-sm text-orange-800">
            <p>
              Esta página lista documentos que, por obrigação legal ou regulamentar, deveriam estar
              disponíveis publicamente mas não foram localizados no portal de transparência.
            </p>
            <p>
              A ausência de documentos pode decorrer de:
            </p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Atraso na publicação (ainda dentro do prazo de verificação)</li>
              <li>Não publicação no prazo legal estabelecido</li>
              <li>Publicação em local não indexado pela plataforma</li>
            </ul>
            <p className="mt-3 italic">
              Esta listagem tem caráter informativo e de radar de transparência, não constituindo
              denúncia ou acusação formal.
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <div className="border border-neutral-200 p-6">
            <div className="text-3xl font-mono mb-2">{documentosFaltantes.length}</div>
            <div className="text-sm text-neutral-600">Documentos não localizados</div>
          </div>
          <div className="border border-neutral-200 p-6">
            <div className="text-3xl font-mono mb-2">
              {documentosFaltantes.filter(d => d.riskLevel === 'high').length}
            </div>
            <div className="text-sm text-neutral-600">Prioridade alta (obrigatório LRF)</div>
          </div>
          <div className="border border-neutral-200 p-6">
            <div className="text-3xl font-mono mb-2">
              {documentosFaltantes.filter(d => d.riskLevel === 'medium').length}
            </div>
            <div className="text-sm text-neutral-600">Prioridade média</div>
          </div>
        </div>

        {/* Documents */}
        <div className="mb-6">
          <h2 className="text-xl font-mono mb-4">Lista de Documentos</h2>
          <p className="text-sm text-neutral-600 font-mono mb-6">
            Ordenado por nível de risco e data esperada
          </p>
        </div>

        <div className="space-y-4">
          {paginatedDocuments.map((doc) => (
            <DocumentCard
              key={doc.id}
              document={doc}
              onViewOriginal={doc.originalUrl ? () => handleViewOriginal(doc) : undefined}
              onViewAnalysis={doc.analysisUrl ? () => handleViewAnalysis(doc) : undefined}
            />
          ))}
        </div>

        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />

        {documentosFaltantes.length === 0 && (
          <div className="text-center py-20">
            <AlertTriangle className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
            <p className="text-neutral-600 font-mono mb-2">
              Nenhum documento faltante identificado
            </p>
            <p className="text-sm text-neutral-500">
              Todos os documentos esperados estão publicados nos prazos legais
            </p>
          </div>
        )}

        {/* Legal Context */}
        <div className="mt-12 bg-blue-50 border border-blue-200 p-6">
          <h3 className="font-mono text-sm mb-3 text-blue-900">BASE LEGAL</h3>
          <div className="space-y-2 text-sm text-blue-800">
            <p>
              <strong>Lei de Responsabilidade Fiscal (LC 101/2000):</strong> Estabelece prazos
              para publicação de RREO (bimestral) e RGF (quadrimestral).
            </p>
            <p>
              <strong>Lei de Acesso à Informação (Lei 12.527/2011):</strong> Determina que
              órgãos públicos devem divulgar informações de interesse coletivo.
            </p>
            <p>
              <strong>Lei Orgânica Municipal:</strong> Define prazos para publicação de atas
              e documentos legislativos.
            </p>
          </div>
        </div>
      </div>

      <PdfModal
        isOpen={pdfModalOpen}
        onClose={() => setPdfModalOpen(false)}
        title={selectedDocument?.title || ""}
        date={selectedDocument?.date}
        source={selectedDocument?.sourceEntity}
        pdfUrl={selectedDocument?.originalUrl}
      />
    </div>
  );
}

