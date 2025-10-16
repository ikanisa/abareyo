import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { score, note } = await req.json();
  console.log('NPS', { score, note });
  return NextResponse.json({ ok: true });
}
