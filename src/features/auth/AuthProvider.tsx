import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { AuthContext } from "./context";
import type { AppRole, UserProfile } from "./types";
import { env, isSupabaseConfigured } from "../../lib/supabase/env";
import { supabase } from "../../lib/supabase/client";

interface AuthProviderProps {
  children: ReactNode;
}

interface RoleRow {
  roles:
    | {
        key: AppRole;
      }
    | {
        key: AppRole;
      }[]
    | null;
}

async function fetchProfile(user: User): Promise<UserProfile | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, display_name, avatar_url, locale, timezone, status")
    .eq("id", user.id)
    .single();

  if (error) {
    return null;
  }

  return data as UserProfile;
}

async function fetchRoles(user: User): Promise<AppRole[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("user_roles")
    .select("roles(key)")
    .eq("user_id", user.id)
    .eq("is_active", true);

  if (error) {
    return [];
  }

  const rows = ((data ?? []) as unknown as RoleRow[]).flatMap((row) =>
    Array.isArray(row.roles) ? row.roles : row.roles ? [row.roles] : [],
  );

  const roleKeys = rows
    .map((row) => row.key)
    .filter((value): value is AppRole => Boolean(value));

  return roleKeys.length > 0 ? roleKeys : ["authenticated_user"];
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);

  const refresh = useCallback(async () => {
    if (!supabase) {
      setSession(null);
      setUser(null);
      setProfile(null);
      setRoles([]);
      setReady(true);
      return;
    }

    const {
      data: { session: activeSession },
    } = await supabase.auth.getSession();

    setSession(activeSession);
    setUser(activeSession?.user ?? null);

    if (activeSession?.user) {
      const [profileResult, rolesResult] = await Promise.all([
        fetchProfile(activeSession.user),
        fetchRoles(activeSession.user),
      ]);

      setProfile(profileResult);
      setRoles(rolesResult.length ? rolesResult : ["authenticated_user"]);
    } else {
      setProfile(null);
      setRoles([]);
    }

    setReady(true);
  }, []);

  useEffect(() => {
    void refresh();

    if (!supabase) return;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);

      if (nextSession?.user) {
        void Promise.all([fetchProfile(nextSession.user), fetchRoles(nextSession.user)]).then(
          ([profileResult, roleResult]) => {
            setProfile(profileResult);
            setRoles(roleResult.length ? roleResult : ["authenticated_user"]);
          },
        );
      } else {
        setProfile(null);
        setRoles([]);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [refresh]);

  const signInWithMagicLink = useCallback(async (email: string) => {
    if (!supabase) {
      throw new Error("Supabase não configurado para autenticação.");
    }

    const redirectBase = env.appBaseUrl ?? window.location.origin;
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${redirectBase}/minha-conta`,
      },
    });

    if (error) {
      throw error;
    }
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
  }, []);

  const hasRole = useCallback(
    (role: AppRole) => {
      if (!user) return role === "public";
      return roles.includes(role);
    },
    [roles, user],
  );

  const hasAnyRole = useCallback(
    (targets: AppRole[]) => targets.some((target) => hasRole(target)),
    [hasRole],
  );

  const value = useMemo(
    () => ({
      ready,
      isAuthenticated: Boolean(user),
      isSupabaseEnabled: isSupabaseConfigured,
      user,
      session,
      profile,
      roles,
      signInWithMagicLink,
      signOut,
      refresh,
      hasRole,
      hasAnyRole,
    }),
    [ready, user, session, profile, roles, signInWithMagicLink, signOut, refresh, hasRole, hasAnyRole],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
