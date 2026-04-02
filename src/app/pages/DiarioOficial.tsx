import { useEffect, useState } from "react";
import { FileText, Calendar } from "lucide-react";
import { useNavigate } from "react-router";
import { DocumentCard } from "../components/DocumentCard";
import { PdfModal } from "../components/PdfModal";
import { PaginationControls } from "../components/PaginationControls";
import { diarioOficialDocuments } from "../data/realData";
import type { Document } from "../data/realData";
import { isPdfDocument, openExternalSource } from "../lib/sourceUtils";

const PAGE_SIZE = 24;

export function DiarioOficial() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedYear, setSelectedYear] = useState("todos");
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

  const filteredDocuments = diarioOficialDocuments.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.summary.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesYear = selectedYear === "todos" || doc.year.toString() === selectedYear;
    return matchesSearch && matchesYear;
  });

  const totalPages = Math.max(1, Math.ceil(filteredDocuments.length / PAGE_SIZE));
  const paginatedDocuments = filteredDocuments.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedYear]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const years = Array.from(new Set(diarioOficialDocuments.map(d => d.year))).sort((a, b) => b - a);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-neutral-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-4 mb-4">
            <FileText className="w-10 h-10" />
            <div>
              <h1 className="text-3xl font-mono">Diário Oficial</h1>
              <p className="text-neutral-300 mt-2">
                Publicações municipais oficiais organizadas por data
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
                placeholder="Pesquisar por edição, data ou conteúdo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-neutral-300 focus:outline-none focus:border-black font-mono text-sm"
              />
            </div>

            {/* Year Filter */}
            <div>
              <label className="block text-xs font-mono text-neutral-600 mb-2">
                ANO
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full px-4 py-2 border border-neutral-300 focus:outline-none focus:border-black font-mono text-sm bg-white"
              >
                <option value="todos">Todos os anos</option>
                {years.map(year => (
                  <option key={year} value={year.toString()}>{year}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-neutral-600 font-mono">
            {filteredDocuments.length} documento{filteredDocuments.length !== 1 ? 's' : ''} encontrado{filteredDocuments.length !== 1 ? 's' : ''}
          </p>
          <div className="flex items-center space-x-2 text-sm">
            <Calendar className="w-4 h-4 text-neutral-500" />
            <span className="text-neutral-600">Ordenado por: Mais recente</span>
          </div>
        </div>

        {/* Today's Highlight */}
        {filteredDocuments.length > 0 && filteredDocuments[0].date === diarioOficialDocuments[0]?.date && (
          <div className="mb-8">
            <div className="bg-blue-50 border-l-4 border-blue-600 p-4 mb-4">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                <span className="text-sm font-mono text-blue-900">EDIÇÃO DE HOJE</span>
              </div>
              <p className="text-sm text-blue-800">
                O Diário Oficial de hoje já está disponível para consulta
              </p>
            </div>
          </div>
        )}

        {/* Document Grid */}
        <div className="grid md:grid-cols-2 gap-6">
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

        {filteredDocuments.length === 0 && (
          <div className="text-center py-20">
            <FileText className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
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

