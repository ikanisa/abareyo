import { NextResponse } from "next/server";
import { ff } from "@/lib/flags";

export async function GET() {
  if (!ff("content.feed", false)) {
    return NextResponse.json({ items: [] });
  }

  return NextResponse.json({
    items: [
      { id: "n1", type: "news", title: "Training update" },
      { id: "v1", type: "video", title: "Goal clip" },
    ],
  });
}
