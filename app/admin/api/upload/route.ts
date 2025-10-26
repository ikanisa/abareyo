import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';

import { AdminAuthError, requireAdminSession } from '@/app/admin/api/_lib/session';
import { requireSupabaseStorageBucket, SupabaseStorageUnavailableError } from '@/lib/storage';

const MEDIA_BUCKET = 'media';
const DATA_URL_REGEX = /^data:(?<mime>[\w/+.-]+);base64,(?<data>[a-zA-Z0-9+/=]+)$/;

class InvalidDataUrlError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidDataUrlError';
  }
}

const parseDataUrl = (value: string) => {
  const match = DATA_URL_REGEX.exec(value.trim());
  if (!match?.groups?.data) {
    throw new InvalidDataUrlError('Malformed data URL');
  }

  const contentType = match.groups.mime || 'application/octet-stream';
  const bytes = Buffer.from(match.groups.data, 'base64');
  if (!bytes.length) {
    throw new InvalidDataUrlError('Empty data payload');
  }

  return { bytes, contentType };
};

const sanitizeFileName = (fileName: string) =>
  fileName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'asset';

const buildObjectPath = (fileName: string) => {
  const safeName = sanitizeFileName(fileName);
  return `admin/${randomUUID()}-${safeName}`;
};

export async function POST(request: NextRequest) {
  type UploadPayload = { fileName?: string; dataUrl?: string };
  let payload: UploadPayload | null = null;

  try {
    await requireAdminSession();

    payload = (await request.json().catch(() => null)) as UploadPayload | null;
    if (!payload?.fileName || !payload.dataUrl) {
      return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });
    }

    const bucket = requireSupabaseStorageBucket(MEDIA_BUCKET);
    const { bytes, contentType } = parseDataUrl(payload.dataUrl);
    const objectPath = buildObjectPath(payload.fileName);

    const { error: uploadError } = await bucket.upload(objectPath, bytes, {
      contentType,
      upsert: true,
    });

    if (uploadError) {
      console.error('Supabase storage upload failed', uploadError, payload.fileName);
      return NextResponse.json({ error: 'upload_failed' }, { status: 500 });
    }

    const { data } = bucket.getPublicUrl(objectPath);
    if (!data?.publicUrl) {
      console.error('Supabase storage public URL unavailable', objectPath);
      return NextResponse.json({ error: 'upload_failed' }, { status: 500 });
    }

    return NextResponse.json({ url: data.publicUrl });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    if (error instanceof InvalidDataUrlError) {
      return NextResponse.json({ error: 'invalid_data_url' }, { status: 400 });
    }

    if (error instanceof SupabaseStorageUnavailableError) {
      return NextResponse.json({ error: 'storage_unconfigured' }, { status: 503 });
    }

    console.error('Failed to upload media asset', error, payload?.fileName);
    return NextResponse.json({ error: 'upload_failed' }, { status: 500 });
  }
}
