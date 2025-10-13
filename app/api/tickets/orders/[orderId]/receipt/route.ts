import { NextRequest } from 'next/server';

import { errorResponse, successResponse } from '@/app/_lib/responses';
import { getSupabase } from '@/app/_lib/supabase';

export async function GET(req: NextRequest, { params }: { params: { orderId?: string } }) {
  const userId = req.nextUrl.searchParams.get('userId');
  const orderId = params.orderId;
  if (!orderId) {
    return errorResponse('orderId is required');
  }
  if (!userId) {
    return errorResponse('userId is required');
  }

  const supabase = getSupabase();
  if (!supabase) {
    return successResponse(null);
  }

  const { data: order, error } = await supabase
    .from('ticket_orders')
    .select(
      `*,
      match:matches(id, title, venue, date, home_team, away_team, comp),
      ticket_order_items(id, zone, quantity, price),
      passes:tickets(id, zone, gate, state, updated_at, qr_token)
    `,
    )
    .eq('id', orderId)
    .eq('user_id', userId)
    .maybeSingle();
  if (error) {
    return errorResponse(error.message, 500);
  }
  if (!order) {
    return errorResponse('Order not found', 404);
  }

  let payments: { id: string; status: string; amount: number; createdAt: string }[] = [];
  if (order.momo_ref) {
    const { data: transactions, error: txError } = await supabase
      .from('transactions')
      .select('id, amount, status, created_at')
      .eq('ref', order.momo_ref);
    if (txError) {
      return errorResponse(txError.message, 500);
    }
    payments = (transactions ?? []).map((tx) => ({
      id: tx.id,
      status: tx.status,
      amount: tx.amount,
      createdAt: tx.created_at,
    }));
  }

  const response = {
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
    payments,
    passes: (order.passes ?? []).map((pass) => ({
      id: pass.id,
      zone: pass.zone,
      gate: pass.gate,
      state: pass.state,
      updatedAt: pass.updated_at,
      qrToken: pass.qr_token,
    })),
  };

  return successResponse(response);
}
