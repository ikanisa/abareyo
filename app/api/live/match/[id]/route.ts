import { NextResponse } from 'next/server';

import { fetchLiveMatchSnapshot } from '../_providers/supabase';

import { ff } from '@/lib/flags';

const FALLBACK_TEMPLATE = {
  timeline: [{ min: 12, text: 'Goal!' }] as Array<{ min: number; text: string }>,
  stats: { possession: [52, 48] as [number, number] },
} as const;

const buildFallbackPayload = (matchId: string) => ({
  matchId,
  timeline: FALLBACK_TEMPLATE.timeline.map((event) => ({ ...event })),
  stats: {
    ...FALLBACK_TEMPLATE.stats,
    possession: [...FALLBACK_TEMPLATE.stats.possession] as [number, number],
  },
});

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const matchId = params.id?.trim();
  if (!matchId) {
    return NextResponse.json({ error: 'match_id_required' }, { status: 400 });
  }

  if (!ff('live.scores', false)) {
    return NextResponse.json(buildFallbackPayload(matchId));
  }

  try {
    const snapshot = await fetchLiveMatchSnapshot(matchId);
    if (!snapshot) {
      console.warn('live_match_snapshot_missing', { matchId });
      return NextResponse.json(buildFallbackPayload(matchId));
    }
    return NextResponse.json(snapshot);
  } catch (error) {
    console.error('live_match_provider_error', { error, matchId });
    return NextResponse.json(buildFallbackPayload(matchId));
  }
}
