import { NextRequest } from 'next/server';

import { errorResponse, successResponse } from '@/app/_lib/responses';
import { getSupabase } from '@/app/_lib/supabase';
import { requireAuthUser } from '@/app/_lib/auth';

type TicketOrderItemRow = {
  id: string;
  zone: string;
  quantity: number;
  price: number;
};

export async function GET(req: NextRequest) {
  const supabase = getSupabase();
  if (!supabase) {
    // Soft fallback for local/dev without Supabase wiring
    return successResponse([]);
  }

  // Require the caller to be the authenticated user
  const auth = await requireAuthUser(req, supabase);
  if ('response' in auth) {
    return auth.response; // e.g., 401/403 from the helper
  }
  const userId = auth.user.id;

  // Optional ?userId must match the authenticated user
  const requestedUserId = req.nextUrl.searchParams.get('userId');
  if (requestedUserId && requestedUserId !== userId) {
    return errorResponse('Forbidden', 403);
  }

  const { data: orders, error } = await supabase
    .from('ticket_orders')
    .select(
      `*,
       match:matches(id, title, venue, date, home_team, away_team, comp),
       ticket_order_items(id, zone, quantity, price)
      `
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    return errorResponse(error.message, 500);
  }

  // Collect momo_ref values to cross-reference payments
  const refs = (orders ?? [])
    .map((o) => o.momo_ref)
    .filter((ref): ref is string => Boolean(ref));

  let paymentsByRef: Record<string, { id: string; status: string; amount: number; created_at: string }[]> = {};
  if (refs.length > 0) {
    const { data: transactions, error: txError } = await supabase
      .from('transactions')
      .select('id, amount, status, created_at, ref')
      .in('ref', refs);
    if (txError) {
      return errorResponse(txError.message, 500);
    }
    paymentsByRef = (transactions ?? []).reduce((acc, tx) => {
      if (!tx.ref) return acc;
      const list = acc[tx.ref] ?? [];
      acc[tx.ref] = [...list, { id: tx.id, status: tx.status, amount: tx.amount, created_at: tx.created_at }];
      return acc;
    }, {} as typeof paymentsByRef);
  }

  const formatted = (orders ?? []).map((order) => ({
    id: order.id,
    status: order.status,
    total: order.total,
    createdAt: order.created_at,
    expiresAt: order.expires_at,
    ussdCode: order.ussd_code,
    smsRef: order.momo_ref, // keeping existing field name used by UI
    match: order.match
      ? {
          id: order.match.id,
          opponent: order.match.title,
          venue: order.match.venue,
          kickoff: order.match.date, // API exposes `date`; UI treats as kickoff
          homeTeam: order.match.home_team,
          awayTeam: order.match.away_team,
          competition: order.match.comp,
        }
      : null,
    items: (Array.isArray(order.ticket_order_items) ? order.ticket_order_items : [])
      .filter((item: unknown): item is TicketOrderItemRow =>
        item !== null &&
        typeof item === 'object' &&
        'id' in item &&
        'zone' in item &&
        'quantity' in item &&
        'price' in item,
      )
      .map((item: TicketOrderItemRow) => ({
        id: item.id,
        zone: item.zone,
        quantity: item.quantity,
        price: item.price,
      })),
    payments: (paymentsByRef[order.momo_ref ?? ''] ?? []).map((p) => ({
      id: p.id,
      status: p.status,
      amount: p.amount,
      createdAt: p.created_at,
    })),
  }));

  return successResponse(formatted);
}
