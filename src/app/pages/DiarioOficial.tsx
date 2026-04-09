import { useEffect, useState } from "react";
import { FileText, Calendar } from "lucide-react";
import { useNavigate } from "react-router";
import { DocumentCard } from "../components/DocumentCard";
import { PdfModal } from "../components/PdfModal";
import { PaginationControls } from "../components/PaginationControls";
import { diarioOficialDocuments } from "../data/realData";
import type { Document } from "../data/realData";
import { isPdfDocument, openExternalSource } from "../lib/sourceUtils";
import { useAuth } from "../../features/auth/useAuth";
import { listDiarioOficialDocuments } from "../services/diarioOficialService";
import { getDocumentDetailHref } from "../lib/documentDetailRoute";
import {
  InlineStatus,
  PageContainer,
  PageHero,
  PageState,
  SectionBlock,
} from "../components/layout/PagePrimitives";

const PAGE_SIZE = 24;

export function DiarioOficial() {
  const auth = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedYear, setSelectedYear] = useState("todos");
  const [currentPage, setCurrentPage] = useState(1);
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [remoteDocuments, setRemoteDocuments] = useState<Document[]>([]);
  const [remoteTotalCount, setRemoteTotalCount] = useState(0);
  const [remoteLoading, setRemoteLoading] = useState(false);
  const [remoteError, setRemoteError] = useState<string | null>(null);
  const navigate = useNavigate();
  const shouldUseServer = auth.isSupabaseEnabled;

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

  const filteredDocuments = diarioOficialDocuments.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.summary.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesYear = selectedYear === "todos" || doc.year.toString() === selectedYear;
    return matchesSearch && matchesYear;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedYear]);

  useEffect(() => {
    if (!shouldUseServer) {
      setRemoteDocuments([]);
      setRemoteTotalCount(0);
      setRemoteLoading(false);
      setRemoteError(null);
      return;
    }

    let cancelled = false;
    const run = async () => {
      setRemoteLoading(true);
      setRemoteError(null);

      try {
        const response = await listDiarioOficialDocuments({
          page: currentPage,
          pageSize: PAGE_SIZE,
          searchTerm,
          year: selectedYear,
        });

        if (cancelled) return;
        setRemoteDocuments(response.items);
        setRemoteTotalCount(response.totalCount);
      } catch (error) {
        if (cancelled) return;
        setRemoteError(error instanceof Error ? error.message : "Falha ao carregar Diário Oficial do servidor.");
        setRemoteDocuments([]);
        setRemoteTotalCount(0);
      } finally {
        if (!cancelled) {
          setRemoteLoading(false);
        }
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [shouldUseServer, currentPage, searchTerm, selectedYear]);

  const totalItems = shouldUseServer ? remoteTotalCount : filteredDocuments.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const paginatedDocuments = shouldUseServer
    ? remoteDocuments
    : filteredDocuments.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const years = shouldUseServer
    ? Array.from(
        { length: Math.max(new Date().getFullYear() - 1999, 1) },
        (_, index) => new Date().getFullYear() - index,
      )
    : Array.from(new Set(diarioOficialDocuments.map((d) => d.year))).sort((a, b) => b - a);

  const todayIso = new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
  const isTodayHighlighted =
    currentPage === 1 && paginatedDocuments.length > 0 && paginatedDocuments[0].date === todayIso;

  return (
    <div className="min-h-screen bg-slate-50 pb-14">
      <PageHero
        title="Diário Oficial"
        description="Publicações oficiais organizadas por data, com busca, filtros e acesso a PDF/análises."
        eyebrow="Explorador Oficial"
        icon={FileText}
      />

      <PageContainer className="pt-8">
        <SectionBlock title="Filtros" className="mb-8">
          <div className="grid gap-4 md:grid-cols-3">
            <label className="md:col-span-2">
              <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                Buscar
              </span>
              <input
                type="text"
                placeholder="Pesquisar por edição, data ou conteúdo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm focus:border-slate-900 focus:outline-none"
              />
            </label>

            <label>
              <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                Ano
              </span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm focus:border-slate-900 focus:outline-none"
              >
                <option value="todos">Todos os anos</option>
                {years.map((year) => (
                  <option key={year} value={year.toString()}>
                    {year}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </SectionBlock>

        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold text-slate-600">
            {totalItems} documento{totalItems !== 1 ? "s" : ""} encontrado{totalItems !== 1 ? "s" : ""}
          </p>
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            <Calendar className="h-4 w-4" />
            Mais recente primeiro
          </span>
        </div>

        {isTodayHighlighted ? (
          <InlineStatus kind="info" className="mb-6">
            Edição de hoje detectada na primeira posição dos resultados.
          </InlineStatus>
        ) : null}

        {remoteError ? <InlineStatus kind="error" className="mb-6">{remoteError}</InlineStatus> : null}

        {remoteLoading ? (
          <PageState
            mode="loading"
            title="Sincronizando Diário Oficial"
            description="Consultando publicações no Supabase para esta página de resultados."
          />
        ) : paginatedDocuments.length > 0 ? (
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
            title="Nenhum documento encontrado"
            description="Ajuste os filtros ou amplie o período para localizar novas publicações."
          />
        )}

        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
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
