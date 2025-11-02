import { clientEnv, supabaseConfig } from "@rayon/config/env";

export const getSupabaseUrl = (): string | null => supabaseConfig.url ?? null;

export const getSupabasePublishableKey = (): string | null =>
  supabaseConfig.anonKey ?? supabaseConfig.publishableKey ?? clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? null;

export const getSupabaseSecretKey = (): string | null => supabaseConfig.serviceRoleKey ?? null;
