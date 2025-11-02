'use server';

import type { SupabaseClient } from '@supabase/supabase-js';

import { createServerClient, SupabaseConfigurationError } from '@rayon/api/supabase';
import type { Database } from '@rayon/api/types/database';

export const createServiceSupabaseClient = (): SupabaseClient<Database> | null => {
  try {
    return createServerClient({ accessType: 'service_role' });
  } catch (error) {
    if (error instanceof SupabaseConfigurationError) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[supabase] Service role credentials are missing. Admin tooling will be disabled.');
      }
      return null;
    }
    throw error;
  }
};
