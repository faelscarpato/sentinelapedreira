import { useEffect, useMemo, useState } from "react";
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
  fetchLatestTceImportJob,
  fetchTceDespesas,
  fetchTceFilterOptions,
  fetchTceReceitas,
  type TceDespesaRow,
  type TceReceitaRow,
} from "../services/tceService";
import { useAuth } from "../../features/auth/useAuth";

const PAGE_SIZE = 24;
const TCE_MUNICIPIO_PEDREIRA = "3537108";
const monthOptions = [
  { value: 1, label: "Janeiro" },
  { value: 2, label: "Fevereiro" },
  { value: 3, label: "Março" },
  { value: 4, label: "Abril" },
  { value: 5, label: "Maio" },
  { value: 6, label: "Junho" },
  { value: 7, label: "Julho" },
  { value: 8, label: "Agosto" },
  { value: 9, label: "Setembro" },
  { value: 10, label: "Outubro" },
  { value: 11, label: "Novembro" },
  { value: 12, label: "Dezembro" },
];

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatDateTime(value: string | null) {
  if (!value) return "N/D";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

export function ContasPublicas() {
  const auth = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  const subtypeFromUrl = searchParams.get("subtype") || "todos";
  const [selectedSubtype, setSelectedSubtype] = useState(subtypeFromUrl);
  const [currentPage, setCurrentPage] = useState(1);
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);

  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedOrgao, setSelectedOrgao] = useState("todos");
  const [selectedFornecedor, setSelectedFornecedor] = useState("todos");
  const [activeTab, setActiveTab] = useState<"receitas" | "despesas">("despesas");
  const [tceReceitas, setTceReceitas] = useState<TceReceitaRow[]>([]);
  const [tceDespesas, setTceDespesas] = useState<TceDespesaRow[]>([]);
  const [tceOrgaos, setTceOrgaos] = useState<string[]>([]);
  const [tceFornecedores, setTceFornecedores] = useState<string[]>([]);
  const [tceLoading, setTceLoading] = useState(false);
  const [tceError, setTceError] = useState<string | null>(null);
  const [latestJob, setLatestJob] = useState<Awaited<ReturnType<typeof fetchLatestTceImportJob>>>(null);
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

  const filteredDocuments = contasPublicasDocuments.filter((doc) => {
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

  const totalReceitas = useMemo(
    () => tceReceitas.reduce((sum, item) => sum + item.valor, 0),
    [tceReceitas],
  );
  const totalDespesas = useMemo(
    () => tceDespesas.reduce((sum, item) => sum + item.valor, 0),
    [tceDespesas],
  );

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
    const normalizedSubtype = subtypeFromUrl;
    if (normalizedSubtype === selectedSubtype) return;
    setSelectedSubtype(normalizedSubtype);
  }, [selectedSubtype, subtypeFromUrl]);

  useEffect(() => {
    if (!shouldUseServer) {
      setTceReceitas([]);
      setTceDespesas([]);
      setTceOrgaos([]);
      setTceFornecedores([]);
      setLatestJob(null);
      setTceLoading(false);
      setTceError(null);
      return;
    }

    let active = true;

    const run = async () => {
      setTceLoading(true);
      setTceError(null);

      try {
        const baseFilter = {
          municipioCodigo: TCE_MUNICIPIO_PEDREIRA,
          exercicio: selectedYear,
          mes: selectedMonth,
        };

        const [options, receitas, despesas, job] = await Promise.all([
          fetchTceFilterOptions(baseFilter),
          fetchTceReceitas({
            ...baseFilter,
            orgao: selectedOrgao === "todos" ? undefined : selectedOrgao,
            limit: 250,
          }),
          fetchTceDespesas({
            ...baseFilter,
            orgao: selectedOrgao === "todos" ? undefined : selectedOrgao,
            fornecedor: selectedFornecedor === "todos" ? undefined : selectedFornecedor,
            limit: 250,
          }),
          fetchLatestTceImportJob(TCE_MUNICIPIO_PEDREIRA),
        ]);

        if (!active) return;
        setTceOrgaos(options.orgaos);
        setTceFornecedores(options.fornecedores);
        setTceReceitas(receitas);
        setTceDespesas(despesas);
        setLatestJob(job);
      } catch (error) {
        if (!active) return;
        setTceError(error instanceof Error ? error.message : "Falha ao carregar dados TCE.");
        setTceReceitas([]);
        setTceDespesas([]);
      } finally {
        if (active) {
          setTceLoading(false);
        }
      }
    };

    void run();

    return () => {
      active = false;
    };
  }, [selectedFornecedor, selectedMonth, selectedOrgao, selectedYear, shouldUseServer]);

  useEffect(() => {
    if (selectedOrgao !== "todos" && tceOrgaos.length > 0 && !tceOrgaos.includes(selectedOrgao)) {
      setSelectedOrgao("todos");
    }
  }, [selectedOrgao, tceOrgaos]);

  useEffect(() => {
    if (
      selectedFornecedor !== "todos" &&
      tceFornecedores.length > 0 &&
      !tceFornecedores.includes(selectedFornecedor)
    ) {
      setSelectedFornecedor("todos");
    }
  }, [selectedFornecedor, tceFornecedores]);

  const yearOptions = Array.from({ length: 8 }, (_, index) => now.getFullYear() - index);

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-neutral-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-4 mb-4">
            <TrendingUp className="w-10 h-10" />
            <div>
              <h1 className="text-3xl font-mono">Contas Públicas</h1>
              <p className="text-neutral-300 mt-2">
                Orçamento, execução fiscal e dados oficiais do TCE-SP
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="border-b border-neutral-200 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-mono text-neutral-600 mb-2">
                BUSCAR NO ACERVO DOCUMENTAL
              </label>
              <input
                type="text"
                placeholder="Pesquisar por tipo, período ou conteúdo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-neutral-300 focus:outline-none focus:border-black font-mono text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-neutral-600 mb-2">
                TIPO DE DOCUMENTO
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

          <div className="mt-6 bg-blue-50 border border-blue-200 p-4">
            <p className="text-sm text-blue-900">
              <strong className="font-mono">Dados TCE-SP:</strong> esta tela prioriza dados oficiais
              da API de transparência do Tribunal de Contas do Estado de São Paulo para receitas e despesas.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <section className="border border-neutral-200 p-5 mb-8">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-lg font-mono">Painel TCE-SP (API oficial)</h2>
              <p className="text-sm text-neutral-600">
                Município IBGE {TCE_MUNICIPIO_PEDREIRA} • filtros server-side por período, órgão e fornecedor
              </p>
            </div>
            <div className="text-xs font-mono text-neutral-500">
              Último job: {latestJob ? `${latestJob.status} • ${formatDateTime(latestJob.finished_at ?? latestJob.updated_at)}` : "N/D"}
            </div>
          </div>

          <div className="grid md:grid-cols-4 gap-3 mb-4">
            <label className="text-xs font-mono text-neutral-700">
              Ano
              <select
                value={selectedYear}
                onChange={(event) => setSelectedYear(Number(event.target.value))}
                className="mt-1 w-full px-3 py-2 border border-neutral-300 bg-white text-sm"
              >
                {yearOptions.map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </label>

            <label className="text-xs font-mono text-neutral-700">
              Mês
              <select
                value={selectedMonth}
                onChange={(event) => setSelectedMonth(Number(event.target.value))}
                className="mt-1 w-full px-3 py-2 border border-neutral-300 bg-white text-sm"
              >
                {monthOptions.map((month) => (
                  <option key={month.value} value={month.value}>{month.label}</option>
                ))}
              </select>
            </label>

            <label className="text-xs font-mono text-neutral-700">
              Órgão
              <select
                value={selectedOrgao}
                onChange={(event) => setSelectedOrgao(event.target.value)}
                className="mt-1 w-full px-3 py-2 border border-neutral-300 bg-white text-sm"
              >
                <option value="todos">Todos</option>
                {tceOrgaos.map((orgao) => (
                  <option key={orgao} value={orgao}>{orgao}</option>
                ))}
              </select>
            </label>

            <label className="text-xs font-mono text-neutral-700">
              Fornecedor (despesas)
              <select
                value={selectedFornecedor}
                onChange={(event) => setSelectedFornecedor(event.target.value)}
                className="mt-1 w-full px-3 py-2 border border-neutral-300 bg-white text-sm"
              >
                <option value="todos">Todos</option>
                {tceFornecedores.map((fornecedor) => (
                  <option key={fornecedor} value={fornecedor}>{fornecedor}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            <button
              type="button"
              onClick={() => setActiveTab("despesas")}
              className={`px-3 py-2 text-xs font-mono border ${
                activeTab === "despesas"
                  ? "bg-black text-white border-black"
                  : "bg-white text-neutral-700 border-neutral-300"
              }`}
            >
              Despesas ({tceDespesas.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("receitas")}
              className={`px-3 py-2 text-xs font-mono border ${
                activeTab === "receitas"
                  ? "bg-black text-white border-black"
                  : "bg-white text-neutral-700 border-neutral-300"
              }`}
            >
              Receitas ({tceReceitas.length})
            </button>
          </div>

          {!shouldUseServer && (
            <div className="border border-yellow-300 bg-yellow-50 p-4 text-sm text-yellow-900">
              Supabase não configurado neste ambiente. Exibindo apenas acervo local.
            </div>
          )}

          {shouldUseServer && tceError && (
            <div className="border border-red-300 bg-red-50 p-4 text-sm text-red-900">
              {tceError}
            </div>
          )}

          {shouldUseServer && tceLoading && (
            <div className="border border-neutral-200 p-4 text-sm text-neutral-700">
              Carregando dados oficiais do TCE-SP...
            </div>
          )}

          {shouldUseServer && !tceLoading && activeTab === "despesas" && (
            <div className="overflow-x-auto border border-neutral-200">
              <div className="px-3 py-2 text-xs font-mono bg-neutral-50 border-b border-neutral-200">
                Total filtrado (despesas): <strong>{formatCurrency(totalDespesas)}</strong>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-neutral-100">
                  <tr>
                    <th className="text-left p-2 font-mono text-xs">Órgão</th>
                    <th className="text-left p-2 font-mono text-xs">Fornecedor</th>
                    <th className="text-left p-2 font-mono text-xs">Descrição</th>
                    <th className="text-right p-2 font-mono text-xs">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {tceDespesas.slice(0, 60).map((item) => (
                    <tr key={item.id} className="border-t border-neutral-200">
                      <td className="p-2">{item.orgao ?? "N/D"}</td>
                      <td className="p-2">{item.fornecedor ?? "N/D"}</td>
                      <td className="p-2">{item.descricao ?? item.categoria ?? "N/D"}</td>
                      <td className="p-2 text-right font-mono">{formatCurrency(item.valor)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {shouldUseServer && !tceLoading && activeTab === "receitas" && (
            <div className="overflow-x-auto border border-neutral-200">
              <div className="px-3 py-2 text-xs font-mono bg-neutral-50 border-b border-neutral-200">
                Total filtrado (receitas): <strong>{formatCurrency(totalReceitas)}</strong>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-neutral-100">
                  <tr>
                    <th className="text-left p-2 font-mono text-xs">Órgão</th>
                    <th className="text-left p-2 font-mono text-xs">Categoria</th>
                    <th className="text-left p-2 font-mono text-xs">Descrição</th>
                    <th className="text-right p-2 font-mono text-xs">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {tceReceitas.slice(0, 60).map((item) => (
                    <tr key={item.id} className="border-t border-neutral-200">
                      <td className="p-2">{item.orgao ?? "N/D"}</td>
                      <td className="p-2">{item.categoria ?? "N/D"}</td>
                      <td className="p-2">{item.descricao ?? item.conta ?? "N/D"}</td>
                      <td className="p-2 text-right font-mono">{formatCurrency(item.valor)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section>
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-neutral-600 font-mono">
              {filteredDocuments.length} documento{filteredDocuments.length !== 1 ? "s" : ""} encontrado{filteredDocuments.length !== 1 ? "s" : ""}
            </p>
          </div>

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
              <TrendingUp className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
              <p className="text-neutral-600 font-mono">
                Nenhum documento encontrado com os filtros selecionados
              </p>
            </div>
          )}
        </section>
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
