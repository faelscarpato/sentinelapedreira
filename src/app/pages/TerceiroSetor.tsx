import { useEffect, useState } from "react";
import { Handshake } from "lucide-react";
import { useNavigate } from "react-router";
import { DocumentCard } from "../components/DocumentCard";
import { PdfModal } from "../components/PdfModal";
import { PaginationControls } from "../components/PaginationControls";
import { terceiroSetorDocuments } from "../data/realData";
import type { Document } from "../data/realData";
import { isPdfDocument, openExternalSource } from "../lib/sourceUtils";
import { getDocumentDetailHref } from "../lib/documentDetailRoute";
import {
  fetchConveniosGerais,
  fetchConveniosTerceiroSetor,
  type ConvenioRow,
} from "../services/portalTransparencyService";
import { InlineStatus, PageContainer, PageHero, PageState, SectionBlock, StatKpi } from "../components/layout/PagePrimitives";
import { SEO } from "../components/ui/SEO";
import { formatBRL } from "../hooks/usePortalDataset";

const PAGE_SIZE = 24;

export function TerceiroSetor() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubtype, setSelectedSubtype] = useState("todos");
  const [currentPage, setCurrentPage] = useState(1);
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [conveniosLoading, setConveniosLoading] = useState(true);
  const [conveniosError, setConveniosError] = useState<string | null>(null);
  const [conveniosTerceiroSetor, setConveniosTerceiroSetor] = useState<Awaited<ReturnType<typeof fetchConveniosTerceiroSetor>> | null>(null);
  const [conveniosGerais, setConveniosGerais] = useState<Awaited<ReturnType<typeof fetchConveniosGerais>> | null>(null);
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

  const handleViewDetails = (doc: Document) => {
    navigate(getDocumentDetailHref(doc));
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
  const paginatedDocuments = filteredDocuments.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedSubtype]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const subtypes = Array.from(new Set(terceiroSetorDocuments.map((doc) => doc.subtype).filter(Boolean)));
  const totalConvenios = (conveniosTerceiroSetor?.rowCount ?? 0) + (conveniosGerais?.rowCount ?? 0);
  const totalValorConvenios =
    (conveniosTerceiroSetor?.summary.numericTotals.valor ?? 0)
    + (conveniosGerais?.summary.numericTotals.valor ?? 0);
  const totalPagoConvenios = conveniosTerceiroSetor?.summary.numericTotals.valor_pago ?? 0;

  useEffect(() => {
    let active = true;
    setConveniosLoading(true);
    setConveniosError(null);

    const run = async () => {
      try {
        const [terceiroSetor, gerais] = await Promise.all([
          fetchConveniosTerceiroSetor(),
          fetchConveniosGerais(),
        ]);

        if (!active) return;
        setConveniosTerceiroSetor(terceiroSetor);
        setConveniosGerais(gerais);
      } catch (error) {
        if (!active) return;
        setConveniosError(error instanceof Error ? error.message : "Falha ao carregar convênios.");
      } finally {
        if (active) {
          setConveniosLoading(false);
        }
      }
    };

    void run();

    return () => {
      active = false;
    };
  }, []);

  const topConvenios: ConvenioRow[] = [
    ...(conveniosTerceiroSetor?.rows ?? []),
    ...(conveniosGerais?.rows ?? []),
  ]
    .filter((row) => (row.valor ?? 0) > 0)
    .sort((left, right) => (right.valor ?? 0) - (left.valor ?? 0))
    .slice(0, 20);

  const relatedSourceLinks = Array.from(
    new Map(
      terceiroSetorDocuments
        .filter((doc) => doc.originalUrl)
        .map((doc) => [doc.originalUrl as string, { title: doc.title, url: doc.originalUrl as string }]),
    ).values(),
  ).slice(0, 10);

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      <SEO title="Terceiro Setor" description="Convênios e parcerias com o Terceiro Setor em Pedreira." />
      <PageHero
        title="Terceiro Setor"
        description="Convênios e parcerias com organizações da sociedade civil monitoradas em base pública."
        eyebrow="Parcerias Públicas"
        icon={Handshake}
      />

      <PageContainer className="pt-8">
        <SectionBlock title="Filtros" className="mb-8">
          <div className="grid gap-4 md:grid-cols-3">
            <label className="md:col-span-2">
              <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Buscar</span>
              <input
                type="text"
                placeholder="Pesquisar por convênios, OSCs ou objeto..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm focus:border-slate-900 focus:outline-none"
              />
            </label>

            <label>
              <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Tipo</span>
              <select
                value={selectedSubtype}
                onChange={(event) => setSelectedSubtype(event.target.value)}
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

          <InlineStatus kind="info" className="mt-4">
            Fontes oficiais relacionadas ao tema para consulta rápida sem uso de iframe.
          </InlineStatus>

          <div className="mt-3 flex flex-wrap gap-2">
            {relatedSourceLinks.map((link) => (
              <button
                key={link.url}
                type="button"
                onClick={() => openExternalSource(link.url)}
                className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-800 hover:bg-blue-100"
              >
                {link.title}
              </button>
            ))}
          </div>
        </SectionBlock>

        <SectionBlock
          title="Convênios e Termos de Repasse"
          description="Dados adicionais integrados de convênios e termos vinculados ao terceiro setor."
          className="mb-8"
        >
          {conveniosError ? <InlineStatus kind="error" className="mb-4">{conveniosError}</InlineStatus> : null}

          <div className="grid gap-3 sm:grid-cols-3">
            <StatKpi label="Registros" value={totalConvenios} />
            <StatKpi label="Valor pactuado" value={formatBRL(totalValorConvenios)} />
            <StatKpi label="Valor pago (TS)" value={formatBRL(totalPagoConvenios)} />
          </div>

          {conveniosLoading ? (
            <PageState
              mode="loading"
              className="mt-4"
              title="Carregando convênios"
              description="Lendo datasets complementares do Portal da Transparência."
            />
          ) : (
            <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-white">
              <table className="w-full text-sm">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Tipo</th>
                    <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Convênio</th>
                    <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Favorecido</th>
                    <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {topConvenios.map((row, index) => (
                    <tr key={`${row.numero ?? "conv"}-${index}`} className="hover:bg-slate-50">
                      <td className="px-3 py-2">{row.tipo ?? "N/D"}</td>
                      <td className="px-3 py-2">{row.convenio ?? "N/D"}</td>
                      <td className="px-3 py-2">{row.favorecido ?? "N/D"}</td>
                      <td className="px-3 py-2 text-right font-semibold">{formatBRL(row.valor ?? 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionBlock>

        <p className="mb-5 text-sm font-semibold text-slate-600">
          {filteredDocuments.length} documento{filteredDocuments.length !== 1 ? "s" : ""} encontrado
          {filteredDocuments.length !== 1 ? "s" : ""}
        </p>

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
          <PageState mode="empty" title="Nenhum documento encontrado" />
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
