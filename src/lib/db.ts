"use server";
/* eslint-disable @typescript-eslint/no-explicit-any */

import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@rayon/api/types/database';

import { createServerClient, SupabaseConfigurationError } from '@rayon/api/supabase';

import { SupabaseClientAccessError, SupabaseClientUnavailableError } from './db-errors';

const ensureServerEnvironment = () => {
  if (typeof window !== 'undefined') {
    throw new SupabaseClientAccessError('Supabase server clients are not available in the browser');
  }
};

// Re-export error classes for backward compatibility
export { SupabaseClientAccessError, SupabaseClientUnavailableError };

let serviceRoleClient: SupabaseClient<Database> | null = null;
let serverAnonClient: SupabaseClient<Database> | null = null;

export const createSupabaseServiceRoleClient = (): SupabaseClient<Database> | null => {
  ensureServerEnvironment();
  try {
    return createServerClient({ accessType: 'service_role' }) as SupabaseClient<Database>;
  } catch (error) {
    if (error instanceof SupabaseConfigurationError) {
      return null;
    }
    throw error;
  }
};

export const createSupabaseServerAnonClient = (): SupabaseClient<Database> | null => {
  ensureServerEnvironment();
  try {
    return createServerClient({ accessType: 'anon' }) as SupabaseClient<Database>;
  } catch (error) {
    if (error instanceof SupabaseConfigurationError) {
      return null;
    }
    throw error;
  }
};

export const getSupabaseServiceRoleClient = (): SupabaseClient<Database> => {
  if (serviceRoleClient) {
    return serviceRoleClient;
  }
  const client = createSupabaseServiceRoleClient();
  if (!client) {
    throw new SupabaseClientUnavailableError('Supabase service role credentials are not configured');
  }
  serviceRoleClient = client;
  return client;
};

export const getSupabaseServerAnonClient = (): SupabaseClient<Database> => {
  if (serverAnonClient) {
    return serverAnonClient;
  }
  const client = createSupabaseServerAnonClient();
  if (!client) {
    throw new SupabaseClientUnavailableError('Supabase anon credentials are not configured');
  }
  serverAnonClient = client;
  return client;
};

export const tryGetSupabaseServiceRoleClient = (): SupabaseClient<Database> | null => {
  try {
    return getSupabaseServiceRoleClient();
  } catch (error) {
    if (error instanceof SupabaseClientUnavailableError) {
      return null;
    }
    throw error;
  }
};

export const tryGetSupabaseServerAnonClient = (): SupabaseClient<Database> | null => {
  try {
    return getSupabaseServerAnonClient();
  } catch (error) {
    if (error instanceof SupabaseClientUnavailableError) {
      return null;
    }
    throw error;
  }
};

export const resetSupabaseClients = () => {
  serviceRoleClient = null;
  serverAnonClient = null;
};
