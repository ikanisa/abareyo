import { NextRequest } from 'next/server';

import { recordAudit } from '@/app/admin/api/_lib/audit';
import { adminLogger } from '@/app/admin/api/_lib/logger';
import { respond, respondWithError, respondWithSupabaseNotConfigured } from '@/app/admin/api/_lib/http';
import { AdminAuthError, requireAdminSession } from '@/app/admin/api/_lib/session';
import { AdminServiceClientUnavailableError, withAdminServiceClient } from '@/services/admin/service-client';

const MATCH_SELECT = `id, opponent, kickoff, venue, status, pricing, gates, created_at`;

export async function GET() {
  try {
    const session = await requireAdminSession(['admin.module.match_ops']);
    return await withAdminServiceClient(async (supabase) => {
      const { data, error } = await supabase
        .from('matches')
        .select(MATCH_SELECT)
        .order('kickoff', { ascending: true });

      if (error) throw error;

      adminLogger.info('matches.list', { admin: session.user.id, count: data?.length ?? 0 });
      return respond({ matches: data ?? [] });
    });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return respondWithError(error.message, 'Permission denied', error.status);
    }
    if (error instanceof AdminServiceClientUnavailableError) {
      return respondWithSupabaseNotConfigured();
    }
    adminLogger.error('matches.list_failed', { error: (error as Error).message });
    return respondWithError('matches_fetch_failed', 'Unable to load matches', 500);
  }
}

type UpsertMatchPayload = {
  id?: string;
  opponent: string;
  kickoff?: string | null;
  venue?: string | null;
  status?: string | null;
  pricing?: unknown;
  gates?: unknown;
};

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdminSession(['admin.module.match_ops']);
    const payload = (await request.json()) as UpsertMatchPayload;

    if (!payload?.opponent) {
      return respondWithError('match_opponent_required', 'Opponent is required', 400);
    }

    return await withAdminServiceClient(async (supabase) => {
      const { data, error } = await supabase
        .from('matches')
        .insert({
          opponent: payload.opponent,
          kickoff: payload.kickoff ?? null,
          venue: payload.venue ?? null,
          status: payload.status ?? 'scheduled',
          pricing: payload.pricing ?? [],
          gates: payload.gates ?? [],
        })
        .select(MATCH_SELECT)
        .single();

      if (error) throw error;

      await recordAudit(supabase, {
        action: 'match.create',
        entityType: 'match',
        entityId: data.id,
        after: data,
        userId: session.user.id,
        ip: session.ip,
        userAgent: session.userAgent,
      });

      adminLogger.info('matches.created', { admin: session.user.id, match: data.id });
      return respond({ match: data }, 201);
    });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return respondWithError(error.message, 'Permission denied', error.status);
    }
    if (error instanceof AdminServiceClientUnavailableError) {
      return respondWithSupabaseNotConfigured();
    }
    adminLogger.error('matches.create_failed', { error: (error as Error).message });
    return respondWithError('match_create_failed', 'Unable to create match', 500);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireAdminSession(['admin.module.match_ops']);
    const payload = (await request.json()) as UpsertMatchPayload;
    if (!payload?.id) {
      return respondWithError('match_id_required', 'Match id is required', 400);
    }

    return await withAdminServiceClient(async (supabase) => {
      const { data: before, error: beforeError } = await supabase
        .from('matches')
        .select(MATCH_SELECT)
        .eq('id', payload.id)
        .maybeSingle();

      if (beforeError) throw beforeError;
      if (!before) {
        return respondWithError('match_not_found', 'Match not found', 404);
      }

      const updates: Record<string, unknown> = {};
      if (payload.opponent) updates.opponent = payload.opponent;
      if (payload.kickoff !== undefined) updates.kickoff = payload.kickoff;
      if (payload.venue !== undefined) updates.venue = payload.venue;
      if (payload.status !== undefined) updates.status = payload.status;
      if (payload.pricing !== undefined) updates.pricing = payload.pricing;
      if (payload.gates !== undefined) updates.gates = payload.gates;

      if (Object.keys(updates).length === 0) {
        return respondWithError('match_no_changes', 'No changes supplied', 400);
      }

      const { data: updated, error } = await supabase
        .from('matches')
        .update(updates)
        .eq('id', payload.id)
        .select(MATCH_SELECT)
        .single();

      if (error) throw error;

      await recordAudit(supabase, {
        action: 'match.update',
        entityType: 'match',
        entityId: payload.id,
        before,
        after: updated,
        userId: session.user.id,
        ip: session.ip,
        userAgent: session.userAgent,
      });

      adminLogger.info('matches.updated', { admin: session.user.id, match: payload.id });
      return respond({ match: updated });
    });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return respondWithError(error.message, 'Permission denied', error.status);
    }
    if (error instanceof AdminServiceClientUnavailableError) {
      return respondWithSupabaseNotConfigured();
    }
    adminLogger.error('matches.update_failed', { error: (error as Error).message });
    return respondWithError('match_update_failed', 'Unable to update match', 500);
  }
}
