import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

import { POST as sendOtp } from "@/app/api/auth/otp/send/route";
import { createRedisClient } from "@/lib/server/redis-client";
import { resetOtpStoreForTests } from "@/lib/server/otp";

vi.mock("@/lib/observability/node-observability", () => ({
  setupNodeObservability: vi.fn(),
}));

const telemetryMock = vi.fn(async () => undefined);

vi.mock("@/lib/observability", async () => {
  const actual = await vi.importActual<typeof import("@/lib/observability")>("@/lib/observability");
  return {
    ...actual,
    dispatchTelemetryEvent: telemetryMock,
  };
});

const whatsappMock = vi.fn(async () => ({ ok: true, status: "mocked" as const }));

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
  process.env.OTP_PHONE_LIMIT = "2";
  process.env.OTP_IP_LIMIT = "5";
  resetOtpStoreForTests();
  await flushRedis();
});

afterAll(async () => {
  process.env = originalEnv;
  if (redisClient) {
    await redisClient.quit();
  }
});

describe("POST /api/auth/otp/send", () => {
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

  it("rejects invalid payload", async () => {
    const response = await sendOtp(new Request("http://localhost/api/auth/otp/send", { method: "POST" }));
    expect(response.status).toBe(400);
    const body = (await response.json()) as { message: string };
    expect(body.message).toMatch(/valid phone/i);
  });

  it("enforces per-phone rate limits", async () => {
    process.env.OTP_PHONE_LIMIT = "1";
    resetOtpStoreForTests();
    await flushRedis();

    const payload = { phone: "+250788123456" };
    const request = () =>
      sendOtp(
        new Request("http://localhost/api/auth/otp/send", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
        }),
      );

    const first = await request();
    expect(first.status).toBe(200);

    const second = await request();
    expect(second.status).toBe(429);
  });

  it("sends OTP and returns metadata", async () => {
    const payload = { phone: "+250788123456", channel: "whatsapp" };
    const response = await sendOtp(
      new Request("http://localhost/api/auth/otp/send", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-forwarded-for": "192.168.1.5",
        },
        body: JSON.stringify(payload),
      }),
    );

    expect(response.status).toBe(200);
    const body = (await response.json()) as { status: string; mock: boolean };
    expect(body.status).toBe("sent");
    expect(body.mock).toBe(true);
    expect(whatsappMock).toHaveBeenCalledOnce();
    expect(telemetryMock).toHaveBeenCalled();
  });
});
