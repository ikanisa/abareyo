import { randomUUID } from 'crypto';
import { NextRequest } from 'next/server';
import { getSupabase } from '../_lib/supabase';
import { errorResponse, successResponse } from '../_lib/responses';

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId');
  if (!userId) {
    return errorResponse('userId is required');
  }
  const supabase = getSupabase();
  if (!supabase) {
    return successResponse([]);
  }
  const { data, error } = await supabase
    .from('tickets')
    .select('*, matches(*), ticket_orders(id, momo_ref, status)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) {
    return errorResponse(error.message, 500);
  }
  return successResponse(data ?? []);
}

export async function POST(req: NextRequest) {
  const supabase = getSupabase();
  if (!supabase) {
    return errorResponse('supabase_config_missing', 500);
  }
  const payload = (await req.json().catch(() => null)) as {
    userId?: string;
    matchId?: string;
    items?: { zone: 'VIP' | 'Regular' | 'Blue'; quantity: number; price: number; gate?: string }[];
    momoRef?: string;
    channel?: 'mtn' | 'airtel';
    paid?: boolean;
  } | null;
  if (!payload?.userId || !payload.matchId || !payload.items?.length) {
    return errorResponse('userId, matchId and at least one item are required');
  }

  const total = payload.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const momoRef = payload.momoRef ?? `MOMO-${Math.floor(Math.random() * 1_000_000)}`;
  const codeSeed = momoRef.replace(/[^0-9]/g, '').slice(-3).padStart(3, '0');
  const ussdBase = payload.channel === 'airtel' ? '*182*8*2*' : '*182*8*1*';
  const ussdCode = `${ussdBase}${codeSeed}#`;
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  const { data: order, error: orderError } = await supabase
    .from('ticket_orders')
    .insert({
      user_id: payload.userId,
      match_id: payload.matchId,
      total,
      momo_ref: momoRef,
      status: payload.paid ? 'paid' : 'pending',
      ussd_code: ussdCode,
      expires_at: expiresAt,
    })
    .select('*')
    .single();
  if (orderError) {
    return errorResponse(orderError.message, 500);
  }

  const itemRows = payload.items.map((item) => ({
    order_id: order.id,
    zone: item.zone,
    quantity: item.quantity,
    price: item.price,
  }));
  const { error: itemsError } = await supabase.from('ticket_order_items').insert(itemRows);
  if (itemsError) {
    return errorResponse(itemsError.message, 500);
  }

  const ticketRows = payload.items.flatMap((item) => {
    const gate = item.gate ?? (item.zone === 'VIP' ? 'A' : item.zone === 'Regular' ? 'C' : 'B');
    const state = payload.paid ? 'active' : 'pending';
    return Array.from({ length: item.quantity }).map(() => ({
      order_id: order.id,
      user_id: payload.userId,
      match_id: payload.matchId,
      zone: item.zone,
      price: item.price,
      momo_ref: momoRef,
      paid: Boolean(payload.paid),
      gate,
      state,
      qr_token: randomUUID(),
    }));
  });

  if (ticketRows.length > 0) {
    const { error: ticketError } = await supabase.from('tickets').insert(ticketRows);
    if (ticketError) {
      return errorResponse(ticketError.message, 500);
    }
  }

  if (payload.paid) {
    await supabase.from('transactions').insert({
      user_id: payload.userId,
      amount: total,
      ref: momoRef,
      type: 'purchase',
      status: 'confirmed',
    });
    await supabase.rpc('increment_user_points', {
      p_user_id: payload.userId,
      p_points_delta: total,
    });
  }

  return successResponse(
    {
      orderId: order.id,
      total,
      ussdCode,
      expiresAt,
      momoRef,
      paymentId: null,
    },
    201,
  );
}
