import { createHash } from "node:crypto";

import { createRedisClient, type RedisClient } from "@/lib/server/redis-client";

export type RateLimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  retryAfterMs: number;
  totalHits: number;
  source: "redis" | "memory";
};

type RateLimiterOptions = {
  prefix: string;
  limit: number;
  windowMs: number;
  redisUrl?: string | null;
};

type AttemptState = {
  count: number;
  expiresAt: number;
};

const hashIdentifier = (identifier: string) => createHash("sha256").update(identifier).digest("hex");

const normaliseNumber = (value: unknown): number => {
  if (typeof value === "number") {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const normaliseTtl = (value: unknown, fallback: number): number => {
  const parsed = normaliseNumber(value);
  if (parsed <= 0) {
    return fallback;
  }
  return parsed;
};

export class RateLimiter {
  private readonly prefix: string;

  private readonly limit: number;

  private readonly windowMs: number;

  private readonly memoryStore = new Map<string, AttemptState>();

  private readonly redis: RedisClient | null;

  private redisHealthy = true;

  constructor(options: RateLimiterOptions) {
    this.prefix = options.prefix;
    this.limit = Math.max(1, options.limit);
    this.windowMs = Math.max(1000, options.windowMs);
    this.redis = createRedisClient(options.redisUrl ?? process.env.REDIS_URL);
  }

  async consume(identifier: string): Promise<RateLimitResult> {
    if (!identifier || identifier.trim().length === 0) {
      throw new Error("Rate limiter identifier is required");
    }

    if (this.redis && this.redisHealthy) {
      try {
        return await this.consumeRedis(identifier);
      } catch (error) {
        this.redisHealthy = false;
        return this.consumeMemory(identifier);
      }
    }

    return this.consumeMemory(identifier);
  }

  async reset(identifier: string): Promise<void> {
    const key = this.buildKey(identifier);
    this.memoryStore.delete(key);
    if (this.redis && this.redisHealthy) {
      try {
        await this.redis.sendCommand("DEL", key);
      } catch (error) {
        this.redisHealthy = false;
      }
    }
  }

  private async consumeRedis(identifier: string): Promise<RateLimitResult> {
    if (!this.redis) {
      return this.consumeMemory(identifier);
    }

    const key = this.buildKey(identifier);
    const attempts = normaliseNumber(await this.redis.sendCommand("INCR", key));

    if (attempts === 1) {
      await this.redis.sendCommand("PEXPIRE", key, this.windowMs);
    }

    if (attempts > this.limit) {
      const ttl = normaliseTtl(await this.redis.sendCommand("PTTL", key), this.windowMs);
      return {
        success: false,
        limit: this.limit,
        remaining: 0,
        retryAfterMs: ttl,
        totalHits: attempts,
        source: "redis",
      };
    }

    const ttl = normaliseTtl(await this.redis.sendCommand("PTTL", key), this.windowMs);
    return {
      success: true,
      limit: this.limit,
      remaining: Math.max(0, this.limit - attempts),
      retryAfterMs: ttl,
      totalHits: attempts,
      source: "redis",
    };
  }

  private consumeMemory(identifier: string): RateLimitResult {
    const key = this.buildKey(identifier);
    const now = Date.now();
    const existing = this.memoryStore.get(key);

    if (!existing || existing.expiresAt <= now) {
      this.memoryStore.set(key, { count: 1, expiresAt: now + this.windowMs });
      return {
        success: true,
        limit: this.limit,
        remaining: this.limit - 1,
        retryAfterMs: this.windowMs,
        totalHits: 1,
        source: "memory",
      };
    }

    const attempts = existing.count + 1;
    const remaining = Math.max(0, this.limit - attempts);

    this.memoryStore.set(key, { count: attempts, expiresAt: existing.expiresAt });

    if (attempts > this.limit) {
      return {
        success: false,
        limit: this.limit,
        remaining: 0,
        retryAfterMs: Math.max(0, existing.expiresAt - now),
        totalHits: attempts,
        source: "memory",
      };
    }

    return {
      success: true,
      limit: this.limit,
      remaining,
      retryAfterMs: Math.max(0, existing.expiresAt - now),
      totalHits: attempts,
      source: "memory",
    };
  }

  private buildKey(identifier: string) {
    return `${this.prefix}:${hashIdentifier(identifier)}`;
  }
}

export const createRateLimiter = (options: RateLimiterOptions) => new RateLimiter(options);
