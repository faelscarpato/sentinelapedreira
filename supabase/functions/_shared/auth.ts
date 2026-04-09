import type { User } from "npm:@supabase/supabase-js@2";
import { HttpError } from "./errors.ts";
import { getServiceClient, getUserClient } from "./supabase.ts";

export interface AuthContext {
  user: User | null;
  roleKeys: string[];
}

export async function resolveAuthContext(authHeader: string | null, requireAuth: boolean) {
  if (!authHeader) {
    if (requireAuth) {
      throw new HttpError(401, "unauthorized", "Autenticação obrigatória.");
    }
    return { user: null, roleKeys: [] } satisfies AuthContext;
  }

  const userClient = getUserClient(authHeader);
  const {
    data: { user },
    error,
  } = await userClient.auth.getUser();

  if (error || !user) {
    if (requireAuth) {
      throw new HttpError(401, "unauthorized", "Token inválido ou expirado.", error);
    }
    return { user: null, roleKeys: [] } satisfies AuthContext;
  }

  const service = getServiceClient();
  const { data: roleRows, error: rolesError } = await service
    .from("user_roles")
    .select("roles(key)")
    .eq("user_id", user.id)
    .eq("is_active", true);

  if (rolesError) {
    throw new HttpError(500, "roles_lookup_failed", "Falha ao resolver papéis do usuário.", rolesError);
  }

  const roleKeys = (roleRows ?? [])
    .map((row) => (row.roles as { key?: string } | null)?.key)
    .filter((value): value is string => Boolean(value));

  return { user, roleKeys } satisfies AuthContext;
}

export function ensureRole(ctx: AuthContext, allowed: string[]) {
  if (!ctx.user) {
    throw new HttpError(401, "unauthorized", "Autenticação obrigatória.");
  }

  const hasAllowedRole = ctx.roleKeys.some((role) => allowed.includes(role));
  if (!hasAllowedRole) {
    throw new HttpError(403, "forbidden", "Usuário sem permissão para esta operação.");
  }
}
