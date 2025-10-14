import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const createSupabaseClient = () => {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
};

type PromotionRow = {
  id: string;
  title: string;
  description: string | null;
  discount_pct: number | null;
  product_ids: string[];
  starts_at: string;
  ends_at: string;
  created_at: string;
};

type PromotionResponse = PromotionRow & { active: boolean };

type PromotionPayload = {
  id?: string;
  title?: string;
  description?: string | null;
  discount_pct?: number;
  product_ids?: string[];
  starts_at?: string;
  ends_at?: string;
  adminId?: string | null;
  admin_id?: string | null;
};

async function audit(action: string, before: PromotionRow | null, after: PromotionRow | null, adminId?: string | null) {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  if (!backendUrl) {
    return;
  }
  try {
    const endpoint = `${backendUrl.replace(/\/$/, '')}/admin/api/audit`;
    await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action,
        entity_type: 'shop_promotion',
        entity_id: after?.id ?? before?.id ?? null,
        before,
        after,
        admin_user_id: adminId ?? null,
      }),
    });
  } catch {
    // audit fan-out is best effort
  }
}

export async function GET() {
  const db = createSupabaseClient();
  if (!db) {
    return NextResponse.json({ error: 'supabase_not_configured' }, { status: 500 });
  }
  const now = new Date().toISOString();
  const { data, error } = await db
    .from('shop_promotions')
    .select('*')
    .order('starts_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const promotions: PromotionResponse[] = (data ?? []).map((row) => ({
    ...row,
    active: row.starts_at <= now && row.ends_at >= now,
  }));

  return NextResponse.json({ promotions });
}

export async function POST(request: Request) {
  const db = createSupabaseClient();
  if (!db) {
    return NextResponse.json({ error: 'supabase_not_configured' }, { status: 500 });
  }
  let payload: PromotionPayload;
  try {
    payload = (await request.json()) as PromotionPayload;
  } catch {
    return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });
  }

  const adminId = payload.adminId ?? payload.admin_id ?? null;

  const insertPayload = {
    title: payload.title ?? '',
    description: payload.description ?? null,
    discount_pct: payload.discount_pct ?? null,
    product_ids: payload.product_ids ?? [],
    starts_at: payload.starts_at ?? new Date().toISOString(),
    ends_at: payload.ends_at ?? new Date(Date.now() + 86_400_000).toISOString(),
  };

  if (!insertPayload.title.trim()) {
    return NextResponse.json({ error: 'title_required' }, { status: 400 });
  }

  const { data, error } = await db
    .from('shop_promotions')
    .insert(insertPayload)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await audit('promotion_create', null, data as PromotionRow, adminId);

  return NextResponse.json({ ok: true, promotion: data });
}

export async function PATCH(request: Request) {
  const db = createSupabaseClient();
  if (!db) {
    return NextResponse.json({ error: 'supabase_not_configured' }, { status: 500 });
  }
  let payload: PromotionPayload;
  try {
    payload = (await request.json()) as PromotionPayload;
  } catch {
    return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });
  }

  if (!payload.id) {
    return NextResponse.json({ error: 'missing_id' }, { status: 400 });
  }

  const adminId = payload.adminId ?? payload.admin_id ?? null;

  const { data: before, error: beforeError } = await db
    .from('shop_promotions')
    .select('*')
    .eq('id', payload.id)
    .maybeSingle();

  if (beforeError) {
    return NextResponse.json({ error: beforeError.message }, { status: 500 });
  }

  if (!before) {
    return NextResponse.json({ error: 'promotion_not_found' }, { status: 404 });
  }

  const updates = { ...payload };
  delete (updates as Record<string, unknown>).id;
  delete (updates as Record<string, unknown>).adminId;
  delete (updates as Record<string, unknown>).admin_id;

  const { data, error } = await db
    .from('shop_promotions')
    .update(updates)
    .eq('id', payload.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await audit('promotion_update', before as PromotionRow, data as PromotionRow, adminId);

  return NextResponse.json({ ok: true, promotion: data });
}

export async function DELETE(request: Request) {
  const db = createSupabaseClient();
  if (!db) {
    return NextResponse.json({ error: 'supabase_not_configured' }, { status: 500 });
  }
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'missing_id' }, { status: 400 });
  }

  const { data: before, error: beforeError } = await db
    .from('shop_promotions')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (beforeError) {
    return NextResponse.json({ error: beforeError.message }, { status: 500 });
  }

  if (!before) {
    return NextResponse.json({ error: 'promotion_not_found' }, { status: 404 });
  }

  const { error } = await db.from('shop_promotions').delete().eq('id', id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await audit('promotion_delete', before as PromotionRow, null, null);

  return NextResponse.json({ ok: true });
}
