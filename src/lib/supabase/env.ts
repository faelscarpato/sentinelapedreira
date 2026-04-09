export const env = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  appBaseUrl: import.meta.env.VITE_APP_BASE_URL,
};

export const isSupabaseConfigured = Boolean(env.supabaseUrl && env.supabaseAnonKey);
