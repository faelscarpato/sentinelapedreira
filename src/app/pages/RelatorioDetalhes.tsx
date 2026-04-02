import { useParams, Link } from "react-router";
import { ArrowLeft, Download, Share2, FileText, Calendar, ShieldCheck } from "lucide-react";
import { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { reports } from "../data/mockData";

export function RelatorioDetalhes() {
  const { id } = useParams();
  const report = reports.find(r => r.id === id);

  if (!report) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <FileText className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
          <h2 className="text-2xl font-mono mb-2">Relatório não encontrado</h2>
          <Link to="/relatorios" className="text-sm hover:underline">
            Voltar para relatórios
          </Link>
        </div>
      </div>
    );
  }

  const getConfidenceBadge = (level: string) => {
    switch (level) {
      case 'high':
        return { text: 'ALTA CONFIANÇA', color: 'bg-green-600 text-white' };
      case 'medium':
        return { text: 'CONFIANÇA MÉDIA', color: 'bg-yellow-500 text-black' };
      case 'preliminary':
        return { text: 'PRELIMINAR', color: 'bg-neutral-500 text-white' };
      default:
        return { text: 'EM ANÁLISE', color: 'bg-neutral-300 text-neutral-700' };
    }
  };

  const badge = getConfidenceBadge(report.confidenceLevel);
  const reportMarkdown = useMemo(
    () =>
      `# ${report.title}\n\n**Categoria:** ${report.category}\n\n**Data:** ${new Date(report.date).toLocaleDateString(
        "pt-BR",
      )}\n\n## Resumo\n\n${report.summary}\n\n## Conteudo\n\n${report.content}`,
    [report],
  );

  const handleShare = async () => {
    const shareUrl = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: report.title,
          text: report.summary,
          url: shareUrl,
        });
        return;
      } catch {
        // O usuário pode cancelar o compartilhamento nativo sem erro funcional.
      }
    }

    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(shareUrl);
      return;
    }

    window.prompt("Copie o link do relatório:", shareUrl);
  };

  const handleDownload = () => {
    const blob = new Blob([reportMarkdown], { type: "text/markdown;charset=utf-8" });
    const downloadUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = downloadUrl;
    anchor.download = `${report.id}.md`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(downloadUrl);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-neutral-900 text-white py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            to="/relatorios"
            className="inline-flex items-center space-x-2 text-sm mb-6 hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar para relatórios</span>
          </Link>

          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="px-2 py-1 bg-white text-black text-xs font-mono">
              {report.category.toUpperCase()}
            </span>
            <span className={`px-2 py-1 text-xs font-mono ${badge.color}`}>
              {badge.text}
            </span>
          </div>

          <h1 className="text-3xl md:text-4xl font-mono mb-4">
            {report.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-300">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span>{new Date(report.date).toLocaleDateString('pt-BR', { 
                day: 'numeric',
                month: 'long', 
                year: 'numeric' 
              })}</span>
            </div>
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span>{report.sources.length} fonte{report.sources.length !== 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="border-b border-neutral-200 bg-neutral-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap gap-2">
              {report.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 bg-white border border-neutral-300 text-neutral-700 text-xs font-mono"
                >
                  {tag}
                </span>
              ))}
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleShare}
                className="p-2 hover:bg-neutral-200 transition-colors rounded"
                aria-label="Compartilhar"
              >
                <Share2 className="w-5 h-5" />
              </button>
              <button
                onClick={handleDownload}
                className="p-2 hover:bg-neutral-200 transition-colors rounded"
                aria-label="Download"
              >
                <Download className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Summary */}
        <div className="bg-neutral-50 border-l-4 border-black p-6 mb-8">
          <h2 className="font-mono text-sm mb-2 text-neutral-600">RESUMO EXECUTIVO</h2>
          <p className="text-neutral-800">{report.summary}</p>
        </div>

        {/* Markdown Content */}
        <div className="prose prose-neutral max-w-none
          prose-headings:font-mono
          prose-h1:text-3xl prose-h1:mb-6
          prose-h2:text-2xl prose-h2:mb-4 prose-h2:mt-8
          prose-h3:text-xl prose-h3:mb-3 prose-h3:mt-6
          prose-p:mb-4 prose-p:leading-relaxed
          prose-ul:mb-4 prose-ul:list-disc prose-ul:pl-6
          prose-ol:mb-4 prose-ol:list-decimal prose-ol:pl-6
          prose-li:mb-2
          prose-strong:font-semibold
          prose-code:bg-neutral-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
          prose-pre:bg-neutral-900 prose-pre:text-white prose-pre:p-4 prose-pre:rounded prose-pre:overflow-x-auto
          prose-blockquote:border-l-4 prose-blockquote:border-neutral-300 prose-blockquote:pl-4 prose-blockquote:italic
        ">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {report.content}
          </ReactMarkdown>
        </div>

        {/* Sources */}
        <div className="mt-12 pt-8 border-t border-neutral-200">
          <h3 className="font-mono text-lg mb-4 flex items-center space-x-2">
            <FileText className="w-5 h-5" />
            <span>Fontes e Documentos Consultados</span>
          </h3>
          <ul className="space-y-2">
            {report.sources.map((source, idx) => (
              <li key={idx} className="flex items-center space-x-2 text-sm">
                <div className="w-1.5 h-1.5 bg-black rounded-full"></div>
                <span>{source}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Legal Notice */}
        <div className="mt-8 p-6 bg-blue-50 border border-blue-200">
          <div className="flex items-start space-x-3">
            <ShieldCheck className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-mono mb-2">AVISO LEGAL</p>
              <p className="italic">
                Esta é uma análise técnica automatizada de caráter informativo e fiscalizatório, 
                não constituindo parecer jurídico definitivo. A interpretação final e decisões 
                competem aos órgãos oficiais responsáveis.
              </p>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}
