import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { getSupabaseSecretKey, getSupabaseUrl } from '@/integrations/supabase/env';
import type { Database } from '@/integrations/supabase/types';

let adminClient: SupabaseClient<Database> | null = null;

export function getSupabaseAdmin(): SupabaseClient<Database> {
  if (adminClient) {
    return adminClient;
  }

  const url = getSupabaseUrl();
  const serviceKey = getSupabaseSecretKey();

  if (!url || !serviceKey) {
    throw new Error('Supabase service role credentials are missing');
  }

  adminClient = createClient<Database>(url, serviceKey, {
    auth: { persistSession: false },
  });

  return adminClient;
}
