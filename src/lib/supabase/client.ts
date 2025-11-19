"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@rayon/api/types/database";
import { clientEnv } from "@/config/env";

let singleton: SupabaseClient<Database> | null = null;

const getBrowserEnv = () => {
  const supabaseUrl = clientEnv.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? clientEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? null;

  if (!supabaseUrl || !supabaseKey) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[supabase] Missing browser credentials; auth UI will be disabled until configured.");
    }
    return null;
  }

  return { supabaseUrl, supabaseKey };
};

export const getSupabaseBrowserClient = (): SupabaseClient<Database> | null => {
  if (singleton) {
    return singleton;
  }

  const env = getBrowserEnv();
  if (!env) {
    return null;
  }

  singleton = createBrowserClient<Database>(env.supabaseUrl, env.supabaseKey);
  return singleton;
};
