import { NextRequest } from 'next/server';

import { recordAudit } from '@/app/admin/api/_lib/audit';
import { adminLogger } from '@/app/admin/api/_lib/logger';
import { respond, respondWithError, respondWithSupabaseNotConfigured } from '@/app/admin/api/_lib/http';
import { AdminAuthError, requireAdminSession } from '@/app/admin/api/_lib/session';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { AdminServiceClientUnavailableError, withAdminServiceClient } from '@/services/admin/service-client';

const MATCH_SELECT =
  'id, opponent, kickoff, venue, status, vip_price, regular_price, blue_price, seats_vip, seats_regular, seats_blue';

type MatchRow = Tables<'matches'>;

type MatchResponse = {
  id: string;
  opponent: string | null;
  kickoff: string;
  venue: string | null;
  status: MatchRow['status'];
  pricing: Array<{
    zone: 'vip' | 'regular' | 'blue';
    label: string;
    price: number | null;
    capacity: number | null;
  }>;
};

const buildPricing = (match: MatchRow): MatchResponse['pricing'] => {
  const tiers: MatchResponse['pricing'] = [
    { zone: 'vip', label: 'VIP', price: match.vip_price ?? null, capacity: match.seats_vip ?? null },
    {
      zone: 'regular',
      label: 'Regular',
      price: match.regular_price ?? null,
      capacity: match.seats_regular ?? null,
    },
    { zone: 'blue', label: 'Fan Zone', price: match.blue_price ?? null, capacity: match.seats_blue ?? null },
  ];

  return tiers.filter((tier) => tier.price !== null || tier.capacity !== null);
};

const serializeMatch = (match: MatchRow): MatchResponse => ({
  id: match.id,
  opponent: match.opponent,
  kickoff: match.kickoff,
  venue: match.venue,
  status: match.status,
  pricing: buildPricing(match),
});

export async function GET() {
  try {
    const session = await requireAdminSession(['admin.module.match_ops']);
    return await withAdminServiceClient(async (supabase) => {
      const { data, error } = await supabase
        .from('matches')
        .select(MATCH_SELECT)
        .order('kickoff', { ascending: true });

      if (error) throw error;

      const matches = (data ?? []) as MatchRow[];

      adminLogger.info('matches.list', { admin: session.user.id, count: matches.length });
      return respond({ matches: matches.map(serializeMatch) });
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
  vipPrice?: number | null;
  regularPrice?: number | null;
  bluePrice?: number | null;
  seatsVip?: number | null;
  seatsRegular?: number | null;
  seatsBlue?: number | null;
};

const isNumberOrNull = (value: unknown): value is number | null =>
  typeof value === 'number' || value === null;

const coerceStatus = (status: string | null | undefined, fallback: MatchRow['status']): MatchRow['status'] => {
  const allowed: MatchRow['status'][] = ['upcoming', 'live', 'ft'];
  return status && allowed.includes(status as MatchRow['status'])
    ? (status as MatchRow['status'])
    : fallback;
};

const buildInsertPayload = (payload: UpsertMatchPayload): TablesInsert<'matches'> => {
  const insert: TablesInsert<'matches'> = {
    opponent: payload.opponent,
    kickoff: payload.kickoff!,
    status: coerceStatus(payload.status ?? null, 'upcoming'),
  };

  insert.venue = payload.venue ?? null;

  if (isNumberOrNull(payload.vipPrice)) insert.vip_price = payload.vipPrice;
  if (isNumberOrNull(payload.regularPrice)) insert.regular_price = payload.regularPrice;
  if (isNumberOrNull(payload.bluePrice)) insert.blue_price = payload.bluePrice;
  if (isNumberOrNull(payload.seatsVip)) insert.seats_vip = payload.seatsVip;
  if (isNumberOrNull(payload.seatsRegular)) insert.seats_regular = payload.seatsRegular;
  if (isNumberOrNull(payload.seatsBlue)) insert.seats_blue = payload.seatsBlue;

  return insert;
};

const buildUpdatePayload = (payload: UpsertMatchPayload): TablesUpdate<'matches'> => {
  const update: TablesUpdate<'matches'> = {};

  if (typeof payload.opponent === 'string' && payload.opponent.trim()) {
    update.opponent = payload.opponent;
  }

  if (typeof payload.kickoff === 'string') {
    update.kickoff = payload.kickoff;
  }

  if (payload.venue !== undefined) {
    update.venue = payload.venue ?? null;
  }

  if (payload.status) {
    update.status = coerceStatus(payload.status, 'upcoming');
  }

  if (isNumberOrNull(payload.vipPrice)) update.vip_price = payload.vipPrice;
  if (isNumberOrNull(payload.regularPrice)) update.regular_price = payload.regularPrice;
  if (isNumberOrNull(payload.bluePrice)) update.blue_price = payload.bluePrice;
  if (isNumberOrNull(payload.seatsVip)) update.seats_vip = payload.seatsVip;
  if (isNumberOrNull(payload.seatsRegular)) update.seats_regular = payload.seatsRegular;
  if (isNumberOrNull(payload.seatsBlue)) update.seats_blue = payload.seatsBlue;

  return update;
};

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdminSession(['admin.module.match_ops']);
    const payload = (await request.json()) as UpsertMatchPayload;

    if (!payload?.opponent) {
      return respondWithError('match_opponent_required', 'Opponent is required', 400);
    }

    if (!payload.kickoff) {
      return respondWithError('match_kickoff_required', 'Kickoff is required', 400);
    }

    return await withAdminServiceClient(async (supabase) => {
      const insertPayload = buildInsertPayload(payload);

      const { data, error } = await supabase.from('matches').insert(insertPayload).select(MATCH_SELECT).single();

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
      return respond({ match: serializeMatch(data as MatchRow) }, 201);
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

    const matchId = payload.id;

    return await withAdminServiceClient(async (supabase) => {
      const { data: before, error: beforeError } = await supabase
        .from('matches')
        .select(MATCH_SELECT)
        .eq('id', matchId)
        .maybeSingle();

      if (beforeError) throw beforeError;
      if (!before) {
        return respondWithError('match_not_found', 'Match not found', 404);
      }

      const updates = buildUpdatePayload(payload);

      if (Object.keys(updates).length === 0) {
        return respondWithError('match_no_changes', 'No changes supplied', 400);
      }

      const { data: updated, error } = await supabase
        .from('matches')
        .update(updates)
        .eq('id', matchId)
        .select(MATCH_SELECT)
        .single();

      if (error) throw error;

      await recordAudit(supabase, {
        action: 'match.update',
        entityType: 'match',
        entityId: matchId,
        before,
        after: updated,
        userId: session.user.id,
        ip: session.ip,
        userAgent: session.userAgent,
      });

      adminLogger.info('matches.updated', { admin: session.user.id, match: matchId });
      return respond({ match: serializeMatch(updated as MatchRow) });
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
