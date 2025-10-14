import { NextResponse } from 'next/server';

import { writeAuditLog } from '@/app/api/admin/_lib/audit';
import { getServiceClient } from '@/app/api/admin/_lib/db';
import { requireAdmin } from '@/app/api/admin/_lib/session';

export const POST = async (request: Request, context: { params: { matchId: string } }) => {
  const result = await requireAdmin(request, { permission: 'match.manage' });
  if ('response' in result) return result.response;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ message: 'Invalid payload' }, { status: 400 });
  }

  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const capacity = typeof body.capacity === 'number' ? body.capacity : 0;
  const price = typeof body.price === 'number' ? body.price : 0;
  const gate = typeof body.gate === 'string' ? body.gate.trim() : null;

  if (!name) {
    return NextResponse.json({ message: 'Zone name is required' }, { status: 400 });
  }

  const client = getServiceClient();
  const { data, error } = await client
    .from('match_zones')
    .insert({ match_id: context.params.matchId, name, capacity, price, default_gate: gate })
    .select('id, name, capacity, price, default_gate')
    .single();

  if (error || !data) {
    return NextResponse.json({ message: error?.message ?? 'Failed to create zone' }, { status: 500 });
  }

  await writeAuditLog({
    adminId: result.context.user.id,
    action: 'match.zone.create',
    entityType: 'match_zone',
    entityId: data.id,
    after: data,
    request,
  });

  return NextResponse.json({
    status: 'ok',
    data: {
      id: data.id,
      name: data.name,
      capacity: data.capacity,
      price: data.price,
      gate: data.default_gate,
    },
  });
};
