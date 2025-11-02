"use server";
/* eslint-disable @typescript-eslint/no-explicit-any */

import type { SupabaseClient } from '@supabase/supabase-js';

import { createServerClient, SupabaseConfigurationError } from '@rayon/api/supabase';

import { SupabaseClientAccessError, SupabaseClientUnavailableError } from './db-errors';

const ensureServerEnvironment = () => {
  if (typeof window !== 'undefined') {
    throw new SupabaseClientAccessError('Supabase server clients are not available in the browser');
  }
};

// Re-export error classes for backward compatibility
export { SupabaseClientAccessError, SupabaseClientUnavailableError };

let serviceRoleClient: SupabaseClient<any> | null = null;
let serverAnonClient: SupabaseClient<any> | null = null;

export const createSupabaseServiceRoleClient = <Schema = any>(): SupabaseClient<Schema> | null => {
  ensureServerEnvironment();
  try {
    return createServerClient({ accessType: 'service_role' }) as SupabaseClient<Schema>;
  } catch (error) {
    if (error instanceof SupabaseConfigurationError) {
      return null;
    }
    throw error;
  }
};

export const createSupabaseServerAnonClient = <Schema = any>(): SupabaseClient<Schema> | null => {
  ensureServerEnvironment();
  try {
    return createServerClient({ accessType: 'anon' }) as SupabaseClient<Schema>;
  } catch (error) {
    if (error instanceof SupabaseConfigurationError) {
      return null;
    }
    throw error;
  }
};

export const getSupabaseServiceRoleClient = <Schema = any>(): SupabaseClient<Schema> => {
  if (serviceRoleClient) {
    return serviceRoleClient as SupabaseClient<Schema>;
  }
  const client = createSupabaseServiceRoleClient<Schema>();
  if (!client) {
    throw new SupabaseClientUnavailableError('Supabase service role credentials are not configured');
  }
  serviceRoleClient = client as SupabaseClient<any>;
  return client;
};

export const getSupabaseServerAnonClient = <Schema = any>(): SupabaseClient<Schema> => {
  if (serverAnonClient) {
    return serverAnonClient as SupabaseClient<Schema>;
  }
  const client = createSupabaseServerAnonClient<Schema>();
  if (!client) {
    throw new SupabaseClientUnavailableError('Supabase anon credentials are not configured');
  }
  serverAnonClient = client as SupabaseClient<any>;
  return client;
};

export const tryGetSupabaseServiceRoleClient = <Schema = any>(): SupabaseClient<Schema> | null => {
  try {
    return getSupabaseServiceRoleClient<Schema>();
  } catch (error) {
    if (error instanceof SupabaseClientUnavailableError) {
      return null;
    }
    throw error;
  }
};

export const tryGetSupabaseServerAnonClient = <Schema = any>(): SupabaseClient<Schema> | null => {
  try {
    return getSupabaseServerAnonClient<Schema>();
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
