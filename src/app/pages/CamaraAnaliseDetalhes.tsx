import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import { ArrowLeft, FileText } from "lucide-react";
import { getCamaraPublicFileBySlug, parseCamaraAnalysisSlug } from "../lib/camaraAnalysis";
import { SafeMarkdown } from "../components/SafeMarkdown";
import { PageContainer, PageHero, PageState, SectionBlock } from "../components/layout/PagePrimitives";

function hasTechnicalMetadataBlock(markdown: string) {
  const normalized = markdown.toLowerCase();
  return (
    /(^|\n)\s*##\s*metadados\b/i.test(markdown) ||
    /(^|\n)\s*-?\s*source_id\s*:/i.test(markdown) ||
    /(^|\n)\s*-?\s*extraction_file\s*:/i.test(markdown) ||
    /(^|\n)\s*-?\s*report_file\s*:/i.test(markdown) ||
    /(^|\n)\s*-?\s*url_origem\s*:/i.test(markdown) ||
    normalized.includes("modo_extracao:") ||
    normalized.includes("tamanho_chars:")
  );
}

export function CamaraAnaliseDetalhes() {
  const { slug } = useParams();
  const analysisRef = useMemo(() => parseCamaraAnalysisSlug(slug), [slug]);
  const publicFile = useMemo(() => getCamaraPublicFileBySlug(slug), [slug]);

  const [isLoading, setIsLoading] = useState(true);
  const [markdownContent, setMarkdownContent] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    if (!analysisRef || !publicFile || !publicFile.reportPath) {
      setIsLoading(false);
      setMarkdownContent("");
      setErrorMessage("Análise em andamento");
      return () => {
        active = false;
      };
    }

    setIsLoading(true);
    setErrorMessage(null);
    setMarkdownContent("");

    fetch(publicFile.reportPath, { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Análise em andamento");
        }
        return response.text();
      })
      .then((content) => {
        if (!active) return;
        if (hasTechnicalMetadataBlock(content)) {
          setMarkdownContent("");
          setErrorMessage("Análise em andamento");
          return;
        }
        setMarkdownContent(content);
      })
      .catch(() => {
        if (!active) return;
        setErrorMessage("Análise em andamento");
      })
      .finally(() => {
        if (!active) return;
        setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [analysisRef, publicFile]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 py-12">
        <PageContainer>
          <PageState mode="loading" title="Carregando análise" description="Buscando o relatório editorial público." />
        </PageContainer>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="min-h-screen bg-slate-50 pb-16">
        <PageHero
          title="Câmara Legislativa"
          description="A análise ainda não foi disponibilizada para esta matéria."
          eyebrow="Análises"
          icon={FileText}
          actions={
            <Link
              to="/camara"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-900 hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar para Câmara
            </Link>
          }
        />
        <PageContainer className="pt-8">
          <PageState mode="empty" title={errorMessage} description="Retorne mais tarde para verificar a publicação." />
        </PageContainer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      <PageHero
        title="Análise da Câmara Legislativa"
        description="Leitura consolidada da tramitação, riscos e pontos críticos identificados."
        eyebrow="Análises"
        icon={FileText}
        actions={
          <Link
            to="/camara"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-900 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para Câmara
          </Link>
        }
      />

      <PageContainer className="pt-8">
        <SectionBlock>
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
            <SafeMarkdown content={markdownContent} />
          </div>
        </SectionBlock>
      </PageContainer>
    </div>
  );
}
