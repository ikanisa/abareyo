import type { SupabaseClient } from '@supabase/supabase-js';

import {
  SupabaseClientUnavailableError,
  tryGetSupabaseServiceRoleClient,
  getSupabaseServiceRoleClient,
} from './db';

export class SupabaseStorageUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SupabaseStorageUnavailableError';
  }
}

type ServiceClient = SupabaseClient;
type StorageApi = NonNullable<ServiceClient['storage']>;
type StorageBucketApi = ReturnType<StorageApi['from']>;

const getStorageClient = (): StorageApi | null => {
  const client = tryGetSupabaseServiceRoleClient();
  return client?.storage ?? null;
};

export const getSupabaseStorageClient = (): StorageApi | null => getStorageClient();

export const requireSupabaseStorageClient = (): StorageApi => {
  const storage = getStorageClient();
  if (!storage) {
    throw new SupabaseStorageUnavailableError('Supabase storage is not configured');
  }
  return storage;
};

export const getSupabaseStorageBucket = (bucket: string): StorageBucketApi | null => {
  const storage = getStorageClient();
  return storage ? storage.from(bucket) : null;
};

export const requireSupabaseStorageBucket = (bucket: string): StorageBucketApi => {
  const storage = getSupabaseStorageBucket(bucket);
  if (!storage) {
    try {
      getSupabaseServiceRoleClient();
    } catch (error) {
      if (error instanceof SupabaseClientUnavailableError) {
        throw new SupabaseStorageUnavailableError('Supabase storage credentials are not configured');
      }
      throw error;
    }
    throw new SupabaseStorageUnavailableError(`Supabase storage bucket '${bucket}' is not available`);
  }
  return storage;
};
