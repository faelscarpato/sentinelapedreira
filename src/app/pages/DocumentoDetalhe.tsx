import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import { ArrowLeft, CalendarDays, Download, Globe, ShieldCheck } from "lucide-react";
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
import { InlineStatus, PageContainer, PageHero, PageState, SectionBlock } from "../components/layout/PagePrimitives";

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
      <div className="min-h-screen bg-slate-50 py-12">
        <PageContainer>
          <PageState mode="loading" title="Carregando documento" description="Buscando metadados e conteúdo da fonte oficial." />
        </PageContainer>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="min-h-screen bg-slate-50 py-10">
        <PageContainer>
          <Link to="/" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-slate-950">
            <ArrowLeft className="h-4 w-4" />
            Voltar para início
          </Link>
          <PageState
            mode="empty"
            title="Documento não encontrado"
            description="Não localizamos um item com esse identificador na base pública atual."
          />
        </PageContainer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      <PageHero
        eyebrow="Documento Oficial"
        title={detail.title}
        description={detail.summary ?? "Documento sem resumo disponível."}
        icon={ShieldCheck}
        actions={
          detail.originalUrl ? (
            <button
              type="button"
              onClick={() => openExternalSource(detail.originalUrl ?? undefined)}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              <Download className="h-4 w-4" />
              Fonte original
            </button>
          ) : null
        }
      />

      <PageContainer className="pt-8">
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-slate-950"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>

        {errorMessage ? <InlineStatus kind="warning" className="mb-6">{errorMessage}</InlineStatus> : null}

        <div className="grid gap-6 lg:grid-cols-3">
          <SectionBlock className="lg:col-span-2">
            <div className="mb-4 flex flex-wrap gap-2">
              <span className="rounded-full bg-slate-900 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white">
                {detail.category}
              </span>
              {detail.subtype ? (
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-600">
                  {detail.subtype}
                </span>
              ) : null}
              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-blue-800">
                Origem: {detail.originLabel}
              </span>
              {detail.source === "fallback" ? (
                <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-800">
                  Modo fallback
                </span>
              ) : null}
            </div>

            {detail.bodyMarkdown ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 prose prose-slate max-w-none">
                <SafeMarkdown content={detail.bodyMarkdown} />
              </div>
            ) : (
              <PageState
                mode="empty"
                title="Corpo do documento indisponível"
                description="Apenas metadados e referência de origem foram localizados nesta versão."
              />
            )}
          </SectionBlock>

          <div className="space-y-6">
            <SectionBlock title="Fonte e Integridade">
              <div className="space-y-3 text-sm text-slate-700">
                <p className="font-semibold text-slate-900">{detail.sourceName}</p>
                {detail.sourceDomain ? <p className="text-slate-600">{detail.sourceDomain}</p> : null}
                <p>{detail.sourceIsOfficial ? "Fonte marcada como oficial" : "Fonte sem marcação oficial"}</p>
              </div>
            </SectionBlock>

            <SectionBlock title="Linha do Tempo">
              <div className="space-y-3 text-sm text-slate-700">
                <div className="inline-flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" />
                  Publicação: {formatDate(detail.publicationDate ?? detail.publishedAt)}
                </div>
                <div className="inline-flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Captura: {formatDate(detail.capturedAt)}
                </div>
              </div>
            </SectionBlock>

            {detail.tags.length > 0 ? (
              <SectionBlock title="Tags">
                <div className="flex flex-wrap gap-2">
                  {detail.tags.map((tag) => (
                    <span
                      key={`${tag.type}:${tag.value}`}
                      className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600"
                    >
                      {tag.value}
                    </span>
                  ))}
                </div>
              </SectionBlock>
            ) : null}
          </div>
        </div>
      </PageContainer>
    </div>
  );
}
