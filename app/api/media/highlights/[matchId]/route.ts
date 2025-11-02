import { NextResponse } from "next/server";

import { ff } from "@/lib/flags";

export async function GET(
  _request: Request,
  { params: _params }: { params: { matchId: string } },
) {
  if (!ff("media.highlights", false)) {
    return NextResponse.json({ items: [] });
  }

  return NextResponse.json({
    items: [
      {
        id: "h1",
        title: "Goal 12",
        src: "/media/goal12.m3u8",
      },
    ],
  });
}
