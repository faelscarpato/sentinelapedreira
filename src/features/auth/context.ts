import { createContext, useContext } from "react";
import type { Session, User } from "@supabase/supabase-js";
import type { AppRole, UserProfile } from "./types";

export interface AuthContextValue {
  ready: boolean;
  isAuthenticated: boolean;
  isSupabaseEnabled: boolean;
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  roles: AppRole[];
  signInWithMagicLink: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
  hasRole: (role: AppRole) => boolean;
  hasAnyRole: (roles: AppRole[]) => boolean;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de AuthProvider.");
  }
  return context;
}
