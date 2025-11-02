import { clientEnv, supabaseClientConfig, supabaseServerConfig } from "@rayon/config/env";

export const getSupabaseUrl = (): string | null => supabaseClientConfig.url ?? null;

export const getSupabasePublishableKey = (): string | null =>
  supabaseClientConfig.anonKey ?? supabaseClientConfig.publishableKey ?? clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? null;

export const getSupabaseSecretKey = (): string | null => supabaseServerConfig.serviceRoleKey ?? null;
