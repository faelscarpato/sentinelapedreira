import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { useAuth } from "../../features/auth/useAuth";

export function Entrar() {
  const auth = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const params = new URLSearchParams(location.search);
  const nextPath = params.get("next") || "/minha-conta";

  useEffect(() => {
    if (auth.ready && auth.isAuthenticated) {
      navigate(nextPath, { replace: true });
    }
  }, [auth.ready, auth.isAuthenticated, navigate, nextPath]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await auth.signInWithMagicLink(email.trim());
      setSuccessMessage("Link de acesso enviado. Verifique seu e-mail.");
      setEmail("");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao enviar link de autenticação.";
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-md border border-neutral-200 p-6">
        <h1 className="text-2xl font-mono mb-2">Entrar</h1>
        <p className="text-sm text-neutral-600 mb-6">
          Acesse a área autenticada para acompanhar denúncias, favoritos e workflow editorial.
        </p>

        {!auth.isSupabaseEnabled && (
          <div className="mb-4 border border-orange-300 bg-orange-50 p-3 text-sm text-orange-900">
            Supabase não configurado no frontend. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-neutral-700 mb-2">E-MAIL</label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="w-full px-4 py-2 border border-neutral-300 focus:outline-none focus:border-black"
              placeholder="voce@exemplo.com"
            />
          </div>

          {successMessage && (
            <div className="border border-green-300 bg-green-50 p-3 text-sm text-green-900">{successMessage}</div>
          )}

          {errorMessage && (
            <div className="border border-red-300 bg-red-50 p-3 text-sm text-red-900">{errorMessage}</div>
          )}

          <button
            type="submit"
            disabled={!auth.isSupabaseEnabled || loading}
            className="w-full px-4 py-3 bg-black text-white font-mono text-sm hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? "ENVIANDO..." : "ENVIAR LINK MÁGICO"}
          </button>
        </form>
      </div>
    </div>
  );
}
