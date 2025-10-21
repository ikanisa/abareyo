import { NextRequest } from 'next/server';

import { recordAudit } from '@/app/admin/api/_lib/audit';
import { adminLogger } from '@/app/admin/api/_lib/logger';
import { respond, respondWithError, respondWithSupabaseNotConfigured } from '@/app/admin/api/_lib/http';
import { AdminAuthError, requireAdminSession } from '@/app/admin/api/_lib/session';
import { AdminServiceClientUnavailableError, withAdminServiceClient } from '@/services/admin/service-client';

export async function GET() {
  try {
    const session = await requireAdminSession(['admin.module.community']);
    return await withAdminServiceClient(async (supabase) => {
      const { data, error } = await supabase
        .from('community_posts')
        .select('id, user_id, body, media, status, evidence, moderator_notes, created_at')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      adminLogger.info('community.queue.list', { admin: session.user.id, count: data?.length ?? 0 });
      return respond({ posts: data ?? [] });
    });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return respondWithError(error.message, 'Permission denied', error.status);
    }
    if (error instanceof AdminServiceClientUnavailableError) {
      return respondWithSupabaseNotConfigured();
    }
    adminLogger.error('community.queue.list_failed', { error: (error as Error).message });
    return respondWithError('community_fetch_failed', 'Unable to load moderation queue', 500);
  }
}

type ModerationAction = {
  id: string;
  status: ModerationStatus;
  notes?: string;
};

type ModerationStatus = 'visible' | 'hidden' | 'warned' | 'banned';

const ALLOWED_STATUSES: ReadonlyArray<ModerationStatus> = ['visible', 'hidden', 'warned', 'banned'];

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireAdminSession(['admin.module.community']);
    const payload = (await request.json()) as ModerationAction;

    if (!payload?.id) {
      return respondWithError('post_id_required', 'Post id required', 400);
    }

    if (!payload.status || !ALLOWED_STATUSES.includes(payload.status)) {
      return respondWithError('invalid_status', 'Unsupported moderation status', 400);
    }

    return await withAdminServiceClient(async (supabase) => {
      const { data: before, error: beforeError } = await supabase
        .from('community_posts')
        .select('id, status, moderator_notes, user_id')
        .eq('id', payload.id)
        .maybeSingle();

      if (beforeError) throw beforeError;
      if (!before) {
        return respondWithError('post_not_found', 'Post not found', 404);
      }

      const { data: updated, error } = await supabase
        .from('community_posts')
        .update({
          status: payload.status,
          moderator_notes: payload.notes ?? before.moderator_notes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', payload.id)
        .select('id, status, moderator_notes, updated_at')
        .single();

      if (error) throw error;

      await recordAudit(supabase, {
        action: 'community.post.moderated',
        entityType: 'community_post',
        entityId: payload.id,
        before,
        after: updated,
        userId: session.user.id,
        ip: session.ip,
        userAgent: session.userAgent,
        context: { status: payload.status },
      });

      adminLogger.info('community.queue.updated', { admin: session.user.id, post: payload.id, status: payload.status });
      return respond({ post: updated });
    });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return respondWithError(error.message, 'Permission denied', error.status);
    }
    if (error instanceof AdminServiceClientUnavailableError) {
      return respondWithSupabaseNotConfigured();
    }
    adminLogger.error('community.queue.update_failed', { error: (error as Error).message });
    return respondWithError('community_update_failed', 'Unable to moderate post', 500);
  }
}
