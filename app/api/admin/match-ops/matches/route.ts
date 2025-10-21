import { NextResponse } from 'next/server';

import { writeAuditLog } from '@/app/api/admin/_lib/audit';
import { respondWithSupabaseNotConfigured } from '@/app/admin/api/_lib/http';
import { requireAdmin } from '@/app/api/admin/_lib/session';
import type { Tables, TablesInsert } from '@/integrations/supabase/types';
import { AdminServiceClientUnavailableError, withAdminServiceClient } from '@/services/admin/service-client';

type MatchRow = Tables<'matches'>;

type MatchZoneRow = Tables<'match_zones'>;

type MatchGateRow = Tables<'match_gates'>;

type SerializedZone = {
  id: string;
  name: string;
  capacity: number;
  price: number;
  gate: string | null;
  matchId: string;
};

type SerializedGate = {
  id: string;
  name: string;
  location: string | null;
  maxThroughput: number | null;
  matchId: string;
};

const resolveOpponent = (row: MatchRow) => row.opponent ?? 'TBD opponent';

const serializeMatch = (
  row: MatchRow,
  zones: Record<string, SerializedZone[]>,
  gates: Record<string, SerializedGate[]>,
) => ({
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
  zones: zones[row.id] ?? [],
  gates: gates[row.id] ?? [],
});

export const GET = async (request: Request) => {
  const result = await requireAdmin(request);
  if ('response' in result) return result.response;

  try {
    return await withAdminServiceClient(async (client) => {
      const { data: matches, error } = await client
        .from('matches')
        .select(
          'id, opponent, kickoff, venue, status, vip_price, regular_price, blue_price, seats_vip, seats_regular, seats_blue',
        )
        .order('kickoff', { ascending: true });

      if (error) {
        return NextResponse.json({ message: error.message }, { status: 500 });
      }

      const ids = (matches ?? []).map((match) => match.id);
      const zoneMap: Record<string, SerializedZone[]> = {};
      const gateMap: Record<string, SerializedGate[]> = {};

      if (ids.length) {
        const { data: zoneRows } = await client
          .from('match_zones')
          .select('id, match_id, name, capacity, price, default_gate')
          .in('match_id', ids);
        for (const zone of (zoneRows ?? []) as MatchZoneRow[]) {
          zoneMap[zone.match_id] = zoneMap[zone.match_id] ?? [];
          zoneMap[zone.match_id].push({
            id: zone.id,
            name: zone.name,
            capacity: zone.capacity,
            price: zone.price,
            gate: zone.default_gate,
            matchId: zone.match_id,
          });
        }

        const { data: gateRows } = await client
          .from('match_gates')
          .select('id, match_id, name, location, max_throughput')
          .in('match_id', ids);
        for (const gate of (gateRows ?? []) as MatchGateRow[]) {
          gateMap[gate.match_id] = gateMap[gate.match_id] ?? [];
          gateMap[gate.match_id].push({
            id: gate.id,
            name: gate.name,
            location: gate.location,
            maxThroughput: gate.max_throughput,
            matchId: gate.match_id,
          });
        }
      }

      const payload = (matches ?? []).map((match) => serializeMatch(match as MatchRow, zoneMap, gateMap));
      return NextResponse.json({ status: 'ok', data: payload });
    });
  } catch (error) {
    if (error instanceof AdminServiceClientUnavailableError) {
      return respondWithSupabaseNotConfigured();
    }
    console.error('admin.match-ops.matches.fetch_failed', error);
    return NextResponse.json({ message: 'Failed to load matches' }, { status: 500 });
  }
};

export const POST = async (request: Request) => {
  const result = await requireAdmin(request, { permission: 'match.manage' });
  if ('response' in result) return result.response;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ message: 'Invalid payload' }, { status: 400 });
  }

  const opponent = typeof body.opponent === 'string' ? body.opponent.trim() : '';
  const kickoff = typeof body.kickoff === 'string' ? body.kickoff : '';
  const venue = typeof body.venue === 'string' ? body.venue.trim() : null;
  const allowedStatuses = new Set(['upcoming', 'live', 'ft']);
  const status =
    typeof body.status === 'string' && allowedStatuses.has(body.status)
      ? (body.status as 'upcoming' | 'live' | 'ft')
      : 'upcoming';

  if (!opponent || !kickoff) {
    return NextResponse.json({ message: 'Opponent and kickoff are required' }, { status: 400 });
  }

  const insertPayload = {
    opponent: opponent || null,
    kickoff,
    venue,
    status,
    vip_price: typeof body.vipPrice === 'number' ? body.vipPrice : null,
    regular_price: typeof body.regularPrice === 'number' ? body.regularPrice : null,
    blue_price: typeof body.bluePrice === 'number' ? body.bluePrice : null,
    seats_vip: typeof body.seatsVip === 'number' ? body.seatsVip : 0,
    seats_regular: typeof body.seatsRegular === 'number' ? body.seatsRegular : 0,
    seats_blue: typeof body.seatsBlue === 'number' ? body.seatsBlue : 0,
  } satisfies TablesInsert<'matches'>;

  try {
    return await withAdminServiceClient(async (client) => {
      const { data, error } = await client.from('matches').insert(insertPayload).select().single();
      if (error || !data) {
        return NextResponse.json({ message: error?.message ?? 'Failed to create match' }, { status: 500 });
      }

      await writeAuditLog({
        adminId: result.context.user.id,
        action: 'match.create',
        entityType: 'match',
        entityId: data.id,
        after: data,
        request,
      });

      const responsePayload = serializeMatch(data, {}, {});
      return NextResponse.json({ status: 'ok', data: responsePayload }, { status: 201 });
    });
  } catch (error) {
    if (error instanceof AdminServiceClientUnavailableError) {
      return respondWithSupabaseNotConfigured();
    }
    console.error('admin.match-ops.matches.create_failed', error);
    return NextResponse.json({ message: 'Failed to create match' }, { status: 500 });
  }
};
