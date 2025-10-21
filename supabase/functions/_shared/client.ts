import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

import { getSupabaseServiceRoleKey, getSupabaseUrl, requireEnv } from "./env.ts";

let cachedClient: SupabaseClient | null = null;

export const getServiceRoleClient = (): SupabaseClient => {
  if (cachedClient) {
    return cachedClient;
  }

  const url = requireEnv(getSupabaseUrl(), "SUPABASE_URL");
  const key = requireEnv(getSupabaseServiceRoleKey(), "SUPABASE_SERVICE_ROLE_KEY");

  cachedClient = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return cachedClient;
};

export const resetServiceRoleClient = () => {
  cachedClient = null;
};
