import { NextRequest } from 'next/server';

import { recordAudit } from '@/app/admin/api/_lib/audit';
import { adminLogger } from '@/app/admin/api/_lib/logger';
import { respond, respondWithError } from '@/app/admin/api/_lib/http';
import { AdminAuthError, requireAdminSession } from '@/app/admin/api/_lib/session';
import { getSupabaseAdmin } from '@/app/admin/api/_lib/supabase';

export async function GET() {
  try {
    const session = await requireAdminSession(['admin.module.rewards']);
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('rewards_events')
      .select('id, user_id, source, ref_id, points, meta, created_at')
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) throw error;

    adminLogger.info('rewards.events.list', { admin: session.user.id, count: data?.length ?? 0 });
    return respond({ events: data ?? [] });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return respondWithError(error.message, 'Permission denied', error.status);
    }
    adminLogger.error('rewards.events.list_failed', { error: (error as Error).message });
    return respondWithError('rewards_fetch_failed', 'Unable to load rewards', 500);
  }
}

type RetroPayload = {
  user_id: string;
  points?: number;
  match_id?: string;
  reason?: string;
};

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdminSession(['admin.module.rewards']);
    const payload = (await request.json()) as RetroPayload;

    if (!payload?.user_id) {
      return respondWithError('user_id_required', 'User id is required', 400);
    }

    const supabase = getSupabaseAdmin();

    if (payload.points && payload.points !== 0) {
      const { data, error } = await supabase.rpc('retro_issue_points', {
        target_user: payload.user_id,
        points: payload.points,
        reason: payload.reason ?? 'manual-award',
        meta: { issued_by: session.user.id },
      });

      if (error) throw error;

      adminLogger.info('rewards.points.issued', { admin: session.user.id, user: payload.user_id, points: payload.points });
      await recordAudit(supabase, {
        action: 'rewards.points.issue',
        entityType: 'rewards_event',
        entityId: String((data as { event?: { id?: string } })?.event?.id ?? ''),
        before: null,
        after: data,
        userId: session.user.id,
        ip: session.ip,
        userAgent: session.userAgent,
        context: { kind: 'points' },
      });
      return respond({ result: data });
    }

    if (payload.match_id) {
      const { data, error } = await supabase.rpc('retro_issue_ticket_perk', {
        target_user: payload.user_id,
        match: payload.match_id,
        note: payload.reason ?? 'manual-perk',
      });

      if (error) throw error;

      await recordAudit(supabase, {
        action: 'rewards.ticket_perk',
        entityType: 'reward_perk',
        entityId: String(data?.order_id ?? ''),
        before: null,
        after: data,
        userId: session.user.id,
        ip: session.ip,
        userAgent: session.userAgent,
      });

      adminLogger.info('rewards.perk.issued', { admin: session.user.id, user: payload.user_id, match: payload.match_id });
      return respond({ result: data });
    }

    return respondWithError('reward_payload_invalid', 'Provide points or match_id', 400);
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return respondWithError(error.message, 'Permission denied', error.status);
    }
    adminLogger.error('rewards.events.create_failed', { error: (error as Error).message });
    return respondWithError('reward_issue_failed', 'Unable to issue reward', 500);
  }
}
