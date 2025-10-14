import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@/integrations/supabase/types';

let adminClient: SupabaseClient<Database> | null = null;

export function getSupabaseAdmin(): SupabaseClient<Database> {
  if (adminClient) {
    return adminClient;
  }

  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error('Supabase service role credentials are missing');
  }

  adminClient = createClient<Database>(url, serviceKey, {
    auth: { persistSession: false },
  });

  return adminClient;
}
