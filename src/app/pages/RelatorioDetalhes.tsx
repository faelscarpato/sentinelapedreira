import { Link, useParams } from "react-router";
import { ArrowLeft, FileText } from "lucide-react";
import { reports } from "../data/realData";
import { SafeMarkdown } from "../components/SafeMarkdown";
import { PageContainer, PageHero, PageState, SectionBlock } from "../components/layout/PagePrimitives";

export function RelatorioDetalhes() {
  const { id } = useParams();
  const report = reports.find((item) => item.id === id);

  if (!report) {
    return (
      <div className="min-h-screen bg-slate-50 py-12">
        <PageContainer>
          <PageState
            mode="empty"
            title="Análise em andamento"
            description="O relatório ainda não está publicado na trilha editorial."
          />
          <div className="mt-6 text-center">
            <Link
              to="/relatorios"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-900 hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar para relatórios
            </Link>
          </div>
        </PageContainer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      <PageHero
        title={report.title}
        description={report.summary}
        eyebrow="Relatórios"
        icon={FileText}
        actions={
          <Link
            to="/relatorios"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-900 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>
        }
      />

      <PageContainer className="pt-8">
        <SectionBlock>
          <header className="mb-6 grid gap-3 border-b border-slate-200 pb-4 sm:grid-cols-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Categoria</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{report.category}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Data</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{report.date}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Confiança</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{report.confidenceLevel}</p>
            </div>
          </header>

          <div
            className="prose prose-slate max-w-none
            prose-headings:font-headline prose-headings:tracking-tight
            prose-h1:text-3xl prose-h1:mt-0 prose-h1:mb-8
            prose-h2:text-2xl prose-h2:mb-5 prose-h2:mt-10 prose-h2:border-b prose-h2:border-slate-200 prose-h2:pb-2
            prose-h3:text-xl prose-h3:mb-3 prose-h3:mt-8
            prose-p:text-[15px] prose-p:leading-8 prose-p:text-slate-700
            prose-li:text-slate-700 prose-li:leading-7
            prose-table:my-8 prose-table:w-full prose-table:border-collapse prose-table:text-sm
            prose-th:border prose-th:border-slate-300 prose-th:bg-slate-100 prose-th:px-3 prose-th:py-2 prose-th:text-left
            prose-td:border prose-td:border-slate-300 prose-td:px-3 prose-td:py-2
            prose-code:rounded prose-code:bg-slate-100 prose-code:px-1 prose-code:py-0.5 prose-code:text-[13px]
            prose-pre:rounded-xl prose-pre:bg-slate-900 prose-pre:px-4 prose-pre:py-3 prose-pre:text-white prose-pre:overflow-x-auto
            prose-blockquote:border-l-4 prose-blockquote:border-slate-400 prose-blockquote:pl-4 prose-blockquote:italic"
          >
            <SafeMarkdown content={report.content} />
          </div>
        </SectionBlock>
      </PageContainer>
    </div>
  );
}
