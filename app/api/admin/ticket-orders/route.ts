import { NextResponse } from 'next/server';

import { writeAuditLog } from '@/app/api/admin/_lib/audit';
import { respondWithSupabaseNotConfigured } from '@/app/admin/api/_lib/http';
import { requireAdmin } from '@/app/api/admin/_lib/session';
import type { Tables } from '@/integrations/supabase/types';
import { AdminServiceClientUnavailableError, withAdminServiceClient } from '@/services/admin/service-client';

type MatchPreview = Pick<Tables<'matches'>, 'id' | 'opponent' | 'kickoff' | 'venue'>;

type TicketOrderRow = Tables<'ticket_orders'> & {
  users: Pick<Tables<'users'>, 'id' | 'phone' | 'name'> | null;
  matches: MatchPreview | null;
  payments: Array<Pick<Tables<'payments'>, 'id' | 'amount' | 'status' | 'created_at' | 'metadata'>> | null;
};

type SerializedPayment = {
  id: string;
  amount: number;
  status: Tables<'payments'>['status'] | null;
  createdAt: string | null;
  metadata: Tables<'payments'>['metadata'];
};

type SerializedOrder = {
  id: string;
  status: Tables<'ticket_orders'>['status'];
  total: number;
  createdAt: string | null;
  expiresAt: string | null;
  smsRef: string | null;
  user: { id: string; phoneMask: string | null; name: string | null } | null;
  match:
    | { id: string; opponent: string | null; kickoff: string | null; venue: string | null }
    | null;
  payments: SerializedPayment[];
};

const resolveMatchOpponent = (match: MatchPreview) => match.opponent ?? 'TBD opponent';

const parsePagination = (request: Request) => {
  const url = new URL(request.url);
  const page = Math.max(Number(url.searchParams.get('page') ?? '1'), 1);
  const pageSize = Math.min(Math.max(Number(url.searchParams.get('pageSize') ?? '20'), 1), 100);
  return { page, pageSize, status: url.searchParams.get('status') ?? undefined, search: url.searchParams.get('search') ?? undefined };
};

const serializeOrder = (row: TicketOrderRow): SerializedOrder => ({
  id: row.id,
  status: row.status,
  total: row.total,
  createdAt: row.created_at,
  expiresAt: row.expires_at ?? null,
  smsRef: row.sms_ref ?? null,
  user: row.users
    ? {
        id: row.users.id,
        phoneMask: row.users.phone ?? null,
        name: row.users.name ?? null,
      }
    : null,
  match: row.matches
    ? {
        id: row.matches.id,
        opponent: resolveMatchOpponent(row.matches),
        kickoff: row.matches.kickoff ?? null,
        venue: row.matches.venue ?? null,
      }
    : null,
  payments: (row.payments ?? []).map((payment) => ({
    id: payment.id,
    amount: payment.amount,
    status: payment.status,
    createdAt: payment.created_at,
    metadata: payment.metadata ?? null,
  })),
});

export const GET = async (request: Request) => {
  const result = await requireAdmin(request, { permission: 'orders.read' });
  if ('response' in result) return result.response;

  const { page, pageSize, status, search } = parsePagination(request);

  try {
    return await withAdminServiceClient(async (client) => {
      let query = client
        .from('ticket_orders')
        .select(
          'id, status, total, created_at, expires_at, sms_ref, users:users(id, phone, name), matches:matches(id, opponent, kickoff, venue), payments:payments!payments_ticket_order_id_fkey(id, amount, status, created_at, metadata)',
          { count: 'exact' },
        )
        .order('created_at', { ascending: false });

      const allowedStatuses = new Set(['pending', 'paid', 'cancelled']);
      const statusFilter =
        status && allowedStatuses.has(status) ? (status as 'pending' | 'paid' | 'cancelled') : undefined;
      if (statusFilter) {
        query = query.eq('status', statusFilter);
      }

      if (search) {
        const safe = search.replace(/,/g, '').trim();
        if (safe) {
          query = query.or(`id.eq.${safe},sms_ref.ilike.%${safe}%`);
        }
      }

      const start = (page - 1) * pageSize;
      const end = start + pageSize - 1;
      const { data, error, count } = await query.range(start, end);

      if (error) {
        return NextResponse.json({ message: error.message }, { status: 500 });
      }

      const payload = (data ?? []).map((entry) => serializeOrder(entry as unknown as TicketOrderRow));
      return NextResponse.json({
        status: 'ok',
        data: payload,
        meta: { page, pageSize, total: count ?? payload.length },
      });
    });
  } catch (error) {
    if (error instanceof AdminServiceClientUnavailableError) {
      return respondWithSupabaseNotConfigured();
    }
    console.error('admin.ticket-orders.fetch_failed', error);
    return NextResponse.json({ message: 'Failed to load ticket orders' }, { status: 500 });
  }
};

export const PATCH = async (request: Request) => {
  const result = await requireAdmin(request, { permission: 'orders.refund' });
  if ('response' in result) return result.response;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ message: 'Invalid payload' }, { status: 400 });
  }

  const orderId = typeof body.orderId === 'string' ? body.orderId : null;
  const allowed = new Set(['pending', 'paid', 'cancelled']);
  const status =
    typeof body.status === 'string' && allowed.has(body.status) ? (body.status as 'pending' | 'paid' | 'cancelled') : null;
  if (!orderId || !status) {
    return NextResponse.json({ message: 'orderId and status are required' }, { status: 400 });
  }

  try {
    return await withAdminServiceClient(async (client) => {
      const { data: before, error: fetchError } = await client
        .from('ticket_orders')
        .select('*')
        .eq('id', orderId)
        .maybeSingle();

      if (fetchError) {
        return NextResponse.json({ message: fetchError.message }, { status: 500 });
      }
      if (!before) {
        return NextResponse.json({ message: 'Order not found' }, { status: 404 });
      }

      const { data, error } = await client
        .from('ticket_orders')
        .update({ status })
        .eq('id', orderId)
        .select('id, status, total, created_at, expires_at, sms_ref')
        .maybeSingle();

      if (error || !data) {
        return NextResponse.json({ message: error?.message ?? 'Failed to update order' }, { status: 500 });
      }

      await writeAuditLog({
        adminId: result.context.user.id,
        action: 'ticket_order.update',
        entityType: 'ticket_order',
        entityId: orderId,
        before,
        after: data,
        request,
      });

      return NextResponse.json({ status: 'ok', data });
    });
  } catch (error) {
    if (error instanceof AdminServiceClientUnavailableError) {
      return respondWithSupabaseNotConfigured();
    }
    console.error('admin.ticket-orders.update_failed', error);
    return NextResponse.json({ message: 'Failed to update order' }, { status: 500 });
  }
};
