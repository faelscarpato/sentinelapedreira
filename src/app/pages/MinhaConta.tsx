import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../features/auth/useAuth";
import { fetchMyComplaints } from "../services/complaintsService";
import {
  listFavorites,
  listNotifications,
  listSavedFilters,
  markNotificationAsRead,
  saveFilter,
} from "../services/userDataService";
import { InlineStatus, PageContainer, PageHero, PageState, SectionBlock } from "../components/layout/PagePrimitives";

export function MinhaConta() {
  const auth = useAuth();
  const [activeTab, setActiveTab] = useState<"denuncias" | "favoritos" | "filtros" | "notificacoes">("denuncias");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [complaints, setComplaints] = useState<Array<Record<string, unknown>>>([]);
  const [favorites, setFavorites] = useState<Array<Record<string, unknown>>>([]);
  const [savedFilters, setSavedFilters] = useState<Array<Record<string, unknown>>>([]);
  const [notifications, setNotifications] = useState<Array<Record<string, unknown>>>([]);

  const [newFilterName, setNewFilterName] = useState("");
  const [newFilterTarget, setNewFilterTarget] = useState<"documents" | "analyses" | "complaints">("documents");

  const roleLabels = useMemo(() => auth.roles.join(", "), [auth.roles]);

  useEffect(() => {
    if (!auth.user) return;

    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const [complaintsResult, favoritesResult, filtersResult, notificationsResult] = await Promise.all([
          fetchMyComplaints(auth.user!.id),
          listFavorites(auth.user!.id),
          listSavedFilters(auth.user!.id),
          listNotifications(auth.user!.id),
        ]);

        setComplaints(complaintsResult as Array<Record<string, unknown>>);
        setFavorites(favoritesResult as Array<Record<string, unknown>>);
        setSavedFilters(filtersResult as Array<Record<string, unknown>>);
        setNotifications(notificationsResult as Array<Record<string, unknown>>);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Falha ao carregar dados da conta.");
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [auth.user]);

  const handleSaveFilter = async () => {
    if (!auth.user || !newFilterName.trim()) return;

    try {
      await saveFilter(auth.user.id, newFilterTarget, newFilterName.trim(), {
        createdAt: new Date().toISOString(),
      });

      const updated = await listSavedFilters(auth.user.id);
      setSavedFilters(updated as Array<Record<string, unknown>>);
      setNewFilterName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao salvar filtro.");
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId);
      if (!auth.user) return;
      const updated = await listNotifications(auth.user.id);
      setNotifications(updated as Array<Record<string, unknown>>);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao marcar notificação como lida.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      <PageHero
        title="Central do Usuário"
        description={`Perfil: ${auth.profile?.display_name ?? auth.user?.email ?? "Usuário"} · Papéis: ${roleLabels || "sem papéis"}`}
        eyebrow="Área autenticada"
      />

      <PageContainer className="pt-8">
        {error ? <InlineStatus kind="error" className="mb-6">{error}</InlineStatus> : null}

        <div className="mb-6 flex flex-wrap gap-2">
          {[
            { key: "denuncias", label: "Denúncias" },
            { key: "favoritos", label: "Favoritos" },
            { key: "filtros", label: "Filtros Salvos" },
            { key: "notificacoes", label: "Notificações" },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] ${
                activeTab === tab.key ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <PageState mode="loading" title="Carregando dados da conta" />
        ) : (
          <>
            {activeTab === "denuncias" ? (
              <SectionBlock title="Minhas denúncias">
                <div className="space-y-3">
                  {complaints.length === 0 ? (
                    <PageState mode="empty" title="Nenhuma denúncia vinculada à conta" />
                  ) : (
                    complaints.map((item) => (
                      <article key={String(item.id)} className="rounded-xl border border-slate-200 bg-white p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                          {String(item.protocol ?? "")}
                        </p>
                        <p className="mt-2 font-headline text-lg font-bold tracking-tight text-slate-900">
                          {String(item.subject ?? "")}
                        </p>
                        <p className="mt-2 text-sm text-slate-600">Status: {String(item.status ?? "")}</p>
                      </article>
                    ))
                  )}
                </div>
              </SectionBlock>
            ) : null}

            {activeTab === "favoritos" ? (
              <SectionBlock title="Favoritos">
                <div className="space-y-3">
                  {favorites.length === 0 ? (
                    <PageState mode="empty" title="Nenhum favorito salvo" />
                  ) : (
                    favorites.map((item) => (
                      <article key={String(item.id)} className="rounded-xl border border-slate-200 bg-white p-4 text-sm">
                        Documento: {String((item.documents as { title?: string } | null)?.title ?? "-")} · Análise:{" "}
                        {String((item.analyses as { title?: string } | null)?.title ?? "-")}
                      </article>
                    ))
                  )}
                </div>
              </SectionBlock>
            ) : null}

            {activeTab === "filtros" ? (
              <SectionBlock title="Filtros salvos">
                <div className="mb-4 grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-3">
                  <input
                    value={newFilterName}
                    onChange={(event) => setNewFilterName(event.target.value)}
                    placeholder="Nome do filtro"
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                  />
                  <select
                    value={newFilterTarget}
                    onChange={(event) => setNewFilterTarget(event.target.value as typeof newFilterTarget)}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                  >
                    <option value="documents">Documentos</option>
                    <option value="analyses">Análises</option>
                    <option value="complaints">Denúncias</option>
                  </select>
                  <button
                    type="button"
                    onClick={handleSaveFilter}
                    className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                  >
                    Salvar filtro
                  </button>
                </div>

                <div className="space-y-2">
                  {savedFilters.length === 0 ? (
                    <PageState mode="empty" title="Nenhum filtro salvo" />
                  ) : (
                    savedFilters.map((item) => (
                      <article key={String(item.id)} className="rounded-xl border border-slate-200 bg-white p-4 text-sm">
                        {String(item.name)} · {String(item.target)}
                      </article>
                    ))
                  )}
                </div>
              </SectionBlock>
            ) : null}

            {activeTab === "notificacoes" ? (
              <SectionBlock title="Notificações">
                <div className="space-y-3">
                  {notifications.length === 0 ? (
                    <PageState mode="empty" title="Nenhuma notificação" />
                  ) : (
                    notifications.map((item) => (
                      <article key={String(item.id)} className="rounded-xl border border-slate-200 bg-white p-4">
                        <p className="font-headline text-lg font-bold tracking-tight text-slate-900">
                          {String(item.title ?? "")}
                        </p>
                        <p className="mt-2 text-sm text-slate-600">{String(item.body ?? "")}</p>
                        {item.is_read !== true ? (
                          <button
                            type="button"
                            onClick={() => void handleMarkAsRead(String(item.id))}
                            className="mt-3 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-slate-700 hover:border-slate-900 hover:text-slate-900"
                          >
                            Marcar como lida
                          </button>
                        ) : null}
                      </article>
                    ))
                  )}
                </div>
              </SectionBlock>
            ) : null}
          </>
        )}
      </PageContainer>
    </div>
  );
}
