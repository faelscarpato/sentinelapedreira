import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { useAuth } from "../../features/auth/useAuth";
import { InlineStatus, PageContainer, PageHero, SectionBlock } from "../components/layout/PagePrimitives";

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
    <div className="min-h-screen bg-slate-50 pb-16">
      <PageHero
        title="Entrar"
        description="Acesse a área autenticada para acompanhar denúncias, favoritos e fluxo editorial."
        eyebrow="Autenticação"
      />

      <PageContainer className="pt-8">
        <SectionBlock className="mx-auto max-w-xl" title="Link mágico por e-mail">
          {!auth.isSupabaseEnabled ? (
            <InlineStatus kind="warning" className="mb-4">
              Supabase não configurado no frontend. Defina `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
            </InlineStatus>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-4">
            <label>
              <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">E-mail</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm focus:border-slate-900 focus:outline-none"
                placeholder="voce@exemplo.com"
              />
            </label>

            {successMessage ? <InlineStatus kind="success">{successMessage}</InlineStatus> : null}
            {errorMessage ? <InlineStatus kind="error">{errorMessage}</InlineStatus> : null}

            <button
              type="submit"
              disabled={!auth.isSupabaseEnabled || loading}
              className="w-full rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-45"
            >
              {loading ? "Enviando..." : "Enviar link mágico"}
            </button>
          </form>
        </SectionBlock>
      </PageContainer>
    </div>
  );
}
