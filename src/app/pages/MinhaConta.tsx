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
    <div className="min-h-screen bg-white">
      <div className="bg-neutral-900 text-white py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-mono">Central do Usuário</h1>
          <p className="text-neutral-300 mt-2 text-sm">
            Perfil: {auth.profile?.display_name ?? auth.user?.email ?? "Usuário"} · Papéis: {roleLabels || "sem papéis"}
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && <div className="mb-4 border border-red-300 bg-red-50 p-3 text-sm text-red-900">{error}</div>}

        <div className="flex flex-wrap gap-2 mb-6">
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
              className={`px-4 py-2 text-sm font-mono border ${
                activeTab === tab.key ? "bg-black text-white border-black" : "border-neutral-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="border border-neutral-200 p-6 text-sm text-neutral-600">Carregando dados...</div>
        ) : (
          <>
            {activeTab === "denuncias" && (
              <div className="space-y-3">
                {complaints.length === 0 && <div className="border border-neutral-200 p-4 text-sm">Nenhuma denúncia vinculada à conta.</div>}
                {complaints.map((item) => (
                  <div key={String(item.id)} className="border border-neutral-200 p-4">
                    <p className="font-mono text-sm">{String(item.protocol ?? "")}</p>
                    <p className="text-sm text-neutral-700 mt-1">{String(item.subject ?? "")}</p>
                    <p className="text-xs text-neutral-500 mt-2">Status: {String(item.status ?? "")}</p>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "favoritos" && (
              <div className="space-y-3">
                {favorites.length === 0 && <div className="border border-neutral-200 p-4 text-sm">Nenhum favorito salvo.</div>}
                {favorites.map((item) => (
                  <div key={String(item.id)} className="border border-neutral-200 p-4 text-sm">
                    Documento: {String((item.documents as { title?: string } | null)?.title ?? "-")} ·
                    Análise: {String((item.analyses as { title?: string } | null)?.title ?? "-")}
                  </div>
                ))}
              </div>
            )}

            {activeTab === "filtros" && (
              <div>
                <div className="border border-neutral-200 p-4 mb-4">
                  <p className="text-sm font-mono mb-3">Salvar novo filtro</p>
                  <div className="grid md:grid-cols-3 gap-3">
                    <input
                      value={newFilterName}
                      onChange={(event) => setNewFilterName(event.target.value)}
                      placeholder="Nome do filtro"
                      className="px-3 py-2 border border-neutral-300"
                    />
                    <select
                      value={newFilterTarget}
                      onChange={(event) => setNewFilterTarget(event.target.value as typeof newFilterTarget)}
                      className="px-3 py-2 border border-neutral-300 bg-white"
                    >
                      <option value="documents">Documentos</option>
                      <option value="analyses">Análises</option>
                      <option value="complaints">Denúncias</option>
                    </select>
                    <button
                      type="button"
                      onClick={handleSaveFilter}
                      className="px-3 py-2 bg-black text-white font-mono text-sm"
                    >
                      SALVAR
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {savedFilters.length === 0 && <div className="border border-neutral-200 p-4 text-sm">Nenhum filtro salvo.</div>}
                  {savedFilters.map((item) => (
                    <div key={String(item.id)} className="border border-neutral-200 p-4 text-sm">
                      {String(item.name)} · {String(item.target)}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "notificacoes" && (
              <div className="space-y-3">
                {notifications.length === 0 && <div className="border border-neutral-200 p-4 text-sm">Nenhuma notificação.</div>}
                {notifications.map((item) => (
                  <div key={String(item.id)} className="border border-neutral-200 p-4">
                    <p className="font-mono text-sm">{String(item.title ?? "")}</p>
                    <p className="text-sm text-neutral-700 mt-1">{String(item.body ?? "")}</p>
                    {item.is_read !== true && (
                      <button
                        type="button"
                        onClick={() => void handleMarkAsRead(String(item.id))}
                        className="mt-3 px-3 py-1.5 border border-neutral-300 text-xs font-mono"
                      >
                        MARCAR COMO LIDA
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
