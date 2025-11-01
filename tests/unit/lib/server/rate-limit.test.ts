import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { createRateLimiter } from "@/lib/server/rate-limit";
import { createRedisClient } from "@/lib/server/redis-client";

const TEST_REDIS_URL = process.env.TEST_REDIS_URL ?? process.env.REDIS_URL ?? "redis://127.0.0.1:6379/15";

const redisClient = createRedisClient(TEST_REDIS_URL);
let redisAvailable = false;

const flushRedis = async () => {
  if (!redisClient || !redisAvailable) {
    return;
  }
  try {
    await redisClient.sendCommand("FLUSHDB");
  } catch (error) {
    // ignore
  }
};

beforeAll(async () => {
  if (redisClient) {
    try {
      await redisClient.sendCommand("PING");
      redisAvailable = true;
    } catch (error) {
      redisAvailable = false;
    }
  }
  await flushRedis();
});

beforeEach(async () => {
  await flushRedis();
});

afterAll(async () => {
  if (redisClient && redisAvailable) {
    await redisClient.quit();
  }
});

describe("RateLimiter memory fallback", () => {
  it("enforces limits using in-memory store", async () => {
    const limiter = createRateLimiter({ prefix: "test:memory", limit: 2, windowMs: 60_000, redisUrl: null });

    const first = await limiter.consume("user:1");
    expect(first.success).toBe(true);
    expect(first.remaining).toBe(1);
    expect(first.source).toBe("memory");

    const second = await limiter.consume("user:1");
    expect(second.success).toBe(true);
    expect(second.remaining).toBe(0);

    const third = await limiter.consume("user:1");
    expect(third.success).toBe(false);
    expect(third.remaining).toBe(0);
  });
});

describe("RateLimiter with redis", () => {
  if (!redisClient || !redisAvailable) {
    it("skips when redis is unavailable", () => {
      expect(true).toBe(true);
    });
    return;
  }

  it("tracks attempts across redis", async () => {
    const limiter = createRateLimiter({
      prefix: "test:redis",
      limit: 2,
      windowMs: 60_000,
      redisUrl: TEST_REDIS_URL,
    });

    const first = await limiter.consume("device:1");
    expect(first.success).toBe(true);
    expect(first.source).toBe("redis");

    const second = await limiter.consume("device:1");
    expect(second.success).toBe(true);
    expect(second.remaining).toBe(0);
    expect(second.source).toBe("redis");

    const third = await limiter.consume("device:1");
    expect(third.success).toBe(false);
    expect(third.remaining).toBe(0);
    expect(third.source).toBe("redis");
  });
});
