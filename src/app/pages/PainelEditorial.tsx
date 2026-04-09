import { useEffect, useState } from "react";
import { useAuth } from "../../features/auth/useAuth";
import {
  fetchEditorialAnalysisQueue,
  fetchEditorialDocumentQueue,
  publishAnalysis,
  publishDocument,
  submitAnalysisReview,
} from "../services/documentsService";
import { InlineStatus, PageContainer, PageHero, PageState, SectionBlock } from "../components/layout/PagePrimitives";

export function PainelEditorial() {
  const auth = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [documents, setDocuments] = useState<Array<Record<string, unknown>>>([]);
  const [analyses, setAnalyses] = useState<Array<Record<string, unknown>>>([]);

  const canPublish = auth.hasAnyRole(["editor", "admin"]);
  const canReview = auth.hasAnyRole(["reviewer", "admin"]);

  const reload = async () => {
    setLoading(true);
    setError(null);
    try {
      const [documentsResult, analysesResult] = await Promise.all([
        fetchEditorialDocumentQueue(),
        fetchEditorialAnalysisQueue(),
      ]);
      setDocuments(documentsResult as Array<Record<string, unknown>>);
      setAnalyses(analysesResult as Array<Record<string, unknown>>);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao carregar fila editorial.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
  }, []);

  const handlePublishDocument = async (documentId: string) => {
    if (!auth.user) return;
    try {
      await publishDocument(documentId, auth.user.id);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao publicar documento.");
    }
  };

  const handlePublishAnalysis = async (analysisId: string) => {
    if (!auth.user) return;
    try {
      await publishAnalysis(analysisId, auth.user.id);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao publicar análise.");
    }
  };

  const handleReview = async (
    analysisId: string,
    decision: "approved" | "rejected" | "changes_requested",
  ) => {
    if (!auth.user) return;
    try {
      await submitAnalysisReview(
        analysisId,
        auth.user.id,
        decision,
        "Avaliação registrada pelo painel editorial.",
      );
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao registrar revisão.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      <PageHero
        title="Painel Editorial"
        description="Gestão de fila de documentos e análises com workflow de revisão e publicação."
        eyebrow="Uso interno"
      />

      <PageContainer className="pt-8">
        {error ? <InlineStatus kind="error" className="mb-6">{error}</InlineStatus> : null}

        {loading ? (
          <PageState mode="loading" title="Carregando fila editorial" />
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            <SectionBlock
              title="Documentos em fila"
              description={`${documents.length} pendência(s) aguardando avaliação`}
            >
              <div className="space-y-3">
                {documents.length === 0 ? (
                  <PageState mode="empty" title="Nenhum documento pendente" />
                ) : (
                  documents.map((doc) => (
                    <article key={String(doc.id)} className="rounded-xl border border-slate-200 bg-white p-4">
                      <p className="font-headline text-lg font-bold tracking-tight text-slate-900">
                        {String(doc.title ?? "Sem título")}
                      </p>
                      <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                        Categoria: {String(doc.category ?? "-")} · Status: {String(doc.status ?? "-")}
                      </p>
                      {canPublish ? (
                        <button
                          type="button"
                          onClick={() => void handlePublishDocument(String(doc.id))}
                          className="mt-3 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-white hover:bg-slate-800"
                        >
                          Publicar documento
                        </button>
                      ) : null}
                    </article>
                  ))
                )}
              </div>
            </SectionBlock>

            <SectionBlock
              title="Análises em fila"
              description={`${analyses.length} item(ns) com revisão/publish pendente`}
            >
              <div className="space-y-3">
                {analyses.length === 0 ? (
                  <PageState mode="empty" title="Nenhuma análise pendente" />
                ) : (
                  analyses.map((item) => (
                    <article key={String(item.id)} className="rounded-xl border border-slate-200 bg-white p-4">
                      <p className="font-headline text-lg font-bold tracking-tight text-slate-900">
                        {String(item.title ?? "Sem título")}
                      </p>
                      <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                        Tipo: {String(item.analysis_type ?? "-")} · Status: {String(item.status ?? "-")}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {canReview ? (
                          <>
                            <button
                              type="button"
                              onClick={() => void handleReview(String(item.id), "approved")}
                              className="rounded-lg border border-emerald-300 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700 hover:bg-emerald-50"
                            >
                              Aprovar
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleReview(String(item.id), "changes_requested")}
                              className="rounded-lg border border-amber-300 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-amber-700 hover:bg-amber-50"
                            >
                              Pedir ajustes
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleReview(String(item.id), "rejected")}
                              className="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-red-700 hover:bg-red-50"
                            >
                              Rejeitar
                            </button>
                          </>
                        ) : null}

                        {canPublish ? (
                          <button
                            type="button"
                            onClick={() => void handlePublishAnalysis(String(item.id))}
                            className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-white hover:bg-slate-800"
                          >
                            Publicar análise
                          </button>
                        ) : null}
                      </div>
                    </article>
                  ))
                )}
              </div>
            </SectionBlock>
          </div>
        )}
      </PageContainer>
    </div>
  );
}
