import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const required = (value: string | undefined, name: string) => {
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
};

export const createServiceSupabaseClient = () => {
  const url = required(process.env.SUPABASE_URL, 'SUPABASE_URL');
  const key = required(process.env.SUPABASE_SERVICE_ROLE_KEY, 'SUPABASE_SERVICE_ROLE_KEY');
  return createClient<Database>(url, key, {
    auth: { persistSession: false },
  });
};
