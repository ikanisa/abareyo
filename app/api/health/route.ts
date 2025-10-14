import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({ ok: true, name: "gikundiro", time: new Date().toISOString() });
}
