import { NextResponse } from "next/server";

import { highlightClips, leagueTable, matches, matchFeedUpdatedAt } from "@/app/_data/matches";

export const runtime = "edge";

export async function GET() {
  return NextResponse.json({
    matches,
    highlights: highlightClips,
    standings: leagueTable,
    updatedAt: matchFeedUpdatedAt,
  });
}
