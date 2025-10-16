import { NextResponse } from "next/server";
import { ff } from "@/lib/flags";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  if (!ff('live.scores', false)) {
    return NextResponse.json({ timeline: [{ min: 12, text: 'Goal!' }], stats: { possession: [52, 48] } });
  }
  // TODO: connect to live scores provider when enabled
  return NextResponse.json({ timeline: [], stats: {}, matchId: params.id });
}
