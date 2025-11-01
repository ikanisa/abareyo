import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

import { getServiceRoleClient } from "../_shared/client.ts";
import { json } from "../_shared/http.ts";

const db = getServiceRoleClient();

type MatchRow = {
  id: string;
  opponent?: string | null;
  kickoff?: string | null;
  venue?: string | null;
  status?: string | null;
  match_zones?: Array<{
    name?: string | null;
    capacity?: number | null;
    price?: number | null;
    default_gate?: string | null;
  }>;
  match_centre_payloads?: {
    live_minute?: string | null;
    score_home?: number | null;
    score_away?: number | null;
    badge?: string | null;
    broadcast?: string | null;
    timeline?: unknown;
    stats?: unknown;
    lineups?: unknown;
    chat?: unknown;
    updated_at?: string | null;
  } | null;
};

type MatchResponse = {
  id: string;
  home: string;
  away: string;
  opponent: string;
  venue?: string;
  kickoff?: string;
  status?: string;
  comp?: string;
  round?: string;
  badge?: string;
  broadcast?: string;
  liveMinute?: string;
  score?: { home: number; away: number } | null;
  timeline: Array<Record<string, unknown>>;
  stats: Array<Record<string, unknown>>;
  lineups?: Record<string, unknown> | null;
  chat?: Array<Record<string, unknown>>;
  zones: Array<{
    zone: string;
    price: number;
    capacity: number;
    remaining: number;
    gate?: string;
  }>;
  updatedAt?: string;
};

const ensureArray = (value: unknown): Array<Record<string, unknown>> => {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((entry) => entry && typeof entry === "object") as Array<Record<string, unknown>>;
};

const ensureObject = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
};

const formatMatchRow = (row: MatchRow): MatchResponse => {
  const payload = row.match_centre_payloads ?? null;
  const opponent = row.opponent?.trim() || "Opponent";
  const status = row.status ?? undefined;

  const scoreHome = payload?.score_home;
  const scoreAway = payload?.score_away;

  const score =
    typeof scoreHome === "number" && typeof scoreAway === "number"
      ? { home: scoreHome, away: scoreAway }
      : null;

  const zones = (row.match_zones ?? []).map((zone) => ({
    zone: zone.name?.trim() || "General",
    price: typeof zone.price === "number" ? zone.price : 0,
    capacity: typeof zone.capacity === "number" ? zone.capacity : 0,
    remaining: typeof zone.capacity === "number" ? zone.capacity : 0,
    gate: zone.default_gate ?? undefined,
  }));

  return {
    id: row.id,
    home: "Rayon Sports",
    away: opponent,
    opponent,
    venue: row.venue ?? undefined,
    kickoff: row.kickoff ?? undefined,
    status,
    comp: undefined,
    round: undefined,
    badge: payload?.badge ?? undefined,
    broadcast: payload?.broadcast ?? undefined,
    liveMinute: payload?.live_minute ?? undefined,
    score,
    timeline: ensureArray(payload?.timeline),
    stats: ensureArray(payload?.stats),
    lineups: ensureObject(payload?.lineups ?? undefined) ?? undefined,
    chat: ensureArray(payload?.chat),
    zones,
    updatedAt: payload?.updated_at ?? undefined,
  };
};

const listMatches = async (matchId?: string | null) => {
  let query = db
    .from("matches")
    .select(
      `id, opponent, kickoff, venue, status, match_zones(name, capacity, price, default_gate), match_centre_payloads(live_minute, score_home, score_away, badge, broadcast, timeline, stats, lineups, chat, updated_at)`
    )
    .order("kickoff", { ascending: true });

  if (matchId) {
    query = query.eq("id", matchId).limit(1);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message);
  }

  const matches = (data ?? []).map(formatMatchRow);
  return matches;
};

serve(async (req) => {
  if (req.method !== "GET") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const url = new URL(req.url);
  const matchId = url.searchParams.get("id");

  try {
    const matches = await listMatches(matchId);

    if (matchId) {
      const match = matches[0] ?? null;
      if (!match) {
        return json({ error: "not_found" }, { status: 404 });
      }
      return json({ match });
    }

    const updatedAt = matches.reduce<string | undefined>((latest, match) => {
      if (!match.updatedAt) return latest;
      if (!latest) return match.updatedAt;
      return new Date(match.updatedAt).getTime() > new Date(latest).getTime() ? match.updatedAt : latest;
    }, undefined);

    return json({ matches, updatedAt });
  } catch (error) {
    console.error("[edge:match-centre] failure", error);
    return json({ error: "match_centre_failed" }, { status: 500 });
  }
});
