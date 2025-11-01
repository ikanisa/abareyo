import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { POST as verifyOtp, __internal as verifyOtpInternal } from "@/app/api/auth/otp/verify/route";
import { POST as sendOtp, __internal as sendOtpInternal } from "@/app/api/auth/otp/send/route";
import { createRedisClient } from "@/lib/server/redis-client";
import { resetOtpStoreForTests } from "@/lib/server/otp";

vi.mock("@/lib/observability/node-observability", () => ({
  setupNodeObservability: vi.fn(),
}));

const telemetryMock = vi.hoisted(() => vi.fn(async () => undefined)) as ReturnType<typeof vi.fn>;

vi.mock("@/lib/observability", async () => {
  const actual = await vi.importActual<typeof import("@/lib/observability")>("@/lib/observability");
  return {
    ...actual,
    dispatchTelemetryEvent: telemetryMock,
  };
});

const whatsappMock = vi.hoisted(() => vi.fn(async () => ({ ok: true, status: "mocked" as const }))) as ReturnType<
  typeof vi.fn
>;

vi.mock("@/lib/server/otp/whatsapp", async () => {
  const actual = await vi.importActual<typeof import("@/lib/server/otp/whatsapp")>(
    "@/lib/server/otp/whatsapp",
  );
  return {
    ...actual,
    sendWhatsAppOtp: whatsappMock,
  };
});

const TEST_REDIS_URL = process.env.TEST_REDIS_URL ?? process.env.REDIS_URL ?? "redis://127.0.0.1:6379/15";
const redisClient = createRedisClient(TEST_REDIS_URL);
const originalEnv = { ...process.env };
let redisAvailable = false;

const flushRedis = async () => {
  if (redisClient && redisAvailable) {
    try {
      await redisClient.sendCommand("FLUSHDB");
    } catch (error) {
      // ignore
    }
  }
};

beforeEach(async () => {
  telemetryMock.mockClear();
  whatsappMock.mockClear();
  process.env.REDIS_URL = TEST_REDIS_URL;
  process.env.OTP_PHONE_LIMIT = "5";
  process.env.OTP_IP_LIMIT = "5";
  process.env.OTP_VERIFY_LIMIT = "2";
  process.env.OTP_VERIFY_IP_LIMIT = "5";
  resetOtpStoreForTests();
  await flushRedis();
  sendOtpInternal.resetRateLimiters();
  verifyOtpInternal.resetRateLimiters();
});

afterAll(async () => {
  process.env = originalEnv;
  if (redisClient && redisAvailable) {
    await redisClient.quit();
  }
});

describe("POST /api/auth/otp/verify", () => {
  beforeAll(async () => {
    if (redisClient) {
      try {
        await redisClient.sendCommand("PING");
        redisAvailable = true;
      } catch (error) {
        redisAvailable = false;
      }
    }
  });

  it("requires phone and code", async () => {
    const response = await verifyOtp(new Request("http://localhost/api/auth/otp/verify", { method: "POST" }));
    expect(response.status).toBe(400);
  });

  it("returns 400 for mismatched codes", async () => {
    const payload = { phone: "+250788000001" };
    await sendOtp(
      new Request("http://localhost/api/auth/otp/send", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      }),
    );

    const response = await verifyOtp(
      new Request("http://localhost/api/auth/otp/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ phone: payload.phone, code: "000000" }),
      }),
    );
    expect(response.status).toBe(400);
  });

  it("verifies valid code", async () => {
    const payload = { phone: "+250788000002" };
    const sendResponse = await sendOtp(
      new Request("http://localhost/api/auth/otp/send", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      }),
    );
    expect(sendResponse.status).toBe(200);

    const lastCall = whatsappMock.mock.calls.at(-1);
    const sentPayload = lastCall?.[0] as { code: string } | undefined;
    const actualCode = sentPayload?.code;
    expect(actualCode).toBeDefined();

    const response = await verifyOtp(
      new Request("http://localhost/api/auth/otp/verify", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-forwarded-for": "192.168.1.9",
        },
        body: JSON.stringify({ phone: payload.phone, code: actualCode }),
      }),
    );

    expect(response.status).toBe(200);
    const body = (await response.json()) as { status: string };
    expect(body.status).toBe("verified");
  });

  it("enforces verification rate limits", async () => {
    process.env.OTP_VERIFY_LIMIT = "1";
    resetOtpStoreForTests();
    await flushRedis();
    verifyOtpInternal.resetRateLimiters();

    const payload = { phone: "+250788000003" };
    const sendResponse = await sendOtp(
      new Request("http://localhost/api/auth/otp/send", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      }),
    );
    expect(sendResponse.status).toBe(200);

    const sentPayload = whatsappMock.mock.calls.at(-1)?.[0] as { code: string } | undefined;
    const code = sentPayload?.code;
    expect(code).toBeDefined();

    const first = await verifyOtp(
      new Request("http://localhost/api/auth/otp/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ phone: payload.phone, code }),
      }),
    );
    expect(first.status).toBe(200);

    const second = await verifyOtp(
      new Request("http://localhost/api/auth/otp/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ phone: payload.phone, code }),
      }),
    );
    expect(second.status).toBe(429);
  });
});
