import { NextRequest, NextResponse } from "next/server";

import { serverEnv } from "@/config/env";
import { callOpenAiResponses, OpenAiRequestError } from "@/lib/server/openai";

export async function POST(request: NextRequest) {
  const payload = (await request.json().catch(() => null)) as { input?: unknown } | null;
  const input = typeof payload?.input === "string" && payload.input.trim().length > 0 ? payload.input : "hello";

  try {
    const data = await callOpenAiResponses(
      {
        model: "gpt-4o-mini",
        input,
        metadata: {
          app: "gikundiro",
          stage: serverEnv.NODE_ENV,
        },
      },
      fetch,
    );

    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof OpenAiRequestError) {
      return NextResponse.json(
        {
          error: error.message,
          detail: error.detail,
        },
        { status: error.status },
      );
    }

    return NextResponse.json(
      {
        error: "failed_to_reach_openai",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
