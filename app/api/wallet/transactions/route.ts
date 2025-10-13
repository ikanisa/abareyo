import { NextRequest } from 'next/server';

import { errorResponse, successResponse } from '@/app/_lib/responses';
import { getSupabase } from '@/app/_lib/supabase';

const KIND_MAP: Record<string, 'ticket' | 'membership' | 'shop' | 'donation'> = {
  purchase: 'ticket',
  deposit: 'donation',
  refund: 'ticket',
  reward: 'ticket',
};

export async function GET(req: NextRequest) {
  const supabase = getSupabase();
  if (!supabase) {
    return successResponse([]);
  }
  const userId = req.nextUrl.searchParams.get('userId');
  if (!userId) {
    return errorResponse('userId is required');
  }

  const { data: transactions, error } = await supabase
    .from('transactions')
    .select('id, amount, status, type, created_at, ref')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) {
    return errorResponse(error.message, 500);
  }

  const refs = (transactions ?? []).map((tx) => tx.ref).filter((ref): ref is string => Boolean(ref));
  let ticketOrderMap: Record<string, string> = {};
  let shopOrderMap: Record<string, string> = {};
  if (refs.length > 0) {
    const [ticketOrdersResult, shopOrdersResult] = await Promise.all([
      supabase.from('ticket_orders').select('id, momo_ref').in('momo_ref', refs),
      supabase.from('orders').select('id, momo_ref').in('momo_ref', refs),
    ]);
    if (ticketOrdersResult.error) {
      return errorResponse(ticketOrdersResult.error.message, 500);
    }
    if (shopOrdersResult.error) {
      return errorResponse(shopOrdersResult.error.message, 500);
    }
    ticketOrderMap = (ticketOrdersResult.data ?? []).reduce((acc, order) => {
      if (!order.momo_ref) return acc;
      return { ...acc, [order.momo_ref]: order.id };
    }, {} as Record<string, string>);
    shopOrderMap = (shopOrdersResult.data ?? []).reduce((acc, order) => {
      if (!order.momo_ref) return acc;
      return { ...acc, [order.momo_ref]: order.id };
    }, {} as Record<string, string>);
  }

  const formatted = (transactions ?? []).map((tx) => ({
    id: tx.id,
    amount: tx.amount,
    currency: 'RWF',
    status: tx.status,
    kind: KIND_MAP[tx.type] ?? 'ticket',
    createdAt: tx.created_at,
    orderId: ticketOrderMap[tx.ref ?? ''] ?? null,
    shopOrderId: shopOrderMap[tx.ref ?? ''] ?? null,
    reference: tx.ref,
  }));

  return successResponse(formatted);
}
