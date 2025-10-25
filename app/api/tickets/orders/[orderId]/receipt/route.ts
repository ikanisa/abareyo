import { NextRequest } from 'next/server';

import { errorResponse, successResponse } from '@/app/_lib/responses';
import { getSupabase } from '@/app/_lib/supabase';

type TicketOrderItemRow = {
  id: string;
  zone: string;
  quantity: number;
  price: number;
};

type TicketPassRow = {
  id: string;
  zone: string;
  gate: string | null;
  state: string;
  updated_at: string;
  qr_token: string | null;
};

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
    payments,
    passes: (Array.isArray(order.passes) ? order.passes : [])
      .filter((pass: unknown): pass is TicketPassRow =>
        pass !== null &&
        typeof pass === 'object' &&
        'id' in pass &&
        'zone' in pass &&
        'gate' in pass &&
        'state' in pass &&
        'updated_at' in pass &&
        'qr_token' in pass,
      )
      .map((pass: TicketPassRow) => ({
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
