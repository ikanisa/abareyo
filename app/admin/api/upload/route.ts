import { NextRequest, NextResponse } from 'next/server';

import { AdminAuthError, requireAdminSession } from '@/app/admin/api/_lib/session';
import { getSupabaseAdmin } from '@/app/admin/api/_lib/supabase';
import {
  InvalidDataUrlError,
  MEDIA_BUCKET,
  StorageClientUnavailableError,
  StorageUploadError,
  uploadDataUrlObject,
} from '@/lib/storage';

export async function POST(request: NextRequest) {
  type UploadPayload = { fileName?: string; dataUrl?: string };
  let payload: UploadPayload | null = null;

  try {
    await requireAdminSession();
    const supabase = getSupabaseAdmin();

    payload = (await request.json().catch(() => null)) as UploadPayload | null;
    if (!payload?.fileName || !payload.dataUrl) {
      return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });
    }

    const { publicUrl } = await uploadDataUrlObject(payload.fileName, payload.dataUrl, {
      bucket: MEDIA_BUCKET,
      client: supabase,
    });

    return NextResponse.json({ url: publicUrl });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    if (error instanceof InvalidDataUrlError) {
      return NextResponse.json({ error: 'invalid_data_url' }, { status: 400 });
    }

    if (error instanceof StorageClientUnavailableError) {
      return NextResponse.json({ error: 'supabase_not_configured' }, { status: 503 });
    }

    if (error instanceof StorageUploadError) {
      console.error('Failed to upload media asset', error, payload?.fileName);
      return NextResponse.json({ error: 'upload_failed' }, { status: 500 });
    }

    console.error('Failed to upload media asset', error, payload?.fileName);
    return NextResponse.json({ error: 'upload_failed' }, { status: 500 });
  }
}
