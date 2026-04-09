import { useEffect, useMemo, useState } from "react";
import { Banknote } from "lucide-react";
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
  fetchReceitasPedreira2025,
  type ReceitaPedreiraRow,
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
const MONTH_ORDER = new Map(
  [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ].map((month, index) => [month.toLowerCase(), index]),
);

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

function compactLabel(value: string, max = 28) {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1)}…`;
}

export function Receitas() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<ReceitaPedreiraRow[]>([]);
  const [selectedYear, setSelectedYear] = useState("todos");
  const [selectedMonth, setSelectedMonth] = useState("todos");
  const [selectedOrgao, setSelectedOrgao] = useState("todos");
  const [selectedCategoria, setSelectedCategoria] = useState("todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    const run = async () => {
      try {
        const dataset = await fetchReceitasPedreira2025();
        if (!active) return;
        setRows(dataset.rows);
      } catch (requestError) {
        if (!active) return;
        setError(requestError instanceof Error ? requestError.message : "Falha ao carregar receitas.");
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
            .map((row) => toText(row.ano_exercicio, ""))
            .filter((value) => value.length > 0),
        ),
      ).sort((a, b) => Number(b) - Number(a)),
    [rows],
  );

  const monthOptions = useMemo(
    () =>
      Array.from(
        new Set(
          rows
            .map((row) => toText(row.mes_ref_extenso, ""))
            .filter((value) => value.length > 0),
        ),
      ).sort((a, b) => (MONTH_ORDER.get(a.toLowerCase()) ?? 99) - (MONTH_ORDER.get(b.toLowerCase()) ?? 99)),
    [rows],
  );

  const orgaoOptions = useMemo(
    () =>
      Array.from(
        new Set(
          rows
            .map((row) => toText(row.ds_orgao, ""))
            .filter((value) => value.length > 0),
        ),
      ).sort((a, b) => a.localeCompare(b, "pt-BR")),
    [rows],
  );

  const categoriaOptions = useMemo(
    () =>
      Array.from(
        new Set(
          rows
            .map((row) => toText(row.ds_categoria, ""))
            .filter((value) => value.length > 0),
        ),
      ).sort((a, b) => a.localeCompare(b, "pt-BR")),
    [rows],
  );

  const filteredRows = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return rows.filter((row) => {
      const year = toText(row.ano_exercicio, "");
      const month = toText(row.mes_ref_extenso, "");
      const orgao = toText(row.ds_orgao, "");
      const categoria = toText(row.ds_categoria, "");

      const matchesYear = selectedYear === "todos" || year === selectedYear;
      const matchesMonth = selectedMonth === "todos" || month === selectedMonth;
      const matchesOrgao = selectedOrgao === "todos" || orgao === selectedOrgao;
      const matchesCategoria = selectedCategoria === "todos" || categoria === selectedCategoria;
      const matchesSearch =
        normalizedSearch.length === 0 ||
        `${row.ds_tipo ?? ""} ${row.ds_fonte ?? ""} ${row.ds_d1 ?? ""} ${row.ds_d3 ?? ""}`.toLowerCase().includes(normalizedSearch);

      return matchesYear && matchesMonth && matchesOrgao && matchesCategoria && matchesSearch;
    });
  }, [rows, searchTerm, selectedCategoria, selectedMonth, selectedOrgao, selectedYear]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedYear, selectedMonth, selectedOrgao, selectedCategoria]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PANEL_PAGE_SIZE));
  const paginatedRows = filteredRows.slice((currentPage - 1) * PANEL_PAGE_SIZE, currentPage * PANEL_PAGE_SIZE);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const totalArrecadacao = useMemo(
    () => filteredRows.reduce((sum, row) => sum + parseMoneyValue(row.vl_arrecadacao), 0),
    [filteredRows],
  );

  const totalOrgaos = useMemo(
    () =>
      new Set(
        filteredRows
          .map((row) => toText(row.ds_orgao, ""))
          .filter((value) => value.length > 0),
      ).size,
    [filteredRows],
  );

  const totalCategorias = useMemo(
    () =>
      new Set(
        filteredRows
          .map((row) => toText(row.ds_categoria, ""))
          .filter((value) => value.length > 0),
      ).size,
    [filteredRows],
  );

  const chartByMonth = useMemo(() => {
    const map = new Map<string, number>();
    filteredRows.forEach((row) => {
      const key = toText(row.mes_ref_extenso, "Não informado");
      map.set(key, (map.get(key) ?? 0) + parseMoneyValue(row.vl_arrecadacao));
    });
    return Array.from(map.entries())
      .sort((a, b) => (MONTH_ORDER.get(a[0].toLowerCase()) ?? 99) - (MONTH_ORDER.get(b[0].toLowerCase()) ?? 99))
      .map(([name, value]) => ({ name, value }));
  }, [filteredRows]);

  const chartByCategoria = useMemo(() => {
    const map = new Map<string, number>();
    filteredRows.forEach((row) => {
      const key = toText(row.ds_categoria, "Não informado");
      map.set(key, (map.get(key) ?? 0) + parseMoneyValue(row.vl_arrecadacao));
    });
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [filteredRows]);

  const chartByOrgao = useMemo(() => {
    const map = new Map<string, number>();
    filteredRows.forEach((row) => {
      const key = toText(row.ds_orgao, "Não informado");
      map.set(key, (map.get(key) ?? 0) + parseMoneyValue(row.vl_arrecadacao));
    });
    return Array.from(map.entries())
      .map(([name, value]) => ({ name: compactLabel(name), value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [filteredRows]);

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      <PageHero
        title="Receitas"
        description="Painel analítico com chart e tabela baseado no dataset completo de receitas de Pedreira (2025)."
        eyebrow="Arrecadação Pública"
        icon={Banknote}
      />

      <PageContainer className="pt-8">
        <SectionBlock title="Painel de Receitas" description="Fonte: data/receitas-pedreira-2025.csv">
          {error ? <InlineStatus kind="error" className="mb-4">{error}</InlineStatus> : null}

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatKpi label="Registros" value={filteredRows.length} />
            <StatKpi label="Arrecadação total" value={formatCurrency(totalArrecadacao)} />
            <StatKpi label="Órgãos" value={totalOrgaos} />
            <StatKpi label="Categorias" value={totalCategorias} />
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <label className="text-sm">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Ano</span>
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
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Mês</span>
              <select
                value={selectedMonth}
                onChange={(event) => setSelectedMonth(event.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
              >
                <option value="todos">Todos</option>
                {monthOptions.map((option) => (
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
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Categoria</span>
              <select
                value={selectedCategoria}
                onChange={(event) => setSelectedCategoria(event.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
              >
                <option value="todos">Todas</option>
                {categoriaOptions.map((option) => (
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
                placeholder="Tipo, fonte, classificação..."
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
              />
            </label>
          </div>

          {loading ? (
            <PageState
              mode="loading"
              className="mt-5"
              title="Carregando painel de receitas"
              description="Processando dataset completo de receitas."
            />
          ) : (
            <>
              <div className="mt-5 grid gap-4 xl:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Evolução mensal da arrecadação
                  </p>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartByMonth}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="name" tick={{ fill: "#475569", fontSize: 12 }} />
                        <YAxis tick={{ fill: "#475569", fontSize: 12 }} />
                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                        <Bar dataKey="value" fill="#0f172a" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Distribuição por categoria
                  </p>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={chartByCategoria} dataKey="value" nameKey="name" innerRadius={48} outerRadius={84}>
                          {chartByCategoria.map((item, index) => (
                            <Cell key={`${item.name}-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  Top órgãos por arrecadação
                </p>
                <div className="h-80">
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

              <div className="mt-5 overflow-x-auto rounded-xl border border-slate-200 bg-white">
                <table className="w-full text-sm">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Ano</th>
                      <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Mês</th>
                      <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Órgão</th>
                      <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Categoria</th>
                      <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Tipo</th>
                      <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Valor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedRows.map((row, index) => (
                      <tr key={`${toText(row.id_rec_arrec_detalhe, "id")}-${index}`} className="hover:bg-slate-50">
                        <td className="px-3 py-2">{toText(row.ano_exercicio)}</td>
                        <td className="px-3 py-2">{toText(row.mes_ref_extenso)}</td>
                        <td className="px-3 py-2">{toText(row.ds_orgao)}</td>
                        <td className="px-3 py-2">{toText(row.ds_categoria)}</td>
                        <td className="px-3 py-2">{toText(row.ds_tipo)}</td>
                        <td className="px-3 py-2 text-right font-semibold">{formatCurrency(parseMoneyValue(row.vl_arrecadacao))}</td>
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
