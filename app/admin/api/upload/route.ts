import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

import { AdminAuthError, requireAdminSession } from '@/app/admin/api/_lib/session';
import { getSupabaseAdmin } from '@/app/admin/api/_lib/supabase';

const MEDIA_BUCKET = 'media';

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

    const match = payload.dataUrl.match(/^data:(.*?);base64,(.*)$/);
    if (!match) {
      return NextResponse.json({ error: 'invalid_data_url' }, { status: 400 });
    }

    const [, contentType, base64] = match;
    const bytes = Buffer.from(base64, 'base64');
    const safeName = payload.fileName.replace(/[^a-zA-Z0-9_.-]/g, '-');
    const objectPath = `${randomUUID()}-${Date.now()}-${safeName}`;

    const { error } = await supabase.storage
      .from(MEDIA_BUCKET)
      .upload(objectPath, bytes, { contentType: contentType || 'application/octet-stream', upsert: true });

    if (error) {
      throw error;
    }

    const { data: publicUrl } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(objectPath);
    return NextResponse.json({ url: publicUrl.publicUrl });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error('Failed to upload media asset', error, payload?.fileName);
    return NextResponse.json({ error: 'upload_failed' }, { status: 500 });
  }
}
