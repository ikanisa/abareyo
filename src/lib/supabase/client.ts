"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseClient } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

let fallbackSingleton: SupabaseClient<Database> | null = null;

export const getSupabaseBrowserClient = (): SupabaseClient<Database> | null => {
  const existing = getSupabaseClient();
  if (existing) {
    return existing;
  }

  if (fallbackSingleton) {
    return fallbackSingleton;
  }

  const fallbackUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ??
    process.env.SITE_SUPABASE_URL ??
    process.env.SUPABASE_URL ??
    process.env.VITE_SUPABASE_URL ??
    "";
  const fallbackAnonKey =
    process.env.SITE_SUPABASE_PUBLISHABLE_KEY ??
    process.env.SITE_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.SUPABASE_PUBLISHABLE_KEY ??
    process.env.SUPABASE_ANON_KEY ??
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
    "";

  if (!fallbackUrl || !fallbackAnonKey) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "[supabase] Missing NEXT_PUBLIC_SUPABASE_URL/NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or fallbacks). Admin login will be disabled."
      );
    }
    return null;
  }

  const storage = typeof window !== "undefined" ? window.localStorage : undefined;
  fallbackSingleton = createClient<Database>(fallbackUrl, fallbackAnonKey, {
    auth: {
      storage,
      persistSession: true,
      autoRefreshToken: true,
    },
  });

  return fallbackSingleton;
};
