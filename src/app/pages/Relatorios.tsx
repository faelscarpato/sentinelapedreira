import { useMemo, useState } from "react";
import { Link } from "react-router";
import { Clock, FileText, Scale } from "lucide-react";
import { camaraPublishedMarkdownAnalyses } from "../data/camaraPublicData";

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
    <div className="min-h-screen bg-white">
      <div className="bg-neutral-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-4 mb-4">
            <Scale className="w-10 h-10" />
            <div>
              <h1 className="text-3xl font-mono">Relatórios de Análise</h1>
              <p className="text-neutral-300 mt-2">
                Análises disponíveis em Markdown da pasta Documentos da Câmara Municipal 2026
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <label className="block text-xs font-mono text-neutral-600 mb-2">BUSCAR</label>
          <input
            type="text"
            placeholder="Pesquisar por tipo, número ou conteúdo..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="w-full md:w-[520px] px-4 py-2 border border-neutral-300 focus:outline-none focus:border-black font-mono text-sm"
          />
        </div>

        <div className="mb-6">
          <p className="text-sm text-neutral-600 font-mono">
            {filteredReports.length} análise{filteredReports.length !== 1 ? "s" : ""} publicada{filteredReports.length !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="space-y-5">
          {filteredReports.map((report) => (
            <article
              key={report.id}
              className="bg-white border border-neutral-200 hover:border-black transition-colors"
            >
              <div className="p-6">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="px-2 py-1 bg-black text-white text-xs font-mono">
                    CÂMARA LEGISLATIVA
                  </span>
                  <span className="px-2 py-1 border border-neutral-300 text-xs font-mono">
                    {report.camaraType}
                  </span>
                  <span className="px-2 py-1 border border-neutral-300 text-xs font-mono">
                    {report.tipoNome}
                  </span>
                </div>

                <h2 className="text-xl font-mono mb-3">{report.title}</h2>

                <p className="text-sm text-neutral-700 mb-5 line-clamp-3">{report.summary}</p>

                <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-600 mb-5">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(report.date).toLocaleDateString("pt-BR")}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <FileText className="w-3 h-3" />
                    <span>{report.sourceEntity}</span>
                  </div>
                </div>

                {report.analysisUrl && (
                  <Link
                    to={report.analysisUrl}
                    className="inline-block px-4 py-2 bg-black text-white text-sm font-mono hover:bg-neutral-800 transition-colors"
                  >
                    VER ANÁLISE
                  </Link>
                )}
              </div>
            </article>
          ))}
        </div>

        {filteredReports.length === 0 && (
          <div className="text-center py-16">
            <FileText className="w-14 h-14 text-neutral-300 mx-auto mb-3" />
            <p className="text-neutral-600 font-mono">Nenhuma análise encontrada</p>
          </div>
        )}
      </div>
    </div>
  );
}
