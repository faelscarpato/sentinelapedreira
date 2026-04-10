import { useMemo, useState, useEffect } from "react";
import { Landmark } from "lucide-react";
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
import { fetchRepassesPedreiraCompleto } from "../services/portalTransparencyService";
import {
  InlineStatus,
  PageContainer,
  PageHero,
  PageState,
  SectionBlock,
  StatKpi,
} from "../components/layout/PagePrimitives";
import { usePortalDataset, formatBRL } from "../hooks/usePortalDataset";
import { SEO } from "../components/ui/SEO";

const PANEL_PAGE_SIZE = 25;
const CHART_COLORS = ["#0f172a", "#1e293b", "#334155", "#475569", "#64748b", "#94a3b8"];

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

function compactLabel(value: string, max = 28) {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1)}…`;
}

export function Repasses() {
  const { rows, loading, error } = usePortalDataset(fetchRepassesPedreiraCompleto);
  const [selectedYear, setSelectedYear] = useState("todos");
  const [selectedRepasse, setSelectedRepasse] = useState("todos");
  const [selectedFuncao, setSelectedFuncao] = useState("todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const yearOptions = useMemo(
    () =>
      Array.from(
        new Set(rows.map((row) => row.exercicio).filter((value): value is number => typeof value === "number")),
      ).sort((a, b) => b - a),
    [rows],
  );

  const repasseOptions = useMemo(
    () =>
      Array.from(
        new Set(rows.map((row) => row.repasse).filter((value): value is string => Boolean(value && value.trim()))),
      ).sort((a, b) => a.localeCompare(b, "pt-BR")),
    [rows],
  );

  const funcaoOptions = useMemo(
    () =>
      Array.from(
        new Set(
          rows
            .map((row) => row.funcao_de_governo)
            .filter((value): value is string => Boolean(value && value.trim())),
        ),
      ).sort((a, b) => a.localeCompare(b, "pt-BR")),
    [rows],
  );

  const filteredRows = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return rows.filter((row) => {
      const matchesYear = selectedYear === "todos" || String(row.exercicio ?? "") === selectedYear;
      const matchesRepasse = selectedRepasse === "todos" || row.repasse === selectedRepasse;
      const matchesFuncao = selectedFuncao === "todos" || row.funcao_de_governo === selectedFuncao;
      const matchesSearch =
        normalizedSearch.length === 0 ||
        `${row.razao_social ?? ""} ${row.orgao ?? ""} ${row.classificacao ?? ""} ${row.tipo_de_repasse ?? ""}`
          .toLowerCase()
          .includes(normalizedSearch);

      return matchesYear && matchesRepasse && matchesFuncao && matchesSearch;
    });
  }, [rows, searchTerm, selectedFuncao, selectedRepasse, selectedYear]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedYear, selectedRepasse, selectedFuncao]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PANEL_PAGE_SIZE));
  const paginatedRows = filteredRows.slice((currentPage - 1) * PANEL_PAGE_SIZE, currentPage * PANEL_PAGE_SIZE);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const totalValorPago = useMemo(
    () => filteredRows.reduce((sum, row) => sum + (row.vl_pago ?? 0), 0),
    [filteredRows],
  );

  const totalInstituicoes = useMemo(
    () =>
      new Set(
        filteredRows
          .map((row) => row.razao_social)
          .filter((value): value is string => Boolean(value && value.trim())),
      ).size,
    [filteredRows],
  );

  const totalOrgaos = useMemo(
    () =>
      new Set(
        filteredRows
          .map((row) => row.orgao)
          .filter((value): value is string => Boolean(value && value.trim())),
      ).size,
    [filteredRows],
  );

  const chartByRepasse = useMemo(() => {
    const map = new Map<string, number>();
    filteredRows.forEach((row) => {
      const key = row.repasse ?? "Não informado";
      map.set(key, (map.get(key) ?? 0) + (row.vl_pago ?? 0));
    });

    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredRows]);

  const chartByOrgao = useMemo(() => {
    const map = new Map<string, number>();
    filteredRows.forEach((row) => {
      const key = row.orgao ?? "Não informado";
      map.set(key, (map.get(key) ?? 0) + (row.vl_pago ?? 0));
    });

    return Array.from(map.entries())
      .map(([name, value]) => ({ name: compactLabel(name), value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [filteredRows]);

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      <SEO title="Repasses" description="Transferências e repasses públicos da Prefeitura de Pedreira." />
      <PageHero
        title="Repasses"
        description="Painel analítico baseado no dataset completo de repasses de Pedreira."
        eyebrow="Fluxo de Recursos"
        icon={Landmark}
      />

      <PageContainer className="pt-8">
        <SectionBlock
          title="Painel TCE-SP (Repasses Pedreira Completo)"
          description="Fonte: data/repasses pedreira completo.xlsx"
        >
          {error ? <InlineStatus kind="error" className="mb-4">{error}</InlineStatus> : null}

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatKpi label="Registros" value={filteredRows.length} />
            <StatKpi label="Valor pago" value={formatBRL(totalValorPago)} />
            <StatKpi label="Instituições" value={totalInstituicoes} />
            <StatKpi label="Órgãos" value={totalOrgaos} />
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <label className="text-sm">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Exercício</span>
              <select
                value={selectedYear}
                onChange={(event) => setSelectedYear(event.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
              >
                <option value="todos">Todos</option>
                {yearOptions.map((year) => (
                  <option key={year} value={String(year)}>
                    {year}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Repasse</span>
              <select
                value={selectedRepasse}
                onChange={(event) => setSelectedRepasse(event.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
              >
                <option value="todos">Todos</option>
                {repasseOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Função</span>
              <select
                value={selectedFuncao}
                onChange={(event) => setSelectedFuncao(event.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
              >
                <option value="todos">Todas</option>
                {funcaoOptions.map((option) => (
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
                placeholder="Entidade, órgão, classificação..."
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
              />
            </label>
          </div>

          {loading ? (
            <PageState
              mode="loading"
              className="mt-5"
              title="Carregando painel de repasses"
              description="Processando o dataset consolidado de repasses."
            />
          ) : (
            <>
              <div className="mt-5 grid gap-4 xl:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Distribuição por tipo de repasse
                  </p>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={chartByRepasse} dataKey="value" nameKey="name" innerRadius={48} outerRadius={84}>
                          {chartByRepasse.map((item, index) => (
                            <Cell key={`${item.name}-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatBRL(Number(value))} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Top órgãos por valor pago
                  </p>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartByOrgao} layout="vertical" margin={{ left: 12, right: 12 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis type="number" tick={{ fill: "#475569", fontSize: 12 }} />
                        <YAxis type="category" dataKey="name" width={220} tick={{ fill: "#475569", fontSize: 12 }} />
                        <Tooltip formatter={(value) => formatBRL(Number(value))} />
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
                      <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Repasse</th>
                      <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Entidade</th>
                      <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Função</th>
                      <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Órgão</th>
                      <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Valor pago</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedRows.map((row, index) => (
                      <tr key={`${row.cnpj ?? "cnpj"}-${row.exercicio ?? "ano"}-${index}`} className="hover:bg-slate-50">
                        <td className="px-3 py-2">{row.exercicio ?? "N/D"}</td>
                        <td className="px-3 py-2">{row.repasse ?? "N/D"}</td>
                        <td className="px-3 py-2">{row.razao_social ?? "N/D"}</td>
                        <td className="px-3 py-2">{row.funcao_de_governo ?? "N/D"}</td>
                        <td className="px-3 py-2">{row.orgao ?? "N/D"}</td>
                        <td className="px-3 py-2 text-right font-semibold">{formatBRL(row.vl_pago ?? 0)}</td>
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
