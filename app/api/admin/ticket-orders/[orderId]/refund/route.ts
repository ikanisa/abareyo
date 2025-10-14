import { NextResponse } from 'next/server';

import { writeAuditLog } from '@/app/api/admin/_lib/audit';
import { getServiceClient } from '@/app/api/admin/_lib/db';
import { requireAdmin } from '@/app/api/admin/_lib/session';

export const POST = async (request: Request, context: { params: { orderId: string } }) => {
  const result = await requireAdmin(request, { permission: 'orders.refund' });
  if ('response' in result) return result.response;

  const client = getServiceClient();
  const { data: before, error: beforeError } = await client
    .from('ticket_orders')
    .select('*')
    .eq('id', context.params.orderId)
    .maybeSingle();

  if (beforeError) {
    return NextResponse.json({ message: beforeError.message }, { status: 500 });
  }
  if (!before) {
    return NextResponse.json({ message: 'Order not found' }, { status: 404 });
  }

  const { data, error } = await client
    .from('ticket_orders')
    .update({ status: 'cancelled' })
    .eq('id', context.params.orderId)
    .select('id, status, total, created_at, expires_at, sms_ref')
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ message: error?.message ?? 'Failed to refund order' }, { status: 500 });
  }

  await client.from('ticket_passes').update({ state: 'refunded' }).eq('order_id', context.params.orderId);
  await client
    .from('payments')
    .update({ status: 'failed', metadata: { refund_reason: 'manual_refund' } })
    .eq('ticket_order_id', context.params.orderId);

  await writeAuditLog({
    adminId: result.context.user.id,
    action: 'ticket_order.refund',
    entityType: 'ticket_order',
    entityId: context.params.orderId,
    before,
    after: data,
    request,
  });

  return NextResponse.json({ status: 'ok', data });
};
