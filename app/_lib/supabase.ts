"use server";

import type { SupabaseClient } from "@supabase/supabase-js";

import { tryGetSupabaseServiceRoleClient } from "@/lib/db";

let singleton: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (singleton) return singleton;
  const client = tryGetSupabaseServiceRoleClient();
  if (!client) return null;
  singleton = client;
  return singleton;
}
