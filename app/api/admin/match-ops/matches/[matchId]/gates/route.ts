import { NextResponse } from 'next/server';

import { writeAuditLog } from '@/app/api/admin/_lib/audit';
import { respondWithSupabaseNotConfigured } from '@/app/admin/api/_lib/http';
import { requireAdmin } from '@/app/api/admin/_lib/session';
import { AdminServiceClientUnavailableError, withAdminServiceClient } from '@/services/admin/service-client';

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
  const location = typeof body.location === 'string' ? body.location.trim() : null;
  const maxThroughput = typeof body.maxThroughput === 'number' ? body.maxThroughput : null;

  if (!name) {
    return NextResponse.json({ message: 'Gate name is required' }, { status: 400 });
  }

  try {
    return await withAdminServiceClient(async (client) => {
      const { data, error } = await client
        .from('match_gates')
        .insert({ match_id: context.params.matchId, name, location, max_throughput: maxThroughput })
        .select('id, name, location, max_throughput')
        .single();

      if (error || !data) {
        return NextResponse.json({ message: error?.message ?? 'Failed to create gate' }, { status: 500 });
      }

      await writeAuditLog({
        adminId: result.context.user.id,
        action: 'match.gate.create',
        entityType: 'match_gate',
        entityId: data.id,
        after: data,
        request,
      });

      return NextResponse.json({
        status: 'ok',
        data: {
          id: data.id,
          name: data.name,
          location: data.location,
          maxThroughput: data.max_throughput,
        },
      });
    });
  } catch (error) {
    if (error instanceof AdminServiceClientUnavailableError) {
      return respondWithSupabaseNotConfigured();
    }
    console.error('admin.match-ops.gate.create_failed', error);
    return NextResponse.json({ message: 'Failed to create gate' }, { status: 500 });
  }
};
