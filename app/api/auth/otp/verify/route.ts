import { createHash } from "node:crypto";

import { NextRequest, NextResponse } from "next/server";

import { maskMsisdn } from "@/lib/msisdn";
import { dispatchTelemetryEvent } from "@/lib/observability";
import { setupNodeObservability } from "@/lib/observability/node-observability";
import { createRateLimiter } from "@/lib/server/rate-limit";
import { getOtpStore } from "@/lib/server/otp";
import { normalizePhoneNumber } from "@/lib/server/otp/normalize";
import { hashPhoneForTelemetry } from "@/lib/server/otp/whatsapp";
import { getClientIp } from "@/lib/server/request-ip";

setupNodeObservability("otp-api");

const parseEnvInteger = (value: string | undefined, fallback: number) => {
  if (!value) {
    return fallback;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const VERIFY_LIMIT = parseEnvInteger(process.env.OTP_VERIFY_LIMIT, 6);
const VERIFY_WINDOW_MS = parseEnvInteger(process.env.OTP_VERIFY_WINDOW_MS, 15 * 60 * 1000);
const IP_VERIFY_LIMIT = parseEnvInteger(process.env.OTP_VERIFY_IP_LIMIT, 40);
const IP_VERIFY_WINDOW_MS = parseEnvInteger(process.env.OTP_VERIFY_IP_WINDOW_MS, 60 * 60 * 1000);

const verificationLimiter = createRateLimiter({
  prefix: "otp:verify",
  limit: VERIFY_LIMIT,
  windowMs: VERIFY_WINDOW_MS,
});

const verificationIpLimiter = createRateLimiter({
  prefix: "otp:verify-ip",
  limit: IP_VERIFY_LIMIT,
  windowMs: IP_VERIFY_WINDOW_MS,
});

const otpStore = getOtpStore();

const hashIp = (ip: string | null) =>
  ip && ip.length > 0 ? createHash("sha256").update(ip).digest("hex").slice(0, 16) : null;

const sendTelemetry = (payload: Record<string, unknown>) => {
  void dispatchTelemetryEvent({ type: "otp.verify", ...payload });
};

const buildErrorResponse = (
  status: number,
  message: string,
  metadata: Record<string, unknown> = {},
) =>
  NextResponse.json(
    {
      error: "otp_error",
      message,
      ...metadata,
    },
    { status },
  );

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const rawPhone = typeof body?.phone === "string" ? body.phone : "";
  const code = typeof body?.code === "string" ? body.code.trim() : "";
  const ip = getClientIp(request);
  const ipHash = hashIp(ip);

  const phone = normalizePhoneNumber(rawPhone);
  if (!phone || code.length === 0) {
    console.warn({ event: "otp.verify.failure", reason: "invalid_payload", ip: ipHash ?? null });
    sendTelemetry({ outcome: "invalid_payload", ipHash });
    return buildErrorResponse(400, "Phone and code are required");
  }

  if (ip) {
    const ipResult = await verificationIpLimiter.consume(ip);
    if (!ipResult.success) {
      console.warn({
        event: "otp.verify.rate_limited",
        scope: "ip",
        ip: ipHash,
        retryAfterMs: ipResult.retryAfterMs,
      });
      sendTelemetry({ outcome: "rate_limited", scope: "ip", ipHash });
      return buildErrorResponse(429, "Too many attempts from this IP", { retryAfterMs: ipResult.retryAfterMs });
    }
  }

  const limiterResult = await verificationLimiter.consume(phone);
  const maskedPhone = maskMsisdn(phone);
  const phoneHash = hashPhoneForTelemetry(phone);

  if (!limiterResult.success) {
    console.warn({
      event: "otp.verify.rate_limited",
      scope: "phone",
      maskedPhone,
      phoneHash,
      retryAfterMs: limiterResult.retryAfterMs,
    });
    sendTelemetry({ outcome: "rate_limited", scope: "phone", phoneHash, ipHash });
    return buildErrorResponse(429, "Too many verification attempts", { retryAfterMs: limiterResult.retryAfterMs });
  }

  const ok = await otpStore.consume(phone, code);
  if (!ok) {
    console.warn({
      event: "otp.verify.failure",
      reason: "code_mismatch",
      maskedPhone,
      phoneHash,
      ip: ipHash,
    });
    sendTelemetry({ outcome: "code_mismatch", phoneHash, ipHash });
    return buildErrorResponse(400, "Invalid or expired code");
  }

  console.info({
    event: "otp.verify.success",
    maskedPhone,
    phoneHash,
    ip: ipHash,
  });
  sendTelemetry({ outcome: "verified", phoneHash, ipHash });

  return NextResponse.json({ status: "verified" });
}
