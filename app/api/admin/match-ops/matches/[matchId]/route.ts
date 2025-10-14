import { NextResponse } from 'next/server';

import { writeAuditLog } from '@/app/api/admin/_lib/audit';
import { getServiceClient } from '@/app/api/admin/_lib/db';
import { requireAdmin } from '@/app/api/admin/_lib/session';

type MatchRow = {
  id: string;
  title: string;
  date: string;
  venue: string | null;
  status: string;
  vip_price: number | null;
  regular_price: number | null;
  seats_vip: number | null;
  seats_regular: number | null;
  seats_blue: number | null;
  home_team: string | null;
  away_team: string | null;
};

const resolveOpponent = (row: MatchRow) => {
  const home = row.home_team ?? '';
  const away = row.away_team ?? '';
  if (home.toLowerCase().includes('rayon')) return away || row.title;
  if (away.toLowerCase().includes('rayon')) return home || row.title;
  return row.title;
};

const serialize = (row: MatchRow) => ({
  id: row.id,
  opponent: resolveOpponent(row) ?? row.title,
  kickoff: row.date,
  venue: row.venue,
  status: row.status === 'upcoming' ? 'scheduled' : row.status,
  vipPrice: row.vip_price,
  regularPrice: row.regular_price,
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
    .select('id, title, date, venue, status, vip_price, regular_price, seats_vip, seats_regular, seats_blue, home_team, away_team')
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

  const update: Record<string, unknown> = {};
  if (typeof payload.opponent === 'string') {
    const trimmed = payload.opponent.trim();
    update.away_team = trimmed;
    update.title = trimmed;
  }
  if (typeof payload.kickoff === 'string') update.date = payload.kickoff;
  if (typeof payload.venue === 'string' || payload.venue === null) update.venue = payload.venue;
  if (typeof payload.status === 'string') update.status = payload.status;
  if (typeof payload.vipPrice === 'number' || payload.vipPrice === null) update.vip_price = payload.vipPrice;
  if (typeof payload.regularPrice === 'number' || payload.regularPrice === null)
    update.regular_price = payload.regularPrice;
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
    .select('id, title, date, venue, status, vip_price, regular_price, seats_vip, seats_regular, seats_blue, home_team, away_team')
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
