import { NextResponse } from "next/server";
import { ff } from "@/lib/flags";

export async function GET() {
  if (!ff("community.light", false)) {
    return NextResponse.json({ posts: [] });
  }

  return NextResponse.json({ posts: [{ id: "p1", user: "Fan", text: "Allez Gikundiro!" }] });
}
