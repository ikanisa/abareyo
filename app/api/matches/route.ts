import { NextResponse } from "next/server";

// Match centre data is sourced from local fixtures defined in `/app/_data/matches`.
// This API returns a snapshot of the current match centre including match summaries,
// highlight clips, standings table and the last updated timestamp.  It mirrors
// the behaviour introduced in PR #4 while co‑existing with the legacy tickets
// API which now lives under `/api/matches/tickets`.
import {
  highlightClips,
  leagueTable,
  matches,
  matchFeedUpdatedAt,
} from "@/app/_data/matches";

export const runtime = "edge";

/**
 * Returns the current match centre feed as JSON.
 *
 * The response includes:
 *  - `matches`: a list of Match objects summarising upcoming and live fixtures.
 *  - `highlights`: an array of highlight clips.
 *  - `standings`: the current league table.
 *  - `updatedAt`: an ISO date string indicating when the feed was last updated.
 */
export async function GET() {
  return NextResponse.json({
    matches,
    highlights: highlightClips,
    standings: leagueTable,
    updatedAt: matchFeedUpdatedAt,
  });
}
