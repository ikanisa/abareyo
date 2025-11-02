import { createHash } from "node:crypto";

import { NextRequest, NextResponse } from "next/server";

import { maskMsisdn } from "@/lib/msisdn";
import { dispatchTelemetryEvent } from "@/lib/observability";
import { setupNodeObservability } from "@/lib/observability/node-observability";
import { createRateLimiter } from "@/lib/server/rate-limit";
import { DEFAULT_OTP_TTL_MS, getOtpStore } from "@/lib/server/otp";
import { normalizePhoneNumber } from "@/lib/server/otp/normalize";
import { hashPhoneForTelemetry, sendWhatsAppOtp } from "@/lib/server/otp/whatsapp";
import { getClientIp } from "@/lib/server/request-ip";

setupNodeObservability("otp-api");

const parseEnvInteger = (value: string | undefined, fallback: number) => {
  if (!value) {
    return fallback;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const PHONE_LIMIT = parseEnvInteger(process.env.OTP_PHONE_LIMIT, 5);
const PHONE_WINDOW_MS = parseEnvInteger(process.env.OTP_PHONE_WINDOW_MS, 60 * 60 * 1000);
const IP_LIMIT = parseEnvInteger(process.env.OTP_IP_LIMIT, 20);
const IP_WINDOW_MS = parseEnvInteger(process.env.OTP_IP_WINDOW_MS, 60 * 60 * 1000);
const phoneLimiter = createRateLimiter({ prefix: "otp:phone", limit: PHONE_LIMIT, windowMs: PHONE_WINDOW_MS });
const ipLimiter = createRateLimiter({ prefix: "otp:ip", limit: IP_LIMIT, windowMs: IP_WINDOW_MS });

const otpStore = getOtpStore();

const hashIp = (ip: string | null) =>
  ip && ip.length > 0 ? createHash("sha256").update(ip).digest("hex").slice(0, 16) : null;

const sendTelemetry = (payload: Record<string, unknown>) => {
  void dispatchTelemetryEvent({ type: "otp.send", ...payload });
};

const parseBody = async (request: NextRequest) => {
  try {
    return (await request.json()) as Record<string, unknown>;
  } catch (_error) {
    return null;
  }
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
  const startedAt = Date.now();
  const ip = getClientIp(request);
  const ipHash = hashIp(ip);
  const body = await parseBody(request);

  const rawPhone = typeof body?.phone === "string" ? body.phone : "";
  const locale = typeof body?.locale === "string" ? body.locale : null;
  const channel = typeof body?.channel === "string" ? body.channel.toLowerCase() : "whatsapp";

  const phone = normalizePhoneNumber(rawPhone);
  if (!phone) {
    console.warn({ event: "otp.send.failure", reason: "invalid_phone", ip: ipHash ?? null });
    sendTelemetry({ outcome: "invalid_phone", ipHash, channel });
    return buildErrorResponse(400, "A valid phone number is required");
  }

  const maskedPhone = maskMsisdn(phone);
  const phoneHash = hashPhoneForTelemetry(phone);

  if (ip) {
    const ipResult = await ipLimiter.consume(ip);
    if (!ipResult.success) {
      console.warn({
        event: "otp.send.rate_limited",
        scope: "ip",
        ip: ipHash,
        remaining: ipResult.remaining,
        retryAfterMs: ipResult.retryAfterMs,
      });
      sendTelemetry({ outcome: "rate_limited", scope: "ip", ipHash, phoneHash, channel });
      return buildErrorResponse(429, "Too many requests from this IP", {
        retryAfterMs: ipResult.retryAfterMs,
      });
    }
  }

  const phoneResult = await phoneLimiter.consume(phone);
  if (!phoneResult.success) {
    console.warn({
      event: "otp.send.rate_limited",
      scope: "phone",
      maskedPhone,
      phoneHash,
      retryAfterMs: phoneResult.retryAfterMs,
    });
    sendTelemetry({ outcome: "rate_limited", scope: "phone", phoneHash, channel });
    return buildErrorResponse(429, "Too many verification attempts", {
      retryAfterMs: phoneResult.retryAfterMs,
    });
  }

  const code = otpStore.generate();
  await otpStore.save(phone, code);

  const delivery = await sendWhatsAppOtp({ phone, code, locale });
  const latencyMs = Date.now() - startedAt;

  if (!delivery.ok) {
    console.error({
      event: "otp.send.failure",
      reason: "delivery_error",
      maskedPhone,
      phoneHash,
      ip: ipHash,
      error: delivery.error,
      latencyMs,
    });
    sendTelemetry({ outcome: "delivery_error", phoneHash, ipHash, channel });
    return buildErrorResponse(502, "Failed to deliver OTP", { reason: delivery.error });
  }

  console.info({
    event: "otp.send.success",
    maskedPhone,
    phoneHash,
    ip: ipHash,
    channel,
    delivery: delivery.status,
    latencyMs,
    remaining: {
      phone: phoneResult.remaining,
    },
  });

  sendTelemetry({
    outcome: "sent",
    phoneHash,
    ipHash,
    channel,
    delivery: delivery.status,
  });

  return NextResponse.json({
    status: "sent",
    channel,
    delivery: delivery.status,
    mock: delivery.status === "mocked",
    expiresInSeconds: Math.floor(DEFAULT_OTP_TTL_MS / 1000),
  });
}
