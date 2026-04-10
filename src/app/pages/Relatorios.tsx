import { useMemo, useState } from "react";
import { Link } from "react-router";
import { Clock, FileText, Scale } from "lucide-react";
import { camaraPublishedMarkdownAnalyses } from "../data/camaraPublicData";
import { PageContainer, PageHero, PageState, SectionBlock } from "../components/layout/PagePrimitives";
import { SEO } from "../components/ui/SEO";


export function Relatorios() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredReports = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const ordered = [...camaraPublishedMarkdownAnalyses].sort((a, b) => b.date.localeCompare(a.date));

    if (!normalizedSearch) return ordered;

    return ordered.filter((report) => {
      const indexedFields = [report.title, report.summary, report.camaraType, report.tipoNome, ...report.tags]
        .join(" ")
        .toLowerCase();
      return indexedFields.includes(normalizedSearch);
    });
  }, [searchTerm]);

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      <SEO title="Relatórios" description="Relatórios de análise e fiscalização cívica gerados pelo Sentinela." />
      <PageHero
        title="Relatórios de Análise"
        description="Acervo de análises em Markdown derivadas da trilha documental da Câmara Municipal."
        eyebrow="Inteligência Editorial"
        icon={Scale}
      />

      <PageContainer className="pt-8">
        <SectionBlock title="Busca" className="mb-8">
          <input
            type="text"
            placeholder="Pesquisar por tipo, número ou conteúdo..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm focus:border-slate-900 focus:outline-none md:w-[520px]"
          />
        </SectionBlock>

        <p className="mb-5 text-sm font-semibold text-slate-600">
          {filteredReports.length} análise{filteredReports.length !== 1 ? "s" : ""} publicada
          {filteredReports.length !== 1 ? "s" : ""}
        </p>

        {filteredReports.length > 0 ? (
          <div className="space-y-5">
            {filteredReports.map((report) => (
              <article
                key={report.id}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md"
              >
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-slate-900 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white">
                    Câmara Legislativa
                  </span>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-600">
                    {report.camaraType}
                  </span>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-600">
                    {report.tipoNome}
                  </span>
                </div>

                <h2 className="font-headline text-2xl font-bold tracking-tight text-slate-900">{report.title}</h2>
                <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-slate-600">{report.summary}</p>

                <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(report.date).toLocaleDateString("pt-BR")}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    {report.sourceEntity}
                  </span>
                </div>

                {report.analysisUrl ? (
                  <Link
                    to={report.analysisUrl}
                    className="mt-5 inline-block rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                  >
                    Ver análise
                  </Link>
                ) : null}
              </article>
            ))}
          </div>
        ) : (
          <PageState mode="empty" title="Nenhuma análise encontrada" />
        )}
      </PageContainer>
    </div>
  );
}
