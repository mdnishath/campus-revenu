export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/** True once the user has filled .env.local with real Supabase keys. */
export const supabaseEnabled =
  SUPABASE_URL.startsWith("http") && SUPABASE_ANON_KEY.length > 20;
