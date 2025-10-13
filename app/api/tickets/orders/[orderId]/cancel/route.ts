import { NextRequest } from 'next/server';

import { errorResponse, successResponse } from '@/app/_lib/responses';
import { getSupabase } from '@/app/_lib/supabase';

export async function POST(req: NextRequest, { params }: { params: { orderId?: string } }) {
  const supabase = getSupabase();
  if (!supabase) {
    return errorResponse('supabase_config_missing', 500);
  }
  const orderId = params.orderId;
  if (!orderId) {
    return errorResponse('orderId is required');
  }
  const payload = (await req.json().catch(() => null)) as { userId?: string } | null;
  if (!payload?.userId) {
    return errorResponse('userId is required');
  }

  const { data: order, error } = await supabase
    .from('ticket_orders')
    .update({ status: 'cancelled' })
    .eq('id', orderId)
    .eq('user_id', payload.userId)
    .select('id, user_id, momo_ref')
    .single();
  if (error) {
    return errorResponse(error.message, 500);
  }

  await supabase
    .from('tickets')
    .update({ state: 'cancelled' })
    .eq('order_id', order.id);

  return successResponse({ id: order.id, status: 'cancelled' });
}
