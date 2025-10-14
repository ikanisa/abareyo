import { NextResponse } from 'next/server';

import { writeAuditLog } from '@/app/api/admin/_lib/audit';
import { getServiceClient } from '@/app/api/admin/_lib/db';
import { requireAdmin } from '@/app/api/admin/_lib/session';

export const DELETE = async (request: Request, context: { params: { matchId: string; zoneId: string } }) => {
  const result = await requireAdmin(request, { permission: 'match.manage' });
  if ('response' in result) return result.response;

  const client = getServiceClient();
  const { data: before } = await client
    .from('match_zones')
    .select('*')
    .eq('id', context.params.zoneId)
    .maybeSingle();

  const { error } = await client.from('match_zones').delete().eq('id', context.params.zoneId);
  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  if (before) {
    await writeAuditLog({
      adminId: result.context.user.id,
      action: 'match.zone.delete',
      entityType: 'match_zone',
      entityId: context.params.zoneId,
      before,
      request,
    });
  }

  return NextResponse.json({ status: 'ok' });
};
