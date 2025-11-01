import { NextResponse } from "next/server";

// Match centre data is sourced from local fixtures defined in `/app/_data/matches`.
// We optionally override `matches` with rows from Supabase if configured.
import {
  highlightClips,
  leagueTable,
  matches as fixtureMatches,
  matchFeedUpdatedAt,
  type Match,
} from "@/app/_data/matches";
import { tryGetSupabaseServerAnonClient } from "@/lib/db";
import { invokeSupabaseFunction } from "@/lib/supabase-edge";

export const runtime = "edge";

type SupabaseMatchRow = {
  opponent?: string | null;
  home?: string | null;
  away?: string | null;
  [key: string]: unknown;
};

async function fetchMatchesFromSupabase() {
  try {
    const payload = await invokeSupabaseFunction<{
      matches?: Array<Record<string, unknown>>;
      updatedAt?: string;
    }>("match-centre");
    if (!payload || !Array.isArray(payload.matches)) {
      return null;
    }
    return payload.matches;
  } catch (error) {
    console.warn("match-centre function failed", error);
    const supabase = tryGetSupabaseServerAnonClient();
    if (!supabase) return null;

    const { data, error: queryError } = await supabase.from("matches").select("*").order("kickoff");

    if (queryError) {
      console.error("Supabase matches fetch failed:", queryError.message);
      return null;
    }
    return data ?? null;
  }
}

/**
 * Returns the current match centre feed as JSON.
 *
 * The response includes:
 *  - `matches`: list of Match objects (DB if available, else fixtures)
 *  - `highlights`: highlight clips (fixtures)
 *  - `standings`: current league table (fixtures)
 *  - `updatedAt`: ISO timestamp for last update (fixtures timestamp)
 */
export async function GET() {
  const dbMatches = await fetchMatchesFromSupabase();
  const matches = (dbMatches ?? fixtureMatches).map((match) => {
    const row = match as SupabaseMatchRow | Match;
    if ('opponent' in row && typeof row.opponent === 'string' && row.opponent) return row;
    const home = typeof row.home === 'string' ? row.home : undefined;
    const away = typeof row.away === 'string' ? row.away : undefined;
    const isRayonHome = home?.toLowerCase().includes('rayon');
    const opponent = isRayonHome ? away : home;
    return {
      opponent,
      ...row,
    };
  });

  return NextResponse.json({
    matches,
    highlights: highlightClips,
    standings: leagueTable,
    updatedAt: matchFeedUpdatedAt,
  });
}
