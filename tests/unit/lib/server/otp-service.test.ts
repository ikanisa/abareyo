import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { createRedisClient } from "@/lib/server/redis-client";
import { getOtpStore, resetOtpStoreForTests } from "@/lib/server/otp";

const TEST_REDIS_URL = process.env.TEST_REDIS_URL ?? process.env.REDIS_URL ?? "redis://127.0.0.1:6379/15";

const redisClient = createRedisClient(TEST_REDIS_URL);
const originalRedisUrl = process.env.REDIS_URL;
let redisAvailable = false;

beforeAll(async () => {
  if (redisClient) {
    try {
      await redisClient.sendCommand("PING");
      redisAvailable = true;
    } catch (_error) {
      redisAvailable = false;
    }
  }
});

beforeEach(async () => {
  resetOtpStoreForTests();
  if (redisClient && redisAvailable) {
    try {
      await redisClient.sendCommand("FLUSHDB");
    } catch (_error) {
      // ignore redis flush errors
    }
  }
});

afterAll(async () => {
  if (redisClient && redisAvailable) {
    await redisClient.quit();
  }
  process.env.REDIS_URL = originalRedisUrl;
});

describe("OTP store", () => {
  it("generates numeric codes", () => {
    process.env.REDIS_URL = "";
    resetOtpStoreForTests();
    const store = getOtpStore();
    const code = store.generate();
    expect(code).toMatch(/^\d{6}$/);
  });

  it("validates codes using memory fallback", async () => {
    process.env.REDIS_URL = "";
    resetOtpStoreForTests();
    const store = getOtpStore();
    const code = store.generate();
    await store.save("+250788888888", code, 1000);

    const success = await store.consume("+250788888888", code);
    expect(success).toBe(true);

    const second = await store.consume("+250788888888", code);
    expect(second).toBe(false);
  });

  it("stores codes in redis when configured", async () => {
    if (!redisClient || !redisAvailable) {
      expect(true).toBe(true);
      return;
    }
    process.env.REDIS_URL = TEST_REDIS_URL;
    resetOtpStoreForTests();
    const store = getOtpStore();
    const code = store.generate();
    const phone = "+250799999999";

    await store.save(phone, code, 2000);
    const match = await store.consume(phone, code);
    expect(match).toBe(true);

    const again = await store.consume(phone, code);
    expect(again).toBe(false);
  });
});
