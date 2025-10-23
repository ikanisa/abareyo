import { NextResponse } from "next/server";

import { matches as fixtureMatches } from "@/app/_data/matches";

export const runtime = "nodejs";

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

  const match = fixtureMatches.find((item) => normaliseId(item.id) === normaliseId(id));

  if (!match) {
    return NextResponse.json({ error: "Match not found" }, { status: 404 });
  }

  return NextResponse.json({ match });
}
