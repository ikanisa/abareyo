import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import {
  getSupabasePublishableKey,
  getSupabaseSecretKey,
  getSupabaseUrl,
} from "@/integrations/supabase/env";

let singleton: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (singleton) return singleton;
  const url = getSupabaseUrl();
  const key = getSupabasePublishableKey() ?? getSupabaseSecretKey();
  if (!url || !key) return null;
  singleton = createClient(url, key, { auth: { persistSession: false } });
  return singleton;
}
