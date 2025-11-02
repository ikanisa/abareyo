"use client";

import { createBrowserClient, type SupabaseClient } from "@supabase/auth-helpers-nextjs";

import { getSupabaseAnonKey, getSupabaseUrl } from "./env";

let browserClient: SupabaseClient | null = null;

export const getBrowserClient = () => {
  if (browserClient) {
    return browserClient;
  }

  const supabaseUrl = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();
  if (!supabaseUrl || !anonKey) {
    return null;
  }

  browserClient = createBrowserClient(supabaseUrl, anonKey);
  return browserClient;
};
