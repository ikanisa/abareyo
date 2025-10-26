import type { SupabaseClient } from '@supabase/supabase-js';

import { getAdminServiceClient } from '@/services/admin/service-client';

export function getSupabaseAdmin(): SupabaseClient {
  return getAdminServiceClient();
}
