import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { clientEnv, serverEnv, supabaseClientConfig, supabaseServerConfig } from "@rayon/config/env";

import type { Database } from "../../types/database";
import { SupabaseConfigurationError } from "./errors";

export type ServerClientAccess = "service_role" | "anon";

export type ServerClientOptions = {
  accessType?: ServerClientAccess;
};

const resolveUrl = (): string => {
  const url = supabaseClientConfig.url ?? clientEnv.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) {
    throw new SupabaseConfigurationError(
      "Supabase URL is not configured. Set SITE_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL.",
    );
  }
  return url;
};

const resolveKey = (accessType: ServerClientAccess): string => {
  if (accessType === "service_role") {
    const key = supabaseServerConfig.serviceRoleKey;
    if (!key) {
      throw new SupabaseConfigurationError(
        "Supabase service role key is not configured. Set SUPABASE_SERVICE_ROLE_KEY or SITE_SUPABASE_SECRET_KEY.",
      );
    }
    return key;
  }

  const anonKey = supabaseClientConfig.anonKey ?? serverEnv.SITE_SUPABASE_PUBLISHABLE_KEY ?? null;
  if (!anonKey) {
    throw new SupabaseConfigurationError(
      "Supabase anon key is not configured. Set SITE_SUPABASE_PUBLISHABLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }
  return anonKey;
};

export const createServerClient = ({
  accessType = "service_role",
}: ServerClientOptions = {}): SupabaseClient<Database> => {
  const url = resolveUrl();
  const key = resolveKey(accessType);
  return createClient<Database, 'public'>(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
};
