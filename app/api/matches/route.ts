import { NextResponse } from "next/server";

// Match centre data is sourced from local fixtures defined in `/app/_data/matches`.
// We optionally override `matches` with rows from Supabase if configured.
import {
  highlightClips,
  leagueTable,
  matches as fixtureMatches,
  matchFeedUpdatedAt,
} from "@/app/_data/matches";

export const runtime = "edge";

async function fetchMatchesFromSupabase() {
  const url = process.env.SUPABASE_URL;
  const key =
    process.env.SUPABASE_ANON_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) return null;

  // Importing here keeps edge bundle smaller when not used.
  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(url, key, { auth: { persistSession: false } });

  const { data, error } = await supabase
    .from("matches")
    .select("*")
    .order("date");

  if (error) {
    // Swallow error and allow fallback to fixtures
    console.error("Supabase matches fetch failed:", error.message);
    return null;
  }
  return data ?? null;
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
  const matches = dbMatches ?? fixtureMatches;

  return NextResponse.json({
    matches,
    highlights: highlightClips,
    standings: leagueTable,
    updatedAt: matchFeedUpdatedAt,
  });
}
