import type { SupabaseClient } from '@supabase/supabase-js';

import { withServiceSupabaseClient } from '@/app/api/_lib/supabase';

export type LiveMatchTimelineEvent = {
  min: number | null;
  text: string;
  side?: 'home' | 'away' | 'neutral';
};

export type LiveMatchStats = Record<string, unknown> & {
  possession?: [number, number];
};

export type LiveMatchSnapshot = {
  matchId: string;
  timeline: LiveMatchTimelineEvent[];
  stats: LiveMatchStats;
  status?: string;
  updatedAt?: string;
  score?: [number, number];
};

type RawTimelineEvent = {
  min?: unknown;
  minute?: unknown;
  text?: unknown;
  side?: unknown;
};

type RawSnapshot = {
  match_id?: unknown;
  matchId?: unknown;
  timeline?: unknown;
  stats?: unknown;
  status?: unknown;
  updated_at?: unknown;
  updatedAt?: unknown;
  score?: unknown;
  home_score?: unknown;
  away_score?: unknown;
};

const parseMinute = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return null;
};

const parseSide = (value: unknown): LiveMatchTimelineEvent['side'] | undefined => {
  if (value === 'home' || value === 'away' || value === 'neutral') {
    return value;
  }
  return undefined;
};

const parseTimeline = (value: unknown): LiveMatchTimelineEvent[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  const entries: LiveMatchTimelineEvent[] = [];

  for (const item of value) {
    if (!item || typeof item !== 'object') {
      continue;
    }

    const { min, minute, text, side } = item as RawTimelineEvent;
    if (typeof text !== 'string' || text.trim().length === 0) {
      continue;
    }

    const parsedMinute = parseMinute(min ?? minute ?? null);
    const parsedSide = parseSide(side);

    if (parsedMinute === null) {
      continue;
    }

    const event: LiveMatchTimelineEvent = {
      min: parsedMinute,
      text: text.trim(),
    };

    if (parsedSide) {
      event.side = parsedSide;
    }

    entries.push(event);
  }

  return entries;
};

const parseNumberTuple = (value: unknown): [number, number] | null => {
  if (!Array.isArray(value) || value.length < 2) {
    return null;
  }

  const first = Number(value[0]);
  const second = Number(value[1]);

  if (!Number.isFinite(first) || !Number.isFinite(second)) {
    return null;
  }

  return [first, second];
};

const parseStats = (value: unknown): LiveMatchStats => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  const stats: LiveMatchStats = { ...(value as Record<string, unknown>) };

  if ('possession' in stats) {
    const parsed = parseNumberTuple(stats.possession);
    if (parsed) {
      stats.possession = parsed;
    } else {
      delete stats.possession;
    }
  }

  return stats;
};

const parseScore = (
  value: unknown,
  fallbackHome: unknown,
  fallbackAway: unknown,
): [number, number] | null => {
  const tuple = parseNumberTuple(value);
  if (tuple) {
    return tuple;
  }

  const home = Number(fallbackHome);
  const away = Number(fallbackAway);

  if (Number.isFinite(home) && Number.isFinite(away)) {
    return [home, away];
  }

  return null;
};

const resolveString = (value: unknown): string | undefined => {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.length > 0) {
      return trimmed;
    }
  }
  return undefined;
};

export const normalizeLiveMatchSnapshot = (
  raw: RawSnapshot,
  fallbackMatchId: string,
): LiveMatchSnapshot => {
  const resolvedMatchId =
    resolveString(raw.match_id) ?? resolveString(raw.matchId) ?? fallbackMatchId;

  const snapshot: LiveMatchSnapshot = {
    matchId: resolvedMatchId,
    timeline: parseTimeline(raw.timeline),
    stats: parseStats(raw.stats),
  };

  const score = parseScore(raw.score, raw.home_score, raw.away_score);
  if (score) {
    snapshot.score = score;
  }

  const status = resolveString(raw.status);
  if (status) {
    snapshot.status = status;
  }

  const updatedAt = resolveString(raw.updated_at) ?? resolveString(raw.updatedAt);
  if (updatedAt) {
    snapshot.updatedAt = updatedAt;
  }

  return snapshot;
};

export class LiveMatchProviderError extends Error {
  constructor(message = 'Failed to load live match snapshot') {
    super(message);
    this.name = 'LiveMatchProviderError';
  }
}

const fetchSnapshotWithClient = async (
  client: SupabaseClient,
  matchId: string,
): Promise<LiveMatchSnapshot | null> => {
  const { data, error } = await client
    .rpc('live_match_snapshot', { match_id: matchId })
    .maybeSingle<RawSnapshot>();

  if (error) {
    throw new LiveMatchProviderError(error.message ?? 'Live snapshot RPC failed');
  }

  if (!data) {
    return null;
  }

  return normalizeLiveMatchSnapshot(data, matchId);
};

export const fetchLiveMatchSnapshot = async (
  matchId: string,
): Promise<LiveMatchSnapshot | null> => {
  const trimmedMatchId = matchId.trim();
  if (!trimmedMatchId) {
    throw new LiveMatchProviderError('matchId is required');
  }

  return withServiceSupabaseClient(
    async (client) => fetchSnapshotWithClient(client, trimmedMatchId),
    { fallback: () => null },
  );
};
