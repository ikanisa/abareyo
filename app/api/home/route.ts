import { NextResponse } from "next/server";

import { buildHomeSurfaceData } from "@/lib/home/surface-data";

export function GET() {
  const data = buildHomeSurfaceData();
  return NextResponse.json(
    { data },
    {
      headers: {
        "cache-control": "no-store",
      },
    },
  );
}
