import { cache } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';

import { createServiceSupabaseClient } from '@/integrations/supabase/server';
import type { Database } from '@/integrations/supabase/types';

export class AdminServiceClientUnavailableError extends Error {
  constructor(message = 'Supabase service role client is not configured') {
    super(message);
    this.name = 'AdminServiceClientUnavailableError';
  }
}

const createClient = (): SupabaseClient<Database> => {
  const client = createServiceSupabaseClient();
  if (!client) {
    throw new AdminServiceClientUnavailableError();
  }
  return client;
};

const getClient = cache(createClient);

export const getAdminServiceClient = (): SupabaseClient<Database> => getClient();

export const tryGetAdminServiceClient = (): SupabaseClient<Database> | null => {
  try {
    return getAdminServiceClient();
  } catch (error) {
    if (error instanceof AdminServiceClientUnavailableError) {
      return null;
    }
    throw error;
  }
};

type WithClientOptions<T> = {
  fallback?: () => T | Promise<T>;
};

export const withAdminServiceClient = async <T>(
  handler: (client: SupabaseClient<Database>) => Promise<T>,
  options?: WithClientOptions<T>,
): Promise<T> => {
  const client = tryGetAdminServiceClient();
  if (!client) {
    if (options?.fallback) {
      return await options.fallback();
    }
    throw new AdminServiceClientUnavailableError();
  }
  return handler(client);
};
