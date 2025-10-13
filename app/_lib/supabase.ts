import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let singleton: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (singleton) return singleton;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key =
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  singleton = createClient(url, key, { auth: { persistSession: false } });
  return singleton;
}
