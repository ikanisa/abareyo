import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
import { createServiceSupabaseClient } from '@/integrations/supabase/server';

export const getServiceClient = (): SupabaseClient<Database> => {
  const client = createServiceSupabaseClient();
  if (!client) {
    throw new Error('Supabase service role client is not configured');
  }
  return client;
};
