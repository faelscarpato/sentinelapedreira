import { useEffect, useState } from "react";
import { Handshake } from "lucide-react";
import { useNavigate } from "react-router";
import { DocumentCard } from "../components/DocumentCard";
import { PdfModal } from "../components/PdfModal";
import { PaginationControls } from "../components/PaginationControls";
import { terceiroSetorDocuments } from "../data/realData";
import type { Document } from "../data/realData";
import { isPdfDocument, openExternalSource } from "../lib/sourceUtils";

const PAGE_SIZE = 24;

export function TerceiroSetor() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubtype, setSelectedSubtype] = useState("todos");
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
    if (!doc.analysisUrl) return;
    navigate(doc.analysisUrl);
  };

  const filteredDocuments = terceiroSetorDocuments.filter((doc) => {
    const normalizedSearch = searchTerm.toLowerCase();
    const matchesSearch =
      doc.title.toLowerCase().includes(normalizedSearch) ||
      doc.summary.toLowerCase().includes(normalizedSearch) ||
      doc.tags.join(" ").toLowerCase().includes(normalizedSearch);
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

  const subtypes = Array.from(
    new Set(terceiroSetorDocuments.map((doc) => doc.subtype).filter(Boolean)),
  );

  const relatedSourceLinks = Array.from(
    new Map(
      terceiroSetorDocuments
        .filter((doc) => doc.originalUrl)
        .map((doc) => [doc.originalUrl as string, { title: doc.title, url: doc.originalUrl as string }]),
    ).values(),
  ).slice(0, 10);

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-neutral-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-4 mb-4">
            <Handshake className="w-10 h-10" />
            <div>
              <h1 className="text-3xl font-mono">Terceiro Setor</h1>
              <p className="text-neutral-300 mt-2">
                Convênios e parcerias com organizações da sociedade civil
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="border-b border-neutral-200 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-mono text-neutral-600 mb-2">BUSCAR</label>
              <input
                type="text"
                placeholder="Pesquisar por convênios, OSCs ou objeto..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="w-full px-4 py-2 border border-neutral-300 focus:outline-none focus:border-black font-mono text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-neutral-600 mb-2">TIPO</label>
              <select
                value={selectedSubtype}
                onChange={(event) => setSelectedSubtype(event.target.value)}
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

          <div className="mt-6 bg-blue-50 border border-blue-200 p-4">
            <p className="text-sm text-blue-900 mb-3">
              <strong className="font-mono">Fontes relacionadas ao tema:</strong> links oficiais
              monitorados para consulta rápida sem uso de iframe.
            </p>
            <div className="flex flex-wrap gap-2">
              {relatedSourceLinks.map((link) => (
                <button
                  key={link.url}
                  type="button"
                  onClick={() => openExternalSource(link.url)}
                  className="px-3 py-2 border border-blue-300 bg-white text-blue-900 text-xs font-mono hover:bg-blue-100 transition-colors"
                >
                  {link.title}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-neutral-600 font-mono">
            {filteredDocuments.length} documento{filteredDocuments.length !== 1 ? "s" : ""} encontrado
            {filteredDocuments.length !== 1 ? "s" : ""}
          </p>
        </div>

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
            <Handshake className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
            <p className="text-neutral-600 font-mono">
              Nenhum documento encontrado com os filtros selecionados
            </p>
          </div>
        )}
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

