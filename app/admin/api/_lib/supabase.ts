import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@/integrations/supabase/types';
import { getAdminServiceClient } from '@/services/admin/service-client';

export function getSupabaseAdmin(): SupabaseClient<Database> {
  return getAdminServiceClient();
}
