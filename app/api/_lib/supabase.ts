import { createServiceSupabaseClient } from '@/integrations/supabase/server';

export const getSupabase = () => createServiceSupabaseClient();
