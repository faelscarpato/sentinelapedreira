import { useEffect, useState } from "react";
import { useAuth } from "../../features/auth/useAuth";
import {
  fetchEditorialAnalysisQueue,
  fetchEditorialDocumentQueue,
  publishAnalysis,
  publishDocument,
  submitAnalysisReview,
} from "../services/documentsService";

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
      await submitAnalysisReview(analysisId, auth.user.id, decision, "Avaliação registrada pelo painel editorial.");
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao registrar revisão.");
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-neutral-900 text-white py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-mono">Painel Editorial</h1>
          <p className="text-sm text-neutral-300 mt-2">
            Workflow de publicação, revisão e governança de conteúdo.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && <div className="mb-4 border border-red-300 bg-red-50 p-3 text-sm text-red-900">{error}</div>}

        {loading ? (
          <div className="border border-neutral-200 p-4 text-sm text-neutral-600">Carregando fila editorial...</div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-6">
            <section>
              <h2 className="text-xl font-mono mb-3">Documentos em Fila</h2>
              <div className="space-y-3">
                {documents.length === 0 && <div className="border border-neutral-200 p-4 text-sm">Nenhum documento pendente.</div>}
                {documents.map((doc) => (
                  <article key={String(doc.id)} className="border border-neutral-200 p-4">
                    <p className="font-mono text-sm">{String(doc.title ?? "Sem título")}</p>
                    <p className="text-xs text-neutral-500 mt-1">Categoria: {String(doc.category ?? "-")} · Status: {String(doc.status ?? "-")}</p>
                    {canPublish && (
                      <button
                        type="button"
                        onClick={() => void handlePublishDocument(String(doc.id))}
                        className="mt-3 px-3 py-1.5 bg-black text-white font-mono text-xs"
                      >
                        PUBLICAR DOCUMENTO
                      </button>
                    )}
                  </article>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-xl font-mono mb-3">Análises em Fila</h2>
              <div className="space-y-3">
                {analyses.length === 0 && <div className="border border-neutral-200 p-4 text-sm">Nenhuma análise pendente.</div>}
                {analyses.map((item) => (
                  <article key={String(item.id)} className="border border-neutral-200 p-4">
                    <p className="font-mono text-sm">{String(item.title ?? "Sem título")}</p>
                    <p className="text-xs text-neutral-500 mt-1">
                      Tipo: {String(item.analysis_type ?? "-")} · Status: {String(item.status ?? "-")}
                    </p>

                    <div className="flex flex-wrap gap-2 mt-3">
                      {canReview && (
                        <>
                          <button
                            type="button"
                            onClick={() => void handleReview(String(item.id), "approved")}
                            className="px-3 py-1.5 border border-neutral-300 text-xs font-mono"
                          >
                            APROVAR
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleReview(String(item.id), "changes_requested")}
                            className="px-3 py-1.5 border border-neutral-300 text-xs font-mono"
                          >
                            PEDIR AJUSTES
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleReview(String(item.id), "rejected")}
                            className="px-3 py-1.5 border border-neutral-300 text-xs font-mono"
                          >
                            REJEITAR
                          </button>
                        </>
                      )}

                      {canPublish && (
                        <button
                          type="button"
                          onClick={() => void handlePublishAnalysis(String(item.id))}
                          className="px-3 py-1.5 bg-black text-white text-xs font-mono"
                        >
                          PUBLICAR ANÁLISE
                        </button>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
