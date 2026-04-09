import { Navigate } from "react-router";
import type { ReactNode } from "react";
import type { AppRole } from "../../features/auth/types";
import { useAuth } from "../../features/auth/useAuth";

interface RequireRolesProps {
  roles: AppRole[];
  children: ReactNode;
}

export function RequireRoles({ roles, children }: RequireRolesProps) {
  const auth = useAuth();

  if (!auth.ready) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-sm font-mono text-neutral-600">
        Carregando permissões...
      </div>
    );
  }

  if (!auth.isAuthenticated) {
    return <Navigate to="/entrar" replace />;
  }

  if (!auth.hasAnyRole(roles)) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center px-4">
        <div className="max-w-xl border border-neutral-200 bg-neutral-50 p-6">
          <h1 className="font-mono text-xl mb-2">Acesso restrito</h1>
          <p className="text-sm text-neutral-700">
            Esta área exige os papéis: {roles.join(", ")}. Solicite autorização a um administrador.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
