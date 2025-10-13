import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

export const createServiceSupabaseClient = () => {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return null;
  }
  return createClient<Database>(url, key, {
    auth: { persistSession: false },
  });
};
