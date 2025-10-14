import { createServiceSupabaseClient } from '@/integrations/supabase/server';

export const getServiceClient = () => {
  const client = createServiceSupabaseClient();
  if (!client) {
    throw new Error('Supabase service role client is not configured');
  }
  return client;
};
