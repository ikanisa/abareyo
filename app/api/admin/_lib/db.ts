import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@/integrations/supabase/types';
import {
  AdminServiceClientUnavailableError,
  getAdminServiceClient,
  tryGetAdminServiceClient,
  withAdminServiceClient,
} from '@/services/admin/service-client';

export const getServiceClient = (): SupabaseClient<Database> => getAdminServiceClient();

export {
  AdminServiceClientUnavailableError,
  tryGetAdminServiceClient,
  withAdminServiceClient,
};
