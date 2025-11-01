import type { SupabaseClient } from '@supabase/supabase-js';

import {
  SupabaseClientUnavailableError,
  getSupabaseServiceRoleClient,
  resetSupabaseClients,
  tryGetSupabaseServiceRoleClient,
} from '@/lib/db';

export class ServiceSupabaseClientUnavailableError extends Error {
  constructor(message = 'Supabase service client is not configured') {
    super(message);
    this.name = 'ServiceSupabaseClientUnavailableError';
  }
}

export const isSupabaseClient = (
  client: unknown,
): client is SupabaseClient =>
  typeof client === 'object' &&
  client !== null &&
  typeof (client as { from?: unknown }).from === 'function';

export const resetServiceSupabaseClient = () => {
  resetSupabaseClients();
};

export const getServiceSupabaseClient = (): SupabaseClient => {
  try {
    return getSupabaseServiceRoleClient();
  } catch (error) {
    if (error instanceof SupabaseClientUnavailableError) {
      throw new ServiceSupabaseClientUnavailableError();
    }
    throw error;
  }
};

export const tryGetServiceSupabaseClient = (): SupabaseClient | null => {
  try {
    return tryGetSupabaseServiceRoleClient();
  } catch (error) {
    if (error instanceof ServiceSupabaseClientUnavailableError) {
      return null;
    }
    throw error;
  }
};

type WithClientOptions<T> = {
  fallback?: () => T | Promise<T>;
};

export const withServiceSupabaseClient = async <T>(
  handler: (client: SupabaseClient) => Promise<T>,
  options?: WithClientOptions<T>,
): Promise<T> => {
  const client = tryGetServiceSupabaseClient();
  if (!client) {
    if (options?.fallback) {
      return await options.fallback();
    }
    throw new ServiceSupabaseClientUnavailableError();
  }
  return handler(client);
};

export const getSupabase = () => tryGetServiceSupabaseClient();
