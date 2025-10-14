import { NextResponse } from 'next/server';

import { writeAuditLog } from '@/app/api/admin/_lib/audit';
import { getServiceClient } from '@/app/api/admin/_lib/db';
import { requireAdmin } from '@/app/api/admin/_lib/session';

export const POST = async (request: Request) => {
  const result = await requireAdmin(request, { permission: 'sms.attach' });
  if ('response' in result) return result.response;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ message: 'Invalid payload' }, { status: 400 });
  }

  const smsId = typeof body.smsId === 'string' ? body.smsId : null;
  const paymentId = typeof body.paymentId === 'string' ? body.paymentId : null;

  if (!smsId || !paymentId) {
    return NextResponse.json({ message: 'smsId and paymentId are required' }, { status: 400 });
  }

  const client = getServiceClient();
  const { data: sms, error: smsError } = await client.from('sms_parsed').select('*').eq('id', smsId).maybeSingle();
  if (smsError) {
    return NextResponse.json({ message: smsError.message }, { status: 500 });
  }
  if (!sms) {
    return NextResponse.json({ message: 'SMS record not found' }, { status: 404 });
  }

  const { data: payment, error: paymentError } = await client
    .from('payments')
    .select('*')
    .eq('id', paymentId)
    .maybeSingle();
  if (paymentError) {
    return NextResponse.json({ message: paymentError.message }, { status: 500 });
  }
  if (!payment) {
    return NextResponse.json({ message: 'Payment not found' }, { status: 404 });
  }

  await client
    .from('payments')
    .update({ status: 'confirmed', sms_parsed_id: smsId })
    .eq('id', paymentId);

  if (payment.ticket_order_id) {
    await client.from('ticket_orders').update({ status: 'paid', sms_ref: sms.ref }).eq('id', payment.ticket_order_id);
    await client.from('ticket_passes').update({ state: 'active' }).eq('order_id', payment.ticket_order_id);
  }

  if (payment.order_id) {
    await client.from('orders').update({ status: 'paid', momo_ref: sms.ref }).eq('id', payment.order_id);
  }

  await client
    .from('sms_parsed')
    .update({ matched_entity: `payment:${paymentId}` })
    .eq('id', smsId);

  await writeAuditLog({
    adminId: result.context.user.id,
    action: 'sms.attach',
    entityType: 'payment',
    entityId: paymentId,
    before: { payment, sms },
    request,
  });

  return NextResponse.json({ status: 'ok' });
};
