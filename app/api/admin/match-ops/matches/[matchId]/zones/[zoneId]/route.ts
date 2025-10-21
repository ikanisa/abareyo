import { NextResponse } from 'next/server';

import { writeAuditLog } from '@/app/api/admin/_lib/audit';
import { respondWithSupabaseNotConfigured } from '@/app/admin/api/_lib/http';
import { requireAdmin } from '@/app/api/admin/_lib/session';
import { AdminServiceClientUnavailableError, withAdminServiceClient } from '@/services/admin/service-client';

export const DELETE = async (request: Request, context: { params: { matchId: string; zoneId: string } }) => {
  const result = await requireAdmin(request, { permission: 'match.manage' });
  if ('response' in result) return result.response;

  try {
    return await withAdminServiceClient(async (client) => {
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
    });
  } catch (error) {
    if (error instanceof AdminServiceClientUnavailableError) {
      return respondWithSupabaseNotConfigured();
    }
    console.error('admin.match-ops.zone.delete_failed', error);
    return NextResponse.json({ message: 'Failed to delete zone' }, { status: 500 });
  }
};
