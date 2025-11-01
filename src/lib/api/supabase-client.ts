import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export const getSupabaseClient = () => {
  const client = getSupabaseBrowserClient();
  if (!client) {
    console.warn("[supabase] Client unavailable in this environment");
  }
  return client;
};
