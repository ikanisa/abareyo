import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

import { AdminAuthError, requireAdminSession } from '@/app/admin/api/_lib/session';
import { requireSupabaseStorageBucket, SupabaseStorageUnavailableError } from '@/lib/storage';

const MEDIA_BUCKET = 'media';

export async function POST(request: NextRequest) {
  type UploadPayload = { fileName?: string; dataUrl?: string };
  let payload: UploadPayload | null = null;

  try {
    await requireAdminSession();

    payload = (await request.json().catch(() => null)) as UploadPayload | null;
    if (!payload?.fileName || !payload.dataUrl) {
      return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });
    }

    const match = payload.dataUrl.match(/^data:(.*?);base64,(.*)$/);
    if (!match) {
      return NextResponse.json({ error: 'invalid_data_url' }, { status: 400 });
    }

    const [, contentType, base64] = match;
    const bytes = Buffer.from(base64, 'base64');
    const safeName = payload.fileName.replace(/[^a-zA-Z0-9_.-]/g, '-');
    const objectPath = `${randomUUID()}-${Date.now()}-${safeName}`;

    const bucket = requireSupabaseStorageBucket(MEDIA_BUCKET);

    const { error } = await bucket.upload(objectPath, bytes, {
      contentType: contentType || 'application/octet-stream',
      upsert: true,
    });

    if (error) {
      throw error;
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

    console.error('Failed to upload media asset', error, payload?.fileName);
    return NextResponse.json({ error: 'upload_failed' }, { status: 500 });
  }
}
