import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import { ArrowLeft, CalendarDays, Download, FileText, Globe } from "lucide-react";
import { allDocuments, type Document } from "../data/realData";
import { deriveDocumentSlug } from "../lib/documentDetailRoute";
import { resolveDocumentOriginLabel } from "../lib/documentOrigin";
import { openExternalSource } from "../lib/sourceUtils";
import { useAuth } from "../../features/auth/useAuth";
import { SafeMarkdown } from "../components/SafeMarkdown";
import {
  fetchPublicDocumentBySlug,
  type PublicDocumentDetail,
} from "../services/documentDetailsService";

interface DocumentDetailView {
  source: "server" | "fallback";
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  bodyMarkdown: string | null;
  category: string;
  subtype: string | null;
  publicationDate: string | null;
  publishedAt: string | null;
  capturedAt: string | null;
  originalUrl: string | null;
  sourceName: string;
  sourceDomain: string | null;
  sourceIsOfficial: boolean;
  tags: Array<{ value: string; type: string }>;
  originLabel: string;
}

function formatDate(dateValue: string | null) {
  if (!dateValue) return "N/D";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return dateValue;
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(date);
}

function toFallbackDetail(document: Document): DocumentDetailView {
  const slug = deriveDocumentSlug(document);

  return {
    source: "fallback",
    id: document.id,
    slug,
    title: document.title,
    summary: document.summary,
    bodyMarkdown: null,
    category: document.category,
    subtype: document.subtype ?? null,
    publicationDate: document.date,
    publishedAt: document.date,
    capturedAt: null,
    originalUrl: document.originalUrl ?? null,
    sourceName: document.sourceEntity,
    sourceDomain: document.domain ?? null,
    sourceIsOfficial: true,
    tags: document.tags.map((tag) => ({ value: tag, type: "topic" })),
    originLabel: resolveDocumentOriginLabel({
      source: document.source,
      sourceEntity: document.sourceEntity,
      domain: document.domain,
    }),
  };
}

function toServerDetail(detail: PublicDocumentDetail): DocumentDetailView {
  return {
    source: "server",
    id: detail.id,
    slug: detail.slug,
    title: detail.title,
    summary: detail.summary,
    bodyMarkdown: detail.bodyMarkdown,
    category: detail.category,
    subtype: detail.subtype,
    publicationDate: detail.publicationDate,
    publishedAt: detail.publishedAt,
    capturedAt: detail.capturedAt,
    originalUrl: detail.originalUrl,
    sourceName: detail.sourceName,
    sourceDomain: detail.sourceDomain,
    sourceIsOfficial: detail.sourceIsOfficial,
    tags: detail.tags,
    originLabel: detail.originLabel,
  };
}

export function DocumentoDetalhe() {
  const { slug = "" } = useParams();
  const auth = useAuth();
  const [detail, setDetail] = useState<DocumentDetailView | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fallbackDetail = useMemo(() => {
    const local = allDocuments.find((item) => deriveDocumentSlug(item) === slug);
    return local ? toFallbackDetail(local) : null;
  }, [slug]);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setErrorMessage(null);

    const run = async () => {
      if (!auth.isSupabaseEnabled) {
        if (active) {
          setDetail(fallbackDetail);
          setIsLoading(false);
        }
        return;
      }

      try {
        const remote = await fetchPublicDocumentBySlug(slug);
        if (!active) return;
        if (remote) {
          setDetail(toServerDetail(remote));
        } else {
          setDetail(fallbackDetail);
        }
      } catch (error) {
        if (!active) return;
        setErrorMessage(error instanceof Error ? error.message : "Falha ao carregar documento.");
        setDetail(fallbackDetail);
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    void run();

    return () => {
      active = false;
    };
  }, [auth.isSupabaseEnabled, fallbackDetail, slug]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="border border-neutral-200 p-6 text-sm text-neutral-600">
            Carregando documento...
          </div>
        </div>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <Link to="/" className="inline-flex items-center space-x-2 text-sm font-mono hover:underline mb-6">
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar</span>
          </Link>
          <div className="border border-neutral-200 p-8 text-center">
            <FileText className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
            <p className="font-mono text-neutral-700">Documento não encontrado.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link to="/" className="inline-flex items-center space-x-2 text-sm font-mono hover:underline mb-6">
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar</span>
        </Link>

        {errorMessage && (
          <div className="mb-6 border border-orange-300 bg-orange-50 p-4 text-sm text-orange-900">
            {errorMessage}
          </div>
        )}

        <article className="border border-neutral-200 bg-white p-6 md:p-8">
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="px-2 py-1 text-xs font-mono bg-black text-white">{detail.category}</span>
            {detail.subtype && (
              <span className="px-2 py-1 text-xs font-mono border border-neutral-300">
                {detail.subtype}
              </span>
            )}
            <span className="px-2 py-1 text-xs font-mono border border-blue-300 bg-blue-50 text-blue-900">
              Origem: {detail.originLabel}
            </span>
            {detail.source === "fallback" && (
              <span className="px-2 py-1 text-xs font-mono border border-yellow-300 bg-yellow-50 text-yellow-900">
                Modo fallback
              </span>
            )}
          </div>

          <h1 className="text-2xl md:text-3xl font-mono mb-4">{detail.title}</h1>

          {detail.summary && (
            <p className="text-neutral-700 mb-6 leading-7">{detail.summary}</p>
          )}

          <div className="grid md:grid-cols-2 gap-4 mb-6 text-sm">
            <div className="border border-neutral-200 p-4">
              <p className="text-xs font-mono text-neutral-500 mb-1">Fonte Oficial</p>
              <p className="font-medium">{detail.sourceName}</p>
              {detail.sourceDomain && (
                <p className="text-neutral-600">{detail.sourceDomain}</p>
              )}
              <p className="text-neutral-600 mt-1">
                {detail.sourceIsOfficial ? "Marcada como oficial" : "Fonte sem marcação oficial"}
              </p>
            </div>

            <div className="border border-neutral-200 p-4 space-y-2">
              <div className="flex items-center gap-2 text-neutral-700">
                <CalendarDays className="w-4 h-4" />
                <span>Publicação: {formatDate(detail.publicationDate ?? detail.publishedAt)}</span>
              </div>
              <div className="flex items-center gap-2 text-neutral-700">
                <Globe className="w-4 h-4" />
                <span>Captura/Sincronização: {formatDate(detail.capturedAt)}</span>
              </div>
            </div>
          </div>

          {detail.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {detail.tags.map((tag) => (
                <span key={`${tag.type}:${tag.value}`} className="px-2 py-1 bg-neutral-100 text-neutral-700 text-xs font-mono">
                  {tag.value}
                </span>
              ))}
            </div>
          )}

          {detail.bodyMarkdown && (
            <div className="border border-neutral-200 bg-neutral-50 p-4 mb-6 prose prose-neutral max-w-none">
              <SafeMarkdown content={detail.bodyMarkdown} />
            </div>
          )}

          {detail.originalUrl && (
            <button
              type="button"
              onClick={() => openExternalSource(detail.originalUrl ?? undefined)}
              className="inline-flex items-center gap-2 px-4 py-2 border border-black text-black text-sm font-mono hover:bg-black hover:text-white transition-colors"
            >
              <Download className="w-4 h-4" />
              Download / Fonte original
            </button>
          )}
        </article>
      </div>
    </div>
  );
}
