import { NextResponse } from "next/server";
import { ff } from "@/lib/flags";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  if (!ff("live.scores", false)) {
    return NextResponse.json({
      timeline: [{ min: 12, text: "Goal!" }],
      stats: { possession: [52, 48] },
      matchId: params.id,
    });
  }

  return NextResponse.json({ timeline: [], stats: {}, matchId: params.id });
}
