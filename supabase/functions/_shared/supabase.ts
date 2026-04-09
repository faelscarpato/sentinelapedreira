import { createClient } from "npm:@supabase/supabase-js@2";
import { HttpError } from "./errors.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!supabaseUrl) {
  throw new Error("SUPABASE_URL não configurada nas Edge Functions.");
}

if (!supabaseAnonKey) {
  throw new Error("SUPABASE_ANON_KEY não configurada nas Edge Functions.");
}

if (!supabaseServiceRoleKey) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY não configurada nas Edge Functions.");
}

export function getServiceClient() {
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function getUserClient(authHeader: string | null) {
  if (!authHeader) {
    throw new HttpError(401, "missing_auth", "Token de autenticação ausente.");
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      headers: {
        Authorization: authHeader,
      },
    },
  });
}

export function getSupabaseUrl() {
  return supabaseUrl;
}
