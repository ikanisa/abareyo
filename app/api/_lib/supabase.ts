import type { SupabaseClient } from '@supabase/supabase-js';

import { createServiceSupabaseClient } from '@/integrations/supabase/server';
import type { Database } from '@/integrations/supabase/types';

export class ServiceSupabaseClientUnavailableError extends Error {
  constructor(message = 'Supabase service client is not configured') {
    super(message);
    this.name = 'ServiceSupabaseClientUnavailableError';
  }
}

let cachedClient: SupabaseClient<Database> | null = null;

const createClient = (): SupabaseClient<Database> => {
  if (cachedClient) {
    return cachedClient;
  }

  const client = createServiceSupabaseClient();
  if (!client) {
    throw new ServiceSupabaseClientUnavailableError();
  }

  cachedClient = client;
  return cachedClient;
};

export const resetServiceSupabaseClient = () => {
  cachedClient = null;
};

export const getServiceSupabaseClient = (): SupabaseClient<Database> => createClient();

export const tryGetServiceSupabaseClient = (): SupabaseClient<Database> | null => {
  try {
    return getServiceSupabaseClient();
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
  handler: (client: SupabaseClient<Database>) => Promise<T>,
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
