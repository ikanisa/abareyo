import { NextRequest, NextResponse } from 'next/server';

import { AdminAuthError, requireAdminSession } from '@/app/admin/api/_lib/session';
import {
  requireSupabaseStorageBucket,
  SupabaseStorageUnavailableError,
} from '@/lib/storage';

const MEDIA_BUCKET = 'media';

const decodeDataUrl = (value: string) => {
  const match = /^data:(?<mime>[^;]+);base64,(?<data>.+)$/u.exec(value.trim());
  if (!match?.groups) {
    throw new Error('invalid_data_url');
  }

  const contentType = match.groups.mime || 'application/octet-stream';
  const bytes = Buffer.from(match.groups.data, 'base64');
  return { contentType, bytes };
};

const buildObjectPath = (fileName: string) => {
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '-');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `admin/${timestamp}-${safeName}`;
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

    const { contentType, bytes } = decodeDataUrl(payload.dataUrl);
    const objectPath = buildObjectPath(payload.fileName);
    const bucket = requireSupabaseStorageBucket(MEDIA_BUCKET);

    const { error } = await bucket.upload(objectPath, bytes, {
      contentType,
      upsert: true,
    });

    if (error) {
      console.error('Supabase upload failed', error, payload.fileName);
      return NextResponse.json({ error: 'upload_failed' }, { status: 500 });
    }

    const { data: publicUrl } = bucket.getPublicUrl(objectPath);
    return NextResponse.json({ url: publicUrl.publicUrl });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    if (error instanceof SupabaseStorageUnavailableError) {
      return NextResponse.json({ error: 'storage_unconfigured' }, { status: 503 });
    }

    if (error instanceof Error && error.message === 'invalid_data_url') {
      return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });
    }

    console.error('Failed to upload media asset', error, payload?.fileName);
    return NextResponse.json({ error: 'upload_failed' }, { status: 500 });
  }
}
