import { useEffect, useMemo, useState } from "react";
import { Building2 } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PaginationControls } from "../components/PaginationControls";
import {
  fetchLicitacoesPedreiraCompleto,
  type LicitacaoCompletaRow,
} from "../services/portalTransparencyService";
import {
  InlineStatus,
  PageContainer,
  PageHero,
  PageState,
  SectionBlock,
  StatKpi,
} from "../components/layout/PagePrimitives";

const PANEL_PAGE_SIZE = 25;
const CHART_COLORS = ["#0f172a", "#1e293b", "#334155", "#475569", "#64748b", "#94a3b8"];

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function parseMoneyValue(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value !== "string") return 0;
  const normalized = value.trim();
  if (!normalized) return 0;

  const cleaned = normalized
    .replace(/^R\$\s*/i, "")
    .replace(/\./g, "")
    .replace(",", ".")
    .replace(/[^\d.-]/g, "");

  if (!cleaned || cleaned === "-" || cleaned === ".") return 0;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toText(value: unknown, fallback = "N/D") {
  if (typeof value === "string") {
    const normalized = value.trim();
    return normalized.length > 0 ? normalized : fallback;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  return fallback;
}

function compactLabel(value: string, max = 30) {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1)}…`;
}

function calcValorPagoRp(row: LicitacaoCompletaRow) {
  return parseMoneyValue(row.vl_pago_rp_proc) + parseMoneyValue(row.vl_pago_rp_nao_proc);
}

export function Licitacoes() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<LicitacaoCompletaRow[]>([]);
  const [selectedYear, setSelectedYear] = useState("todos");
  const [selectedOrgao, setSelectedOrgao] = useState("todos");
  const [selectedModalidade, setSelectedModalidade] = useState("todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    const run = async () => {
      try {
        const dataset = await fetchLicitacoesPedreiraCompleto();
        if (!active) return;
        setRows(dataset.rows);
      } catch (requestError) {
        if (!active) return;
        setError(requestError instanceof Error ? requestError.message : "Falha ao carregar licitações.");
      } finally {
        if (active) setLoading(false);
      }
    };

    void run();

    return () => {
      active = false;
    };
  }, []);

  const yearOptions = useMemo(
    () =>
      Array.from(
        new Set(
          rows
            .map((row) => toText(row.ano_balancete, ""))
            .filter((value) => value.length > 0),
        ),
      ).sort((a, b) => Number(b) - Number(a)),
    [rows],
  );

  const orgaoOptions = useMemo(
    () =>
      Array.from(
        new Set(
          rows
            .map((row) => toText(row.orgao, ""))
            .filter((value) => value.length > 0),
        ),
      ).sort((a, b) => a.localeCompare(b, "pt-BR")),
    [rows],
  );

  const modalidadeOptions = useMemo(
    () =>
      Array.from(
        new Set(
          rows
            .map((row) => toText(row.mod_de_licitacao, ""))
            .filter((value) => value.length > 0),
        ),
      ).sort((a, b) => a.localeCompare(b, "pt-BR")),
    [rows],
  );

  const filteredRows = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return rows.filter((row) => {
      const year = toText(row.ano_balancete, "");
      const orgao = toText(row.orgao, "");
      const modalidade = toText(row.mod_de_licitacao, "");

      const matchesYear = selectedYear === "todos" || year === selectedYear;
      const matchesOrgao = selectedOrgao === "todos" || orgao === selectedOrgao;
      const matchesModalidade = selectedModalidade === "todos" || modalidade === selectedModalidade;
      const matchesSearch =
        normalizedSearch.length === 0 ||
        `${row.nome_do_credor ?? ""} ${row.elemento ?? ""} ${row.nr_empenho ?? ""} ${row.id_credor ?? ""}`
          .toLowerCase()
          .includes(normalizedSearch);

      return matchesYear && matchesOrgao && matchesModalidade && matchesSearch;
    });
  }, [rows, searchTerm, selectedModalidade, selectedOrgao, selectedYear]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedYear, selectedOrgao, selectedModalidade]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PANEL_PAGE_SIZE));
  const paginatedRows = filteredRows.slice((currentPage - 1) * PANEL_PAGE_SIZE, currentPage * PANEL_PAGE_SIZE);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const totalPagoRp = useMemo(
    () => filteredRows.reduce((sum, row) => sum + calcValorPagoRp(row), 0),
    [filteredRows],
  );

  const totalOrgaos = useMemo(
    () =>
      new Set(
        filteredRows
          .map((row) => toText(row.orgao, ""))
          .filter((value) => value.length > 0),
      ).size,
    [filteredRows],
  );

  const totalCredores = useMemo(
    () =>
      new Set(
        filteredRows
          .map((row) => toText(row.nome_do_credor, ""))
          .filter((value) => value.length > 0),
      ).size,
    [filteredRows],
  );

  const chartByModalidade = useMemo(() => {
    const map = new Map<string, number>();
    filteredRows.forEach((row) => {
      const key = toText(row.mod_de_licitacao, "Não informado");
      map.set(key, (map.get(key) ?? 0) + 1);
    });
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [filteredRows]);

  const chartByOrgao = useMemo(() => {
    const map = new Map<string, number>();
    filteredRows.forEach((row) => {
      const key = toText(row.orgao, "Não informado");
      map.set(key, (map.get(key) ?? 0) + calcValorPagoRp(row));
    });
    return Array.from(map.entries())
      .map(([name, value]) => ({ name: compactLabel(name), value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [filteredRows]);

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      <PageHero
        title="Licitações"
        description="Painel analítico com chart e tabela baseado no arquivo completo de licitações de Pedreira."
        eyebrow="Compras Públicas"
        icon={Building2}
      />

      <PageContainer className="pt-8">
        <SectionBlock title="Painel de Licitações" description="Fonte: data/licitacoes completo.csv">
          {error ? <InlineStatus kind="error" className="mb-4">{error}</InlineStatus> : null}

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatKpi label="Registros" value={filteredRows.length} />
            <StatKpi label="Valor pago RP" value={formatCurrency(totalPagoRp)} />
            <StatKpi label="Órgãos" value={totalOrgaos} />
            <StatKpi label="Credores" value={totalCredores} />
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <label className="text-sm">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Ano balancete</span>
              <select
                value={selectedYear}
                onChange={(event) => setSelectedYear(event.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
              >
                <option value="todos">Todos</option>
                {yearOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Órgão</span>
              <select
                value={selectedOrgao}
                onChange={(event) => setSelectedOrgao(event.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
              >
                <option value="todos">Todos</option>
                {orgaoOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Modalidade</span>
              <select
                value={selectedModalidade}
                onChange={(event) => setSelectedModalidade(event.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
              >
                <option value="todos">Todas</option>
                {modalidadeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                Buscar
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Credor, elemento, empenho..."
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
              />
            </label>
          </div>

          {loading ? (
            <PageState
              mode="loading"
              className="mt-5"
              title="Carregando painel de licitações"
              description="Processando dataset completo de licitações."
            />
          ) : (
            <>
              <div className="mt-5 grid gap-4 xl:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Distribuição por modalidade
                  </p>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={chartByModalidade} dataKey="value" nameKey="name" innerRadius={48} outerRadius={84}>
                          {chartByModalidade.map((item, index) => (
                            <Cell key={`${item.name}-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => `${Number(value)} registros`} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Top órgãos por valor pago RP
                  </p>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartByOrgao} layout="vertical" margin={{ left: 12, right: 12 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis type="number" tick={{ fill: "#475569", fontSize: 12 }} />
                        <YAxis type="category" dataKey="name" width={220} tick={{ fill: "#475569", fontSize: 12 }} />
                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                        <Bar dataKey="value" fill="#334155" radius={[0, 6, 6, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="mt-5 overflow-x-auto rounded-xl border border-slate-200 bg-white">
                <table className="w-full text-sm">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Ano</th>
                      <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Mês</th>
                      <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Órgão</th>
                      <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Modalidade</th>
                      <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Credor</th>
                      <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Empenho</th>
                      <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Pago RP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedRows.map((row, index) => (
                      <tr key={`${toText(row.nr_empenho, "emp")}-${index}`} className="hover:bg-slate-50">
                        <td className="px-3 py-2">{toText(row.ano_balancete)}</td>
                        <td className="px-3 py-2">{toText(row.mes_balancete)}</td>
                        <td className="px-3 py-2">{toText(row.orgao)}</td>
                        <td className="px-3 py-2">{toText(row.mod_de_licitacao)}</td>
                        <td className="px-3 py-2">{toText(row.nome_do_credor)}</td>
                        <td className="px-3 py-2">{toText(row.nr_empenho)}</td>
                        <td className="px-3 py-2 text-right font-semibold">{formatCurrency(calcValorPagoRp(row))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <PaginationControls currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
            </>
          )}
        </SectionBlock>
      </PageContainer>
    </div>
  );
}
