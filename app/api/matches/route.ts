import { NextResponse } from "next/server";

import { matches } from "@/app/_data/matches";

export async function GET() {
  return NextResponse.json({ matches });
}
