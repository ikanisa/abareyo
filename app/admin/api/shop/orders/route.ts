import { NextRequest, NextResponse } from 'next/server';

import { recordAudit } from '@/app/admin/api/_lib/audit';
import { AdminAuthError, requireAdminSession } from '@/app/admin/api/_lib/session';
import { getSupabaseAdmin } from '@/app/admin/api/_lib/supabase';

const ORDER_SELECT = `
  id,
  status,
  total,
  momo_ref,
  created_at,
  user:users(id, name, phone),
  items:order_items(id, qty, price, product:shop_products(id, name, image_url)),
  payments:payments(id, amount, status, created_at)
`;

export async function GET(request: NextRequest) {
  try {
    await requireAdminSession();
    const supabase = getSupabaseAdmin();
    const { searchParams } = request.nextUrl;
    const status = searchParams.get('status') ?? undefined;
    const query = searchParams.get('q') ?? undefined;
    const limit = Math.min(Number.parseInt(searchParams.get('limit') ?? '50', 10), 200);
    const offset = Number.parseInt(searchParams.get('offset') ?? '0', 10);

    let builder = supabase
      .from('orders')
      .select(ORDER_SELECT, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      builder = builder.eq('status', status);
    }

    if (query) {
      const sanitized = query.replace(/'/g, "''");
      builder = builder.or([
        `id.ilike.%${sanitized}%`,
        `momo_ref.ilike.%${sanitized}%`,
      ].join(','));
    }

    const { data, error, count } = await builder;
    if (error) throw error;

    return NextResponse.json({ orders: data ?? [], count: count ?? 0 });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error('Failed to load shop orders', error);
    return NextResponse.json({ error: 'shop_orders_fetch_failed' }, { status: 500 });
  }
}

type UpdatePayload = {
  id?: string;
  status?: string;
  momo_ref?: string | null;
};

export async function PATCH(request: NextRequest) {
  let payload: UpdatePayload | null = null;

  try {
    const session = await requireAdminSession();
    const supabase = getSupabaseAdmin();

    payload = (await request.json().catch(() => null)) as UpdatePayload | null;
    if (!payload?.id) {
      return NextResponse.json({ error: 'id_required' }, { status: 400 });
    }

    const { data: before, error: beforeError } = await supabase
      .from('orders')
      .select(ORDER_SELECT)
      .eq('id', payload.id)
      .maybeSingle();

    if (beforeError) throw beforeError;
    if (!before) return NextResponse.json({ error: 'shop_order_not_found' }, { status: 404 });

    const updates: Record<string, unknown> = {};
    if (payload.status) updates.status = payload.status;
    if (payload.momo_ref !== undefined) updates.momo_ref = payload.momo_ref;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'no_changes_provided' }, { status: 400 });
    }

    const { data: updated, error: updateError } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', payload.id)
      .select(ORDER_SELECT)
      .single();

    if (updateError) throw updateError;

    await recordAudit(supabase, {
      action: 'orders.update',
      entityType: 'shop_order',
      entityId: payload.id,
      before,
      after: updated,
      userId: session.user.id,
      ip: session.ip,
      userAgent: session.userAgent,
    });

    return NextResponse.json({ order: updated });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error('Failed to update shop order', error, payload);
    return NextResponse.json({ error: 'shop_order_update_failed' }, { status: 500 });
  }
}
