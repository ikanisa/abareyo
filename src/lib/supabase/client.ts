"use client";

import type { SupabaseClient } from "@supabase/supabase-js";

import { createBrowserClient, SupabaseConfigurationError } from "@rayon/api/supabase";
import type { Database } from "@rayon/api/types/database";

let singleton: SupabaseClient<Database> | null = null;

export const getSupabaseBrowserClient = (): SupabaseClient<Database> | null => {
  if (singleton) {
    return singleton;
  }

  try {
    singleton = createBrowserClient();
    return singleton;
  } catch (error) {
    if (error instanceof SupabaseConfigurationError) {
      if (process.env.NODE_ENV !== "production") {
        console.warn(
          "[supabase] Missing Supabase browser credentials. Authentication flows will be disabled until configured.",
        );
      }
      return null;
    }
    throw error;
  }
};
