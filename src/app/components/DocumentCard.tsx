import { FileText, AlertTriangle, Clock, ExternalLink } from "lucide-react";
import type { Document } from "../data/mockData";

interface DocumentCardProps {
  document: Document;
  onViewOriginal?: () => void;
  onViewAnalysis?: () => void;
}

export function DocumentCard({ document, onViewOriginal, onViewAnalysis }: DocumentCardProps) {
  const canViewOriginal = typeof onViewOriginal === "function";
  const canViewAnalysis = document.hasAnalysis && typeof onViewAnalysis === "function";
  const originalActionLabel = document.previewMode === "pdf" ? "VER PDF" : "ABRIR FONTE";

  const getRiskColor = (risk?: string) => {
    switch (risk) {
      case 'critical': return 'bg-red-600 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-black';
      case 'low': return 'bg-green-600 text-white';
      default: return 'bg-neutral-200 text-neutral-700';
    }
  };

  const getRiskLabel = (risk?: string) => {
    switch (risk) {
      case 'critical': return 'CRÍTICO';
      case 'high': return 'ALTO';
      case 'medium': return 'MÉDIO';
      case 'low': return 'BAIXO';
      default: return '';
    }
  };

  return (
    <div className="bg-white border border-neutral-200 hover:border-black transition-all group">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <span className="px-2 py-1 bg-black text-white text-xs font-mono">
                {document.category}
              </span>
              {document.subtype && (
                <span className="px-2 py-1 border border-neutral-300 text-xs font-mono">
                  {document.subtype}
                </span>
              )}
              {document.riskLevel && (
                <span className={`px-2 py-1 text-xs font-mono ${getRiskColor(document.riskLevel)}`}>
                  {getRiskLabel(document.riskLevel)}
                </span>
              )}
              {document.status === 'missing' && (
                <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-mono flex items-center space-x-1">
                  <AlertTriangle className="w-3 h-3" />
                  <span>FALTANTE</span>
                </span>
              )}
            </div>
            <h3 className="font-mono text-base group-hover:underline">
              {document.title}
            </h3>
          </div>
        </div>

        {/* Summary */}
        <p className="text-sm text-neutral-600 mb-4 line-clamp-2">
          {document.summary}
        </p>

        {/* Meta */}
        <div className="flex items-center space-x-4 text-xs text-neutral-500 mb-4">
          <div className="flex items-center space-x-1">
            <Clock className="w-3 h-3" />
            <span>{new Date(document.date).toLocaleDateString('pt-BR')}</span>
          </div>
          <div className="flex items-center space-x-1">
            <FileText className="w-3 h-3" />
            <span>{document.sourceEntity}</span>
          </div>
        </div>

        {/* Tags */}
        {document.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {document.tags.slice(0, 3).map((tag, idx) => (
              <span
                key={idx}
                className="px-2 py-1 bg-neutral-100 text-neutral-700 text-xs font-mono"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={onViewOriginal}
            disabled={!canViewOriginal}
            className="flex-1 min-w-[120px] px-4 py-2 border border-black text-black text-xs font-mono hover:bg-black hover:text-white disabled:border-neutral-300 disabled:text-neutral-400 disabled:hover:bg-transparent disabled:hover:text-neutral-400 transition-colors flex items-center justify-center space-x-2"
          >
            <ExternalLink className="w-3 h-3" />
            <span>{originalActionLabel}</span>
          </button>
          {document.hasAnalysis && (
            <button
              onClick={onViewAnalysis}
              disabled={!canViewAnalysis}
              className="flex-1 min-w-[120px] px-4 py-2 bg-black text-white text-xs font-mono hover:bg-neutral-800 disabled:bg-neutral-300 disabled:text-neutral-600 transition-colors"
            >
              VER ANÁLISE
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
