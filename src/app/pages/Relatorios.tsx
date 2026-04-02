import { useMemo, useState } from "react";
import { Link } from "react-router";
import { FileText, TrendingUp, AlertCircle, Clock } from "lucide-react";
import { reports } from "../data/mockData";

export function Relatorios() {
  const [searchTerm, setSearchTerm] = useState("");

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

  const filteredReports = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const orderedReports = [...reports].sort((a, b) => b.date.localeCompare(a.date));

    if (!normalizedSearch) return orderedReports;

    return orderedReports.filter((report) => {
      const indexedFields = [report.title, report.summary, report.category, ...report.tags]
        .join(" ")
        .toLowerCase();
      return indexedFields.includes(normalizedSearch);
    });
  }, [searchTerm]);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-neutral-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-4 mb-4">
            <FileText className="w-10 h-10" />
            <div>
              <h1 className="text-3xl font-mono">Relatórios de Análise</h1>
              <p className="text-neutral-300 mt-2">
                Análises técnicas e relatórios públicos sobre documentos municipais
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-blue-50 border border-blue-200 p-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-mono text-sm mb-2 text-blue-900">Sobre os Relatórios</h3>
              <p className="text-sm text-blue-800">
                Os relatórios são análises técnicas baseadas em documentos públicos oficiais e legislação vigente.
                Não constituem pareceres jurídicos definitivos, mas ferramentas de apoio ao controle social.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Reports List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <label className="block text-xs font-mono text-neutral-600 mb-2">BUSCAR</label>
          <input
            type="text"
            placeholder="Pesquisar por título, tema ou palavra-chave..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="w-full md:w-[460px] px-4 py-2 border border-neutral-300 focus:outline-none focus:border-black font-mono text-sm"
          />
        </div>

        <div className="mb-6">
          <p className="text-sm text-neutral-600 font-mono">
            {filteredReports.length} relatório{filteredReports.length !== 1 ? 's' : ''} publicado{filteredReports.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="space-y-6">
          {filteredReports.map((report) => {
            const badge = getConfidenceBadge(report.confidenceLevel);
            return (
              <article
                key={report.id}
                className="bg-white border border-neutral-200 hover:border-black transition-all group"
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex flex-wrap items-start gap-2 mb-3">
                    <span className="px-2 py-1 bg-black text-white text-xs font-mono">
                      {report.category.toUpperCase()}
                    </span>
                    <span className={`px-2 py-1 text-xs font-mono ${badge.color}`}>
                      {badge.text}
                    </span>
                  </div>

                  <Link to={`/relatorios/${report.id}`}>
                    <h2 className="text-xl font-mono mb-3 group-hover:underline">
                      {report.title}
                    </h2>
                  </Link>

                  <p className="text-sm text-neutral-600 mb-4">
                    {report.summary}
                  </p>

                  {/* Meta */}
                  <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-500 mb-4">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(report.date).toLocaleDateString('pt-BR')}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <FileText className="w-3 h-3" />
                      <span>{report.sources.length} fonte{report.sources.length !== 1 ? 's' : ''}</span>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {report.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-neutral-100 text-neutral-700 text-xs font-mono"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Action */}
                  <Link
                    to={`/relatorios/${report.id}`}
                    className="inline-block px-4 py-2 bg-black text-white text-sm font-mono hover:bg-neutral-800 transition-colors"
                  >
                    LER RELATÓRIO COMPLETO
                  </Link>
                </div>
              </article>
            );
          })}
        </div>

        {filteredReports.length === 0 && (
          <div className="text-center py-20">
            <TrendingUp className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
            <p className="text-neutral-600 font-mono">Nenhum relatório encontrado</p>
          </div>
        )}
      </div>
    </div>
  );
}
