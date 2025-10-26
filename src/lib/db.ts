"use server";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { getSupabasePublishableKey, getSupabaseSecretKey, getSupabaseUrl } from '@/integrations/supabase/env';

const ensureServerEnvironment = () => {
  if (typeof window !== 'undefined') {
    throw new SupabaseClientAccessError('Supabase server clients are not available in the browser');
  }
};

export class SupabaseClientAccessError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SupabaseClientAccessError';
  }
}

export class SupabaseClientUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SupabaseClientUnavailableError';
  }
}

let serviceRoleClient: SupabaseClient<any> | null = null;
let serverAnonClient: SupabaseClient<any> | null = null;

export const createSupabaseServiceRoleClient = <Schema = any>(): SupabaseClient<Schema> | null => {
  ensureServerEnvironment();
  const url = getSupabaseUrl();
  const key = getSupabaseSecretKey();
  if (!url || !key) {
    return null;
  }
  return createClient<Schema>(url, key, { auth: { persistSession: false } });
};

export const createSupabaseServerAnonClient = <Schema = any>(): SupabaseClient<Schema> | null => {
  ensureServerEnvironment();
  const url = getSupabaseUrl();
  const key = getSupabasePublishableKey();
  if (!url || !key) {
    return null;
  }
  return createClient<Schema>(url, key, { auth: { persistSession: false } });
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
