import { useEffect, useState } from "react";
import { TrendingUp } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router";
import { DocumentCard } from "../components/DocumentCard";
import { PdfModal } from "../components/PdfModal";
import { PaginationControls } from "../components/PaginationControls";
import { contasPublicasDocuments } from "../data/realData";
import type { Document } from "../data/realData";
import { isPdfDocument, openExternalSource } from "../lib/sourceUtils";
import { getDocumentDetailHref } from "../lib/documentDetailRoute";
import {
  PageContainer,
  PageHero,
  PageState,
  SectionBlock,
} from "../components/layout/PagePrimitives";

const PAGE_SIZE = 24;

export function ContasPublicas() {
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

  const filteredDocuments = contasPublicasDocuments.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.summary.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubtype = selectedSubtype === "todos" || doc.subtype === selectedSubtype;
    return matchesSearch && matchesSubtype;
  });

  const totalPages = Math.max(1, Math.ceil(filteredDocuments.length / PAGE_SIZE));
  const paginatedDocuments = filteredDocuments.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedSubtype]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const subtypes = Array.from(new Set(contasPublicasDocuments.map((doc) => doc.subtype).filter(Boolean)));

  useEffect(() => {
    if (subtypeFromUrl === selectedSubtype) return;
    setSelectedSubtype(subtypeFromUrl);
  }, [selectedSubtype, subtypeFromUrl]);

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      <PageHero
        title="Contas Públicas"
        description="Acervo documental de LOA, LDO, PPA, balanços, demonstrativos fiscais e relatórios oficiais."
        eyebrow="Transparência Fiscal"
        icon={TrendingUp}
      />

      <PageContainer className="pt-8">
        <SectionBlock title="Busca no acervo documental" className="mb-8">
          <div className="grid gap-4 md:grid-cols-3">
            <label className="md:col-span-2">
              <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                Buscar
              </span>
              <input
                type="text"
                placeholder="Pesquisar por tipo, período ou conteúdo..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm focus:border-slate-900 focus:outline-none"
              />
            </label>
            <label>
              <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                Tipo de documento
              </span>
              <select
                value={selectedSubtype}
                onChange={(event) => {
                  const nextValue = event.target.value;
                  setSelectedSubtype(nextValue);
                  const nextParams = new URLSearchParams(searchParams);
                  if (nextValue === "todos") {
                    nextParams.delete("subtype");
                  } else {
                    nextParams.set("subtype", nextValue);
                  }
                  setSearchParams(nextParams, { replace: true });
                }}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm focus:border-slate-900 focus:outline-none"
              >
                <option value="todos">Todos os tipos</option>
                {subtypes.map((subtype) => (
                  <option key={subtype} value={subtype}>
                    {subtype}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </SectionBlock>

        <div className="mb-5 text-sm font-semibold text-slate-600">
          {filteredDocuments.length} documento{filteredDocuments.length !== 1 ? "s" : ""} encontrado
          {filteredDocuments.length !== 1 ? "s" : ""}
        </div>

        {filteredDocuments.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2">
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
        ) : (
          <PageState
            mode="empty"
            title="Nenhum documento no acervo local"
            description="Ajuste os filtros ou faça nova busca para localizar documentos de contas públicas."
          />
        )}

        <PaginationControls currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </PageContainer>

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
