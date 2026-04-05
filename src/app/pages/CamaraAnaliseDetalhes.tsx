import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import { ArrowLeft, LoaderCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getCamaraPublicFileBySlug, parseCamaraAnalysisSlug } from "../lib/camaraAnalysis";

export function CamaraAnaliseDetalhes() {
  const { slug } = useParams();
  const analysisRef = useMemo(() => parseCamaraAnalysisSlug(slug), [slug]);
  const publicFile = useMemo(() => getCamaraPublicFileBySlug(slug), [slug]);

  const [isLoading, setIsLoading] = useState(true);
  const [markdownContent, setMarkdownContent] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    if (!analysisRef || !publicFile) {
      setIsLoading(false);
      setMarkdownContent("");
      setErrorMessage("Analise em andamento");
      return () => {
        active = false;
      };
    }

    if (!publicFile.reportPath) {
      setIsLoading(false);
      setMarkdownContent("");
      setErrorMessage("Analise em andamento");
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
          throw new Error("Analise em andamento");
        }
        return response.text();
      })
      .then((content) => {
        if (!active) return;
        setMarkdownContent(content);
      })
      .catch(() => {
        if (!active) return;
        setErrorMessage("Analise em andamento");
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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <LoaderCircle className="w-10 h-10 animate-spin text-neutral-600 mx-auto mb-3" />
          <p className="text-sm font-mono text-neutral-600">Carregando analise...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          to="/camara"
          className="inline-flex items-center space-x-2 text-sm mb-8 font-mono hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para Câmara Legislativa</span>
        </Link>

        {errorMessage ? (
          <article className="border border-neutral-300 bg-neutral-50 p-6">
            <p className="font-mono text-base">{errorMessage}</p>
          </article>
        ) : (
          <article className="border border-neutral-200 bg-white p-6 md:p-10 shadow-sm">
            <div
              className="prose prose-neutral max-w-none
              prose-headings:font-mono prose-headings:tracking-tight
              prose-h1:text-3xl prose-h1:mb-8 prose-h1:mt-0
              prose-h2:text-2xl prose-h2:mb-5 prose-h2:mt-10 prose-h2:pb-2 prose-h2:border-b prose-h2:border-neutral-200
              prose-h3:text-xl prose-h3:mb-3 prose-h3:mt-8
              prose-p:text-[15px] prose-p:leading-8 prose-p:mb-5
              prose-ul:my-5 prose-ul:pl-6
              prose-ol:my-5 prose-ol:pl-6
              prose-li:my-2 prose-li:leading-7
              prose-table:my-8 prose-table:w-full prose-table:border-collapse prose-table:text-sm
              prose-th:border prose-th:border-neutral-300 prose-th:bg-neutral-100 prose-th:px-3 prose-th:py-2 prose-th:text-left
              prose-td:border prose-td:border-neutral-300 prose-td:px-3 prose-td:py-2
              prose-strong:font-semibold
              prose-code:bg-neutral-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-[13px]
              prose-pre:bg-neutral-900 prose-pre:text-white prose-pre:px-4 prose-pre:py-3 prose-pre:rounded-md prose-pre:overflow-x-auto
              prose-blockquote:border-l-4 prose-blockquote:border-neutral-400 prose-blockquote:pl-4 prose-blockquote:italic"
            >
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdownContent}</ReactMarkdown>
            </div>
          </article>
        )}
      </div>
    </div>
  );
}
