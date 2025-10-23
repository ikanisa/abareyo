import { randomUUID } from 'crypto';
import { Buffer } from 'node:buffer';
import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@/integrations/supabase/types';
import {
  AdminServiceClientUnavailableError,
  withAdminServiceClient,
} from '@/services/admin/service-client';

export const MEDIA_BUCKET = 'media';

const DATA_URL_PATTERN = /^data:(.*?);base64,(.*)$/;

const sanitizeFileName = (fileName: string): string =>
  fileName.replace(/[^a-zA-Z0-9_.-]/g, '-');

const decodeDataUrl = (dataUrl: string) => {
  const match = DATA_URL_PATTERN.exec(dataUrl);
  if (!match) {
    throw new InvalidDataUrlError();
  }

  const [, contentType, base64] = match;
  const buffer = Buffer.from(base64, 'base64');

  return {
    contentType: contentType || 'application/octet-stream',
    buffer,
  };
};

const withStorageClient = async <T>(
  handler: (client: SupabaseClient<Database>) => Promise<T>,
  client?: SupabaseClient<Database>,
): Promise<T> => {
  if (client) {
    return handler(client);
  }

  try {
    return await withAdminServiceClient(handler);
  } catch (error) {
    if (error instanceof AdminServiceClientUnavailableError) {
      throw new StorageClientUnavailableError();
    }
    throw error;
  }
};

export class StorageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StorageError';
  }
}

export class InvalidDataUrlError extends StorageError {
  constructor(message = 'invalid_data_url') {
    super(message);
    this.name = 'InvalidDataUrlError';
  }
}

export class StorageUploadError extends StorageError {
  constructor(message = 'storage_upload_failed') {
    super(message);
    this.name = 'StorageUploadError';
  }
}

export class StorageClientUnavailableError extends StorageError {
  constructor(message = 'storage_client_unavailable') {
    super(message);
    this.name = 'StorageClientUnavailableError';
  }
}

type UploadDataUrlOptions = {
  bucket?: string;
  client?: SupabaseClient<Database>;
  objectPath?: string;
  upsert?: boolean;
};

type UploadDataUrlResult = {
  bucket: string;
  contentType: string;
  path: string;
  publicUrl: string;
};

export const uploadDataUrlObject = async (
  fileName: string,
  dataUrl: string,
  options?: UploadDataUrlOptions,
): Promise<UploadDataUrlResult> => {
  const bucket = options?.bucket ?? MEDIA_BUCKET;
  const safeName = sanitizeFileName(fileName);
  const objectPath = options?.objectPath ?? `${randomUUID()}-${Date.now()}-${safeName}`;
  const { buffer, contentType } = decodeDataUrl(dataUrl);

  return withStorageClient(
    async (client) => {
      const { error } = await client.storage.from(bucket).upload(objectPath, buffer, {
        contentType,
        upsert: options?.upsert ?? true,
      });

      if (error) {
        throw new StorageUploadError(error.message);
      }

      const { data } = client.storage.from(bucket).getPublicUrl(objectPath);
      return {
        bucket,
        contentType,
        path: objectPath,
        publicUrl: data.publicUrl,
      };
    },
    options?.client,
  );
};

type PublicUrlOptions = {
  bucket?: string;
  client?: SupabaseClient<Database>;
};

export const getPublicUrl = async (
  path: string,
  options?: PublicUrlOptions,
): Promise<string> => {
  const bucket = options?.bucket ?? MEDIA_BUCKET;
  return withStorageClient(
    async (client) => {
      const { data } = client.storage.from(bucket).getPublicUrl(path);
      return data.publicUrl;
    },
    options?.client,
  );
};

