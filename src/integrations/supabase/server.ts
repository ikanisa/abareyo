import { createClient } from '@supabase/supabase-js';

import { getSupabaseSecretKey, getSupabaseUrl } from './env';
import type { Database } from './types';

export const createServiceSupabaseClient = () => {
  const url = getSupabaseUrl();
  const key = getSupabaseSecretKey();
  if (!url || !key) {
    return null;
  }
  return createClient<Database>(url, key, {
    auth: { persistSession: false },
  });
};
