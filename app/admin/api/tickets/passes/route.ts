import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

import { recordAudit } from '@/app/admin/api/_lib/audit';
import { AdminAuthError, requireAdminSession } from '@/app/admin/api/_lib/session';
import { getSupabaseAdmin } from '@/app/admin/api/_lib/supabase';

const PASS_SELECT = `
  id,
  order_id,
  zone,
  gate,
  state,
  qr_token_hash,
  created_at,
  order:ticket_orders(
    id,
    status,
    momo_ref,
    total,
    match_id,
    created_at,
    user:users(id, name, phone),
    match:matches(id, title, date, venue)
  )
`;

export async function GET(request: NextRequest) {
  try {
    await requireAdminSession();
    const supabase = getSupabaseAdmin();
    const { searchParams } = request.nextUrl;
    const matchId = searchParams.get('match_id') ?? undefined;
    const orderId = searchParams.get('order_id') ?? undefined;
    const state = searchParams.get('state') ?? undefined;
    const query = searchParams.get('q') ?? undefined;
    const limit = Math.min(Number.parseInt(searchParams.get('limit') ?? '60', 10), 200);
    const offset = Number.parseInt(searchParams.get('offset') ?? '0', 10);

    let builder = supabase
      .from('ticket_passes')
      .select(PASS_SELECT, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (matchId) {
      builder = builder.eq('order.match_id', matchId);
    }

    if (orderId) {
      builder = builder.eq('order_id', orderId);
    }

    if (state) {
      builder = builder.eq('state', state);
    }

    if (query) {
      const sanitized = query.replace(/'/g, "''");
      builder = builder.or([`zone.ilike.%${sanitized}%`, `gate.ilike.%${sanitized}%`, `id.ilike.%${sanitized}%`].join(','));
    }

    const { data, error, count } = await builder;
    if (error) {
      throw error;
    }

    return NextResponse.json({ passes: data ?? [], count: count ?? 0 });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error('Failed to load ticket passes', error);
    return NextResponse.json({ error: 'passes_fetch_failed' }, { status: 500 });
  }
}

type CreatePayload = {
  order_id?: string;
  zone?: string;
  gate?: string;
  state?: string;
};

export async function POST(request: NextRequest) {
  let payload: CreatePayload | null = null;

  try {
    const session = await requireAdminSession();
    const supabase = getSupabaseAdmin();

    payload = (await request.json().catch(() => null)) as CreatePayload | null;
    if (!payload?.order_id) {
      return NextResponse.json({ error: 'order_id_required' }, { status: 400 });
    }

    const { data: order, error: orderError } = await supabase
      .from('ticket_orders')
      .select('id, status, momo_ref, match_id')
      .eq('id', payload.order_id)
      .maybeSingle();

    if (orderError) {
      throw orderError;
    }

    if (!order) {
      return NextResponse.json({ error: 'order_not_found' }, { status: 404 });
    }

    const insert = {
      order_id: payload.order_id,
      zone: payload.zone ?? 'Blue',
      gate: payload.gate ?? 'Main',
      state: payload.state ?? 'active',
      qr_token_hash: randomUUID(),
    };

    const { data: created, error: insertError } = await supabase
      .from('ticket_passes')
      .insert(insert)
      .select(PASS_SELECT)
      .single();

    if (insertError) {
      throw insertError;
    }

    await recordAudit(supabase, {
      action: 'ticket_passes.insert',
      entityType: 'ticket_pass',
      entityId: created.id,
      before: null,
      after: created,
      userId: session.user.id,
      ip: session.ip,
      userAgent: session.userAgent,
    });

    return NextResponse.json({ pass: created });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error('Failed to create ticket pass', error, payload);
    return NextResponse.json({ error: 'pass_create_failed' }, { status: 500 });
  }
}
