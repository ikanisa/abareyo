import type { SupabaseClient } from '@supabase/supabase-js';

import {
  AdminServiceClientUnavailableError,
  getAdminServiceClient,
  tryGetAdminServiceClient,
  withAdminServiceClient,
} from '@/services/admin/service-client';

export const getServiceClient = (): SupabaseClient => getAdminServiceClient();

export {
  AdminServiceClientUnavailableError,
  tryGetAdminServiceClient,
  withAdminServiceClient,
};
