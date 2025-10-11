import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({ ok: true, name: "abareyo", time: new Date().toISOString() });
}
