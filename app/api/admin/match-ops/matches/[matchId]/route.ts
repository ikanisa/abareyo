import { NextResponse } from 'next/server';

import { writeAuditLog } from '@/app/api/admin/_lib/audit';
import { getServiceClient } from '@/app/api/admin/_lib/db';
import { requireAdmin } from '@/app/api/admin/_lib/session';

import type { Tables, TablesUpdate } from '@/integrations/supabase/types';

type MatchRow = Tables<'matches'>;

const resolveOpponent = (row: MatchRow) => row.opponent ?? 'TBD opponent';

const serialize = (row: MatchRow) => ({
  id: row.id,
  opponent: resolveOpponent(row),
  kickoff: row.kickoff,
  venue: row.venue,
  status: row.status === 'upcoming' ? 'scheduled' : row.status,
  vipPrice: row.vip_price,
  regularPrice: row.regular_price,
  bluePrice: row.blue_price,
  seats: {
    vip: row.seats_vip,
    regular: row.seats_regular,
    blue: row.seats_blue,
  },
});

export const GET = async (request: Request, context: { params: { matchId: string } }) => {
  const result = await requireAdmin(request);
  if ('response' in result) return result.response;

  const client = getServiceClient();
  const { data, error } = await client
    .from('matches')
    .select('id, opponent, kickoff, venue, status, vip_price, regular_price, blue_price, seats_vip, seats_regular, seats_blue')
    .eq('id', context.params.matchId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ message: 'Match not found' }, { status: 404 });
  }

  return NextResponse.json({ status: 'ok', data: serialize(data as MatchRow) });
};

export const PATCH = async (request: Request, context: { params: { matchId: string } }) => {
  const result = await requireAdmin(request, { permission: 'match.manage' });
  if ('response' in result) return result.response;

  const client = getServiceClient();
  const { data: before, error: beforeError } = await client
    .from('matches')
    .select('*')
    .eq('id', context.params.matchId)
    .maybeSingle();

  if (beforeError) {
    return NextResponse.json({ message: beforeError.message }, { status: 500 });
  }
  if (!before) {
    return NextResponse.json({ message: 'Match not found' }, { status: 404 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ message: 'Invalid payload' }, { status: 400 });
  }

  const allowedStatuses = new Set<MatchRow['status']>(['upcoming', 'live', 'ft']);
  const update: TablesUpdate<'matches'> = {};
  if (typeof payload.opponent === 'string') {
    const trimmed = payload.opponent.trim();
    update.opponent = trimmed || null;
  }
  if (typeof payload.kickoff === 'string') update.kickoff = payload.kickoff;
  if (typeof payload.venue === 'string' || payload.venue === null) update.venue = payload.venue;
  if (typeof payload.status === 'string' && allowedStatuses.has(payload.status as MatchRow['status'])) {
    update.status = payload.status as MatchRow['status'];
  }
  if (typeof payload.vipPrice === 'number' || payload.vipPrice === null) update.vip_price = payload.vipPrice;
  if (typeof payload.regularPrice === 'number' || payload.regularPrice === null)
    update.regular_price = payload.regularPrice;
  if (typeof payload.bluePrice === 'number' || payload.bluePrice === null) update.blue_price = payload.bluePrice;
  if (typeof payload.seatsVip === 'number') update.seats_vip = payload.seatsVip;
  if (typeof payload.seatsRegular === 'number') update.seats_regular = payload.seatsRegular;
  if (typeof payload.seatsBlue === 'number') update.seats_blue = payload.seatsBlue;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ message: 'No valid fields to update' }, { status: 400 });
  }

  const { data, error } = await client
    .from('matches')
    .update(update)
    .eq('id', context.params.matchId)
    .select('id, opponent, kickoff, venue, status, vip_price, regular_price, blue_price, seats_vip, seats_regular, seats_blue')
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ message: error?.message ?? 'Failed to update match' }, { status: 500 });
  }

  await writeAuditLog({
    adminId: result.context.user.id,
    action: 'match.update',
    entityType: 'match',
    entityId: data.id,
    before,
    after: data,
    request,
  });

  return NextResponse.json({ status: 'ok', data: serialize(data as MatchRow) });
};

export const DELETE = async (request: Request, context: { params: { matchId: string } }) => {
  const result = await requireAdmin(request, { permission: 'match.manage' });
  if ('response' in result) return result.response;

  const client = getServiceClient();
  const { data: before } = await client.from('matches').select('*').eq('id', context.params.matchId).maybeSingle();

  const { error } = await client.from('matches').delete().eq('id', context.params.matchId);
  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  if (before) {
    await writeAuditLog({
      adminId: result.context.user.id,
      action: 'match.delete',
      entityType: 'match',
      entityId: context.params.matchId,
      before,
      request,
    });
  }

  return NextResponse.json({ status: 'ok' });
};
