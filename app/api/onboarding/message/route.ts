import { NextRequest, NextResponse } from "next/server";

import { createOnboardingReply, validateAuthorization } from "@/lib/server/onboarding";

export async function POST(request: NextRequest) {
  const authResult = validateAuthorization(request.headers.get("authorization"));
  if (!authResult.ok) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { sessionId?: unknown; text?: unknown } | null;
  const sessionId = typeof body?.sessionId === "string" ? body.sessionId : null;
  const text = typeof body?.text === "string" && body.text.trim().length > 0 ? body.text.trim() : null;

  if (!sessionId || !text) {
    return NextResponse.json(
      { error: "bad_request", message: "sessionId and text are required" },
      { status: 400 },
    );
  }

  const result = await createOnboardingReply({ sessionId, text });
  if (!result.ok) {
    return NextResponse.json(
      {
        error: result.error,
        message: result.message,
        detail: result.detail,
      },
      { status: result.status },
    );
  }

  const response = NextResponse.json({ ok: true, reply: result.reply });
  if (result.fromMock) {
    response.headers.set("x-onboarding-mock", "1");
  }

  return response;
}
