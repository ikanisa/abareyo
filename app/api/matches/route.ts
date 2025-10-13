import { NextResponse } from "next/server";

// Match centre data is sourced from local fixtures defined in `/app/_data/matches`.
// This API returns a snapshot of the current match centre including match summaries,
// highlight clips, standings table and the last updated timestamp.  It mirrors
// the behaviour introduced in PR #4 while co‑existing with the legacy tickets
// API which now lives under `/api/matches/tickets`.
import { matches } from "@/app/_data/matches";

export const runtime = "edge";

/**
 * Returns the current match centre feed as JSON.
 *
 * The response includes a single `matches` array summarising upcoming,
 * live, and full-time fixtures so client views can render the feed without
 * additional shape conversions.
 */
export async function GET() {
  return NextResponse.json({ matches });
}
