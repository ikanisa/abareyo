"use server";
import { cache } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';

import { createServiceSupabaseClient } from '@/integrations/supabase/server';
import { AdminServiceClientUnavailableError } from './service-client-errors';

// Re-export error class for backward compatibility
export { AdminServiceClientUnavailableError };

const createClient = (): SupabaseClient => {
  const client = createServiceSupabaseClient();
  if (!client) {
    throw new AdminServiceClientUnavailableError();
  }
  return client;
};

const getClient = cache(createClient);

export const getAdminServiceClient = (): SupabaseClient => getClient();

export const tryGetAdminServiceClient = (): SupabaseClient | null => {
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
  handler: (client: SupabaseClient) => Promise<T>,
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
