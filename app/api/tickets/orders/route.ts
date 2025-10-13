import { NextRequest } from 'next/server';

import { errorResponse, successResponse } from '../../_lib/responses';
import { getSupabase } from '../../_lib/supabase';
import { requireAuthUser } from '../../_lib/auth';

export async function GET(req: NextRequest) {
  const supabase = getSupabase();
  const auth = await requireAuthUser(req, supabase);
  if ('response' in auth) {
    return auth.response;
  }
  const userId = auth.user.id;
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
    `,
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) {
    return errorResponse(error.message, 500);
  }

  const refs = (orders ?? [])
    .map((order) => order.momo_ref)
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
      return {
        ...acc,
        [tx.ref]: [...list, { id: tx.id, status: tx.status, amount: tx.amount, created_at: tx.created_at }],
      };
    }, {} as typeof paymentsByRef);
  }

  const formatted = (orders ?? []).map((order) => ({
    id: order.id,
    status: order.status,
    total: order.total,
    createdAt: order.created_at,
    expiresAt: order.expires_at,
    ussdCode: order.ussd_code,
    smsRef: order.momo_ref,
    match: order.match
      ? {
          id: order.match.id,
          opponent: order.match.title,
          venue: order.match.venue,
          kickoff: order.match.date,
          homeTeam: order.match.home_team,
          awayTeam: order.match.away_team,
          competition: order.match.comp,
        }
      : null,
    items: (order.ticket_order_items ?? []).map((item) => ({
      id: item.id,
      zone: item.zone,
      quantity: item.quantity,
      price: item.price,
    })),
    payments: (paymentsByRef[order.momo_ref ?? ''] ?? []).map((payment) => ({
      id: payment.id,
      status: payment.status,
      amount: payment.amount,
      createdAt: payment.created_at,
    })),
  }));

  return successResponse(formatted);
}
