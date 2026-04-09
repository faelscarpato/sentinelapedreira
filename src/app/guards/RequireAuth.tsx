import { Navigate, useLocation } from "react-router";
import type { ReactNode } from "react";
import { useAuth } from "../../features/auth/useAuth";

interface RequireAuthProps {
  children: ReactNode;
}

export function RequireAuth({ children }: RequireAuthProps) {
  const auth = useAuth();
  const location = useLocation();

  if (!auth.ready) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-sm font-mono text-neutral-600">
        Carregando autenticação...
      </div>
    );
  }

  if (!auth.isAuthenticated) {
    const next = encodeURIComponent(`${location.pathname}${location.search}`);
    return <Navigate to={`/entrar?next=${next}`} replace />;
  }

  return <>{children}</>;
}
