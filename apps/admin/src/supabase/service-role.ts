import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { getSupabaseServiceRoleKey, getSupabaseUrl } from "./env";

let client: SupabaseClient | null = null;

export const getServiceRoleClient = <T = any>(): SupabaseClient<T> | null => {
  if (client) {
    return client as SupabaseClient<T>;
  }

  const url = getSupabaseUrl();
  const key = getSupabaseServiceRoleKey();
  if (!url || !key) {
    return null;
  }

  client = createClient<T>(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return client as SupabaseClient<T>;
};
