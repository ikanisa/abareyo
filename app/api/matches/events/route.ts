import { NextResponse } from 'next/server';
import { z } from 'zod';

import { tryGetServiceSupabaseClient } from '@/app/api/_lib/supabase';

const EVENT_SCHEMA = z.object({
  matchId: z.string().uuid(),
  eventType: z.enum(['kickoff', 'goal', 'full_time']),
  payload: z
    .object({
      minute: z.number().min(0).max(130).optional(),
      team: z.enum(['home', 'away', 'neutral']).optional(),
      player: z.string().optional(),
      scoreline: z.string().optional(),
      title: z.string().optional(),
      body: z.string().optional(),
    })
    .optional(),
});

const memoryEvents: Array<{ id: string; matchId: string; eventType: string; payload: unknown; createdAt: string }> = [];

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = EVENT_SCHEMA.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_payload', issues: parsed.error.issues }, { status: 400 });
  }

  const supabase = tryGetServiceSupabaseClient();
  const payload = parsed.data.payload ?? {};

  if (!supabase) {
    const record = {
      id: crypto.randomUUID(),
      matchId: parsed.data.matchId,
      eventType: parsed.data.eventType,
      payload,
      createdAt: new Date().toISOString(),
    };
    memoryEvents.push(record);
    return NextResponse.json({ ok: true, mode: 'memory', event: record });
  }

  const { error, data } = await supabase
    .from('match_events')
    .insert({
      match_id: parsed.data.matchId,
      event_type: parsed.data.eventType,
      payload,
    })
    .select('id, match_id, event_type, payload, created_at')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, event: data });
}

export async function GET() {
  if (memoryEvents.length === 0) {
    return NextResponse.json({ events: [] });
  }
  return NextResponse.json({ events: memoryEvents });
}
