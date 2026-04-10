import { useMemo, useState, useEffect } from "react";
import { AlertCircle, Clock } from "lucide-react";
import { fetchLicitacoesPedreiraCompleto } from "../services/portalTransparencyService";
import {
  InlineStatus,
  PageContainer,
  PageHero,
  PageState,
  SectionBlock,
  StatKpi,
} from "../components/layout/PagePrimitives";
import { PaginationControls } from "../components/PaginationControls";
import { exportToCsv, exportToExcel } from "../lib/exportUtils";
import { usePortalDataset, formatBRL, parseFinancialValue } from "../hooks/usePortalDataset";
import { SEO } from "../components/ui/SEO";
import type { LicitacaoCompletaRow } from "../services/portalTransparencyService";

const PAGE_SIZE = 25;

function calculatePending(row: LicitacaoCompletaRow) {
  const inscribed = parseFinancialValue(row.vl_inscrito_rp_proc) + parseFinancialValue(row.vl_inscrito_rp_nao_proc);
  const initial = parseFinancialValue(row.vl_saldo_inicial_rp_proc) + parseFinancialValue(row.vl_saldo_inicial_rp_nao_proc);
  const paid = parseFinancialValue(row.vl_pago_rp_proc) + parseFinancialValue(row.vl_pago_rp_nao_proc);
  const cancelled = parseFinancialValue(row.vl_cancelado_rp_proc) + parseFinancialValue(row.vl_cancelado_rp_nao_proc);
  
  return (inscribed + initial) - (paid + cancelled);
}

export function PagamentosPendentes() {
  const { rows, loading, error } = usePortalDataset(fetchLicitacoesPedreiraCompleto);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const pendingItems = useMemo(() => {
    return rows.filter(row => calculatePending(row) > 0.01);
  }, [rows]);

  const filteredRows = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return pendingItems.filter(row => 
      !term || 
      (row.nome_do_credor?.toLowerCase().includes(term) || 
       row.nr_empenho?.toString().includes(term) ||
       row.orgao?.toLowerCase().includes(term))
    );
  }, [pendingItems, searchTerm]);

  const totalPending = useMemo(() => 
    filteredRows.reduce((acc, row) => acc + calculatePending(row), 0)
  , [filteredRows]);

  const paginatedRows = filteredRows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      <SEO title="Pagamentos Pendentes" description="Monitor de restos a pagar e saldos pendentes da Prefeitura de Pedreira." />
      <PageHero
        title="Pagamentos Pendentes"
        description="Monitoramento de Restos a Pagar (RP) baseados em empenhos de anos anteriores com saldo a quitar."
        eyebrow="Transparência Financeira"
        icon={Clock}
      />

      <PageContainer className="pt-8">
        <SectionBlock title="Monitor de Dívida Flutuante">
          {error && <InlineStatus kind="error" className="mb-4">{error}</InlineStatus>}

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="grid flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <StatKpi label="Empenhos Pendentes" value={filteredRows.length} />
              <StatKpi label="Total pendente" value={formatBRL(totalPending)} color="amber" />
            </div>
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={() => exportToCsv(filteredRows, "pagamentos-pendentes")}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:border-slate-900"
              >
                CSV
              </button>
              <button
                type="button"
                onClick={() => exportToExcel(filteredRows, "pagamentos-pendentes")}
                className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
              >
                Excel
              </button>
            </div>
          </div>

          <div className="mt-5">
            <input
              type="text"
              placeholder="Buscar por credor, empenho ou órgão..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm focus:border-slate-900 focus:outline-none"
            />
          </div>

          {loading ? (
            <PageState mode="loading" className="mt-8" />
          ) : filteredRows.length === 0 ? (
            <PageState mode="empty" title="Nenhum pagamento pendente encontrado" className="mt-8" />
          ) : (
            <>
              <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-slate-900">Credor</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-900">Órgão</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-900">Empenho</th>
                      <th className="px-4 py-3 text-right font-semibold text-slate-900">Inscrito</th>
                      <th className="px-4 py-3 text-right font-semibold text-slate-900">Pago</th>
                      <th className="px-4 py-3 text-right font-semibold text-slate-900 text-amber-600">Pendente</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedRows.map((row, idx) => {
                      const pending = calculatePending(row);
                      const inscribed = parseFinancialValue(row.vl_inscrito_rp_proc) + 
                                       parseFinancialValue(row.vl_inscrito_rp_nao_proc) + 
                                       parseFinancialValue(row.vl_saldo_inicial_rp_proc) + 
                                       parseFinancialValue(row.vl_saldo_inicial_rp_nao_proc);
                      const paid = parseFinancialValue(row.vl_pago_rp_proc) + parseFinancialValue(row.vl_pago_rp_nao_proc);
                      
                      return (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 font-medium text-slate-950">{row.nome_do_credor || "N/A"}</td>
                          <td className="px-4 py-3 text-slate-600">{row.orgao}</td>
                          <td className="px-4 py-3 text-slate-500">{row.nr_empenho} ({row.ano_empenho})</td>
                          <td className="px-4 py-3 text-right text-slate-600">{formatBRL(inscribed)}</td>
                          <td className="px-4 py-3 text-right text-slate-600">{formatBRL(paid)}</td>
                          <td className="px-4 py-3 text-right font-bold text-amber-700">{formatBRL(pending)}</td>
                        </tr>
                      );
                    })}
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
