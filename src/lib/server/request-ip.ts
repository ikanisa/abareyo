import type { NextRequest } from "next/server";

export const getClientIp = (request: NextRequest | Request): string | null => {
  if ("ip" in request && typeof (request as NextRequest).ip === "string" && (request as NextRequest).ip) {
    return (request as NextRequest).ip;
  }

  const headers = request.headers;
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) {
    const [first] = forwardedFor.split(",");
    const trimmed = first?.trim();
    if (trimmed) {
      return trimmed;
    }
  }

  const realIp = headers.get("x-real-ip");
  if (realIp && realIp.trim().length > 0) {
    return realIp.trim();
  }

  return null;
};
