import { NextRequest, NextResponse } from "next/server";

import { createOnboardingSession, validateAuthorization } from "@/lib/server/onboarding";

export async function POST(request: NextRequest) {
  const authResult = validateAuthorization(request.headers.get("authorization"));
  if (!authResult.ok) {
    return NextResponse.json(
      {
        error: "unauthorized",
        message: authResult.code === "missing" ? "Missing token." : "Invalid token.",
      },
      { status: 401 },
    );
  }

  const result = createOnboardingSession();
  if (!result.ok) {
    return NextResponse.json(
      {
        error: result.error,
        message: result.message,
      },
      { status: result.status },
    );
  }

  const response = NextResponse.json({ ok: true, session: result.session });
  if (result.fromMock) {
    response.headers.set("x-onboarding-mock", "1");
  }

  return response;
}
