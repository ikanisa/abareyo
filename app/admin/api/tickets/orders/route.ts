import { NextRequest, NextResponse } from 'next/server';

import { recordAudit } from '@/app/admin/api/_lib/audit';
import { AdminAuthError, requireAdminSession } from '@/app/admin/api/_lib/session';
import { getSupabaseAdmin } from '@/app/admin/api/_lib/supabase';

const ORDER_SELECT = `
  id,
  user_id,
  match_id,
  total,
  status,
  momo_ref,
  ussd_code,
  created_at,
  expires_at,
  user:users(id, name, phone),
  match:matches(id, title, date, venue, comp, home_team, away_team),
  passes:ticket_passes(id, gate, zone, state, created_at),
  payments:payments(id, amount, status, created_at)
`;

export async function GET(request: NextRequest) {
  try {
    await requireAdminSession();
    const supabase = getSupabaseAdmin();
    const { searchParams } = request.nextUrl;
    const status = searchParams.get('status') ?? undefined;
    const matchId = searchParams.get('match_id') ?? undefined;
    const query = searchParams.get('q') ?? undefined;
    const limit = Math.min(Number.parseInt(searchParams.get('limit') ?? '50', 10), 200);
    const offset = Number.parseInt(searchParams.get('offset') ?? '0', 10);

    let builder = supabase
      .from('ticket_orders')
      .select(ORDER_SELECT, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      builder = builder.eq('status', status);
    }

    if (matchId) {
      builder = builder.eq('match_id', matchId);
    }

    if (query) {
      const sanitized = query.replace(/'/g, "''");
      builder = builder.or(
        [
          `id.ilike.%${sanitized}%`,
          `momo_ref.ilike.%${sanitized}%`,
          `ussd_code.ilike.%${sanitized}%`,
        ].join(','),
      );
    }

    const { data, error, count } = await builder;

    if (error) {
      throw error;
    }

    return NextResponse.json({ orders: data ?? [], count: count ?? 0 });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error('Failed to fetch ticket orders', error);
    return NextResponse.json({ error: 'orders_fetch_failed' }, { status: 500 });
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
    if (!payload || !payload.id) {
      return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });
    }

    const { data: existing, error: fetchError } = await supabase
      .from('ticket_orders')
      .select(ORDER_SELECT)
      .eq('id', payload.id)
      .maybeSingle();

    if (fetchError) {
      throw fetchError;
    }

    if (!existing) {
      return NextResponse.json({ error: 'order_not_found' }, { status: 404 });
    }

    const updates: Record<string, unknown> = {};
    if (payload.status) {
      updates.status = payload.status;
    }
    if (payload.momo_ref !== undefined) {
      updates.momo_ref = payload.momo_ref;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'no_changes_provided' }, { status: 400 });
    }

    const { data: updated, error: updateError } = await supabase
      .from('ticket_orders')
      .update(updates)
      .eq('id', payload.id)
      .select(ORDER_SELECT)
      .single();

    if (updateError) {
      throw updateError;
    }

    await recordAudit(supabase, {
      action: 'ticket_orders.update',
      entityType: 'ticket_order',
      entityId: payload.id,
      before: existing,
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

    console.error('Failed to update ticket order', error, payload);
    return NextResponse.json({ error: 'order_update_failed' }, { status: 500 });
  }
}
