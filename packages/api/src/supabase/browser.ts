import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { clientEnv, supabaseClientConfig } from "@rayon/config/env";

import type { Database } from "../../types/database";
import { SupabaseConfigurationError } from "./errors";

export type BrowserClientOptions = {
  storage?: Storage | undefined;
};

const resolveStorage = (explicit?: Storage): Storage | undefined => {
  if (explicit) {
    return explicit;
  }
  if (typeof window !== "undefined") {
    return window.localStorage;
  }
  return undefined;
};

export const createBrowserClient = (
  { storage }: BrowserClientOptions = {},
): SupabaseClient<Database> => {
  const url = supabaseClientConfig.url ?? clientEnv.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = supabaseClientConfig.anonKey ?? clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url) {
    throw new SupabaseConfigurationError(
      "Supabase URL is not configured. Set NEXT_PUBLIC_SUPABASE_URL or SITE_SUPABASE_URL.",
    );
  }

  if (!anonKey) {
    throw new SupabaseConfigurationError(
      "Supabase anonymous key is not configured. Set NEXT_PUBLIC_SUPABASE_ANON_KEY or SITE_SUPABASE_PUBLISHABLE_KEY.",
    );
  }

  const resolvedStorage = resolveStorage(storage);
  return createClient<Database, 'public'>(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: resolvedStorage,
    },
  });
};
