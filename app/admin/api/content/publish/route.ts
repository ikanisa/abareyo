import { NextRequest } from 'next/server';

import { recordAudit } from '@/app/admin/api/_lib/audit';
import { adminLogger } from '@/app/admin/api/_lib/logger';
import { respond, respondWithError, respondWithSupabaseNotConfigured } from '@/app/admin/api/_lib/http';
import { AdminAuthError, requireAdminSession } from '@/app/admin/api/_lib/session';
import { AdminServiceClientUnavailableError, withAdminServiceClient } from '@/services/admin/service-client';

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdminSession(['admin.module.content']);
    const payload = (await request.json()) as { id: string; publish: boolean };
    if (!payload?.id) {
      return respondWithError('content_id_required', 'Content id required', 400);
    }

    return await withAdminServiceClient(async (supabase) => {
      const { data: before, error: beforeError } = await supabase
        .from('content_items')
        .select('id, status, published_at, title')
        .eq('id', payload.id)
        .maybeSingle();

      if (beforeError) throw beforeError;
      if (!before) {
        return respondWithError('content_not_found', 'Content not found', 404);
      }

      const nextStatus = payload.publish ? 'published' : 'draft';
      const nextPublishedAt = payload.publish ? new Date().toISOString() : null;

      const { data, error } = await supabase
        .from('content_items')
        .update({ status: nextStatus, published_at: nextPublishedAt, updated_at: new Date().toISOString() })
        .eq('id', payload.id)
        .select('id, status, published_at, updated_at')
        .single();

      if (error) throw error;

      await recordAudit(supabase, {
        action: payload.publish ? 'content.publish' : 'content.unpublish',
        entityType: 'content_item',
        entityId: payload.id,
        before,
        after: data,
        userId: session.user.id,
        ip: session.ip,
        userAgent: session.userAgent,
      });

      adminLogger.info('content.publish.toggle', { admin: session.user.id, item: payload.id, status: nextStatus });
      return respond({ item: data });
    });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return respondWithError(error.message, 'Permission denied', error.status);
    }
    if (error instanceof AdminServiceClientUnavailableError) {
      return respondWithSupabaseNotConfigured();
    }
    adminLogger.error('content.publish.failed', { error: (error as Error).message });
    return respondWithError('content_publish_failed', 'Unable to update publish state', 500);
  }
}
