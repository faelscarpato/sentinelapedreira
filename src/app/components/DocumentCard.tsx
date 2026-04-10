import { FileText, AlertTriangle, Clock, ExternalLink, ArrowRight, Star } from "lucide-react";
import type { Document } from "../data/realData";
import { resolveDocumentOriginLabel } from "../lib/documentOrigin";
import { useFavorites } from "../hooks/useFavorites";

interface DocumentCardProps {
  document: Document;
  onViewOriginal?: () => void;
  onViewAnalysis?: () => void;
  onViewDetails?: () => void;
}

function getRiskStyle(risk?: string) {
  switch (risk) {
    case "critical":
      return "bg-red-100 text-red-800";
    case "high":
      return "bg-orange-100 text-orange-800";
    case "medium":
      return "bg-amber-100 text-amber-800";
    case "low":
      return "bg-emerald-100 text-emerald-800";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

function getRiskLabel(risk?: string) {
  switch (risk) {
    case "critical":
      return "Crítico";
    case "high":
      return "Alto";
    case "medium":
      return "Médio";
    case "low":
      return "Baixo";
    default:
      return "";
  }
}

export function DocumentCard({
  document,
  onViewOriginal,
  onViewAnalysis,
  onViewDetails,
}: DocumentCardProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const favorite = isFavorite(document.id);

  const canViewOriginal = typeof onViewOriginal === "function";
  const canViewAnalysis = document.hasAnalysis && typeof onViewAnalysis === "function";
  const canViewDetails = typeof onViewDetails === "function";
  const originLabel = resolveDocumentOriginLabel({
    source: document.source,
    sourceEntity: document.sourceEntity,
    domain: document.domain,
  });

  return (
    <article className="group relative rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-slate-900 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white">
            {document.category}
          </span>
          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-blue-800">
            {originLabel}
          </span>
          {document.subtype ? (
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-600">
              {document.subtype}
            </span>
          ) : null}
          {document.riskLevel ? (
            <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${getRiskStyle(document.riskLevel)}`}>
              {getRiskLabel(document.riskLevel)}
            </span>
          ) : null}
          {document.status === "missing" ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-red-800">
              <AlertTriangle className="h-3 w-3" />
              Faltante
            </span>
          ) : null}
        </div>

        <button
          type="button"
          onClick={() => toggleFavorite(document.id)}
          className={`flex h-8 w-8 items-center justify-center rounded-full border transition-all ${
            favorite
              ? "border-amber-200 bg-amber-50 text-amber-500 shadow-sm"
              : "border-slate-200 bg-white text-slate-400 hover:border-amber-300 hover:text-amber-500"
          }`}
          aria-label={favorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
          title={favorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
        >
          <Star className={`h-4 w-4 ${favorite ? "fill-amber-500" : ""}`} />
        </button>
      </div>

      {canViewDetails ? (
        <button
          type="button"
          onClick={onViewDetails}
          className="font-headline text-left text-xl font-bold tracking-tight text-slate-950 hover:text-slate-700"
          aria-label={`Ver detalhes do documento ${document.title}`}
        >
          {document.title}
        </button>
      ) : (
        <h3 className="font-headline text-xl font-bold tracking-tight text-slate-950">{document.title}</h3>
      )}

      <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-slate-600">{document.summary}</p>

      <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" />
          {new Date(document.date).toLocaleDateString("pt-BR")}
        </span>
        <span className="inline-flex items-center gap-1">
          <FileText className="h-3.5 w-3.5" />
          {document.sourceEntity}
        </span>
      </div>

      {document.tags.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {document.tags.slice(0, 3).map((tag, idx) => (
            <span
              key={idx}
              className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600"
            >
              {tag}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <button
          type="button"
          onClick={onViewDetails}
          disabled={!canViewDetails}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:border-slate-900 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-45"
        >
          Detalhes
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={onViewOriginal}
          disabled={!canViewOriginal}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-900 px-3 py-2 text-xs font-semibold text-slate-900 transition-colors hover:bg-slate-900 hover:text-white disabled:cursor-not-allowed disabled:border-slate-300 disabled:text-slate-400"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Fonte / PDF
        </button>
        {document.hasAnalysis ? (
          <button
            type="button"
            onClick={onViewAnalysis}
            disabled={!canViewAnalysis}
            className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
          >
            Ver análise
          </button>
        ) : (
          <span className="hidden sm:block" />
        )}
      </div>
    </article>
  );
}
