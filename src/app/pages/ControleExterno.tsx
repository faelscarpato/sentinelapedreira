import { useEffect, useState } from "react";
import { Shield } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router";
import { DocumentCard } from "../components/DocumentCard";
import { PdfModal } from "../components/PdfModal";
import { PaginationControls } from "../components/PaginationControls";
import { controleExternoDocuments } from "../data/realData";
import type { Document } from "../data/realData";
import { isPdfDocument, openExternalSource } from "../lib/sourceUtils";
import { getDocumentDetailHref } from "../lib/documentDetailRoute";

const PAGE_SIZE = 24;

export function ControleExterno() {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  const subtypeFromUrl = searchParams.get("subtype") || "todos";
  const [selectedSubtype, setSelectedSubtype] = useState(subtypeFromUrl);
  const [currentPage, setCurrentPage] = useState(1);
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const navigate = useNavigate();

  const handleViewOriginal = (doc: Document) => {
    if (!doc.originalUrl) return;
    if (isPdfDocument(doc)) {
      setSelectedDocument(doc);
      setPdfModalOpen(true);
      return;
    }

    openExternalSource(doc.originalUrl);
  };

  const handleViewAnalysis = (doc: Document) => {
    if (doc.analysisUrl) {
      navigate(doc.analysisUrl);
    }
  };

  const handleViewDetails = (doc: Document) => {
    navigate(getDocumentDetailHref(doc));
  };

  const filteredDocuments = controleExternoDocuments.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.summary.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubtype = selectedSubtype === "todos" || doc.subtype === selectedSubtype;
    return matchesSearch && matchesSubtype;
  });

  const totalPages = Math.max(1, Math.ceil(filteredDocuments.length / PAGE_SIZE));
  const paginatedDocuments = filteredDocuments.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedSubtype]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const subtypes = Array.from(new Set(controleExternoDocuments.map((doc) => doc.subtype).filter(Boolean)));

  useEffect(() => {
    const normalizedSubtype = subtypeFromUrl;
    if (normalizedSubtype === selectedSubtype) return;
    setSelectedSubtype(normalizedSubtype);
  }, [selectedSubtype, subtypeFromUrl]);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-neutral-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-4 mb-4">
            <Shield className="w-10 h-10" />
            <div>
              <h1 className="text-3xl font-mono">Controle Externo</h1>
              <p className="text-neutral-300 mt-2">
                Documentos do TCE, TCU e órgãos de fiscalização
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="border-b border-neutral-200 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <label className="block text-xs font-mono text-neutral-600 mb-2">
                BUSCAR
              </label>
              <input
                type="text"
                placeholder="Pesquisar por tipo, órgão ou conteúdo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-neutral-300 focus:outline-none focus:border-black font-mono text-sm"
              />
            </div>

            {/* Subtype Filter */}
            <div>
              <label className="block text-xs font-mono text-neutral-600 mb-2">
                TIPO
              </label>
              <select
                value={selectedSubtype}
                onChange={(e) => {
                  const nextValue = e.target.value;
                  setSelectedSubtype(nextValue);
                  const nextParams = new URLSearchParams(searchParams);
                  if (nextValue === "todos") {
                    nextParams.delete("subtype");
                  } else {
                    nextParams.set("subtype", nextValue);
                  }
                  setSearchParams(nextParams, { replace: true });
                }}
                className="w-full px-4 py-2 border border-neutral-300 focus:outline-none focus:border-black font-mono text-sm bg-white"
              >
                <option value="todos">Todos os tipos</option>
                {subtypes.map((subtype) => (
                  <option key={subtype} value={subtype}>
                    {subtype}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Info */}
          <div className="mt-6 bg-orange-50 border border-orange-200 p-4">
            <p className="text-sm text-orange-900">
              <strong className="font-mono">TCESP:</strong> Tribunal de Contas do Estado de São Paulo.
              Órgão responsável pela fiscalização contábil, financeira, orçamentária, operacional e 
              patrimonial do município.
            </p>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-neutral-600 font-mono">
            {filteredDocuments.length} documento{filteredDocuments.length !== 1 ? 's' : ''} encontrado{filteredDocuments.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Document Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {paginatedDocuments.map((doc) => (
            <DocumentCard
              key={doc.id}
              document={doc}
              onViewDetails={() => handleViewDetails(doc)}
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

        {filteredDocuments.length === 0 && (
          <div className="text-center py-20">
            <Shield className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
            <p className="text-neutral-600 font-mono">
              Nenhum documento encontrado com os filtros selecionados
            </p>
          </div>
        )}
      </div>

      {/* PDF Modal */}
      <PdfModal
        isOpen={pdfModalOpen}
        onClose={() => setPdfModalOpen(false)}
        title={selectedDocument?.title || ''}
        date={selectedDocument?.date}
        source={selectedDocument?.sourceEntity}
        pdfUrl={selectedDocument?.originalUrl}
      />
    </div>
  );
}

