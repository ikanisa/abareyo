import { NextResponse } from "next/server";

import { matches as fixtureMatches, type Match } from "@/app/_data/matches";
import { invokeSupabaseFunction } from "@/lib/supabase-edge";

function normaliseId(id: string) {
  return id.toLowerCase();
}

export async function GET(
  _request: Request,
  context: { params: { id?: string } }
) {
  const id = context.params.id;

  if (!id) {
    return NextResponse.json({ error: "Match id missing" }, { status: 400 });
  }

  try {
    const payload = await invokeSupabaseFunction<{ match?: Match }>("match-centre", {
      searchParams: { id },
    });
    if (payload?.match) {
      return NextResponse.json({ match: payload.match });
    }
  } catch (error) {
    console.warn("match-centre single fetch failed", error);
  }

  const match = fixtureMatches.find((item) => normaliseId(item.id) === normaliseId(id));

  if (!match) {
    return NextResponse.json({ error: "Match not found" }, { status: 404 });
  }

  return NextResponse.json({ match });
}
