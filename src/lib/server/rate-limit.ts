import { createRedisClient } from "./redis-client";

type RateLimitConfig = {
  windowMs: number;
  max: number;
};

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

type RateLimitResult = {
  success: boolean;
  remaining: number;
  resetAt: number;
};

const GLOBAL_STORE_KEY = Symbol.for('abareyo.rateLimitStore');

type RateLimitStore = Map<string, RateLimitEntry>;

const getStore = (): RateLimitStore => {
  const globalWithStore = globalThis as typeof globalThis & {
    [GLOBAL_STORE_KEY]?: RateLimitStore;
  };

  if (!globalWithStore[GLOBAL_STORE_KEY]) {
    globalWithStore[GLOBAL_STORE_KEY] = new Map<string, RateLimitEntry>();
  }

  return globalWithStore[GLOBAL_STORE_KEY] as RateLimitStore;
};

export const consumeRateLimit = (
  key: string,
  config: RateLimitConfig,
): RateLimitResult => {
  const store = getStore();
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt <= now) {
    const resetAt = now + config.windowMs;
    store.set(key, { count: 1, resetAt });
    return {
      success: true,
      remaining: Math.max(config.max - 1, 0),
      resetAt,
    };
  }

  if (entry.count >= config.max) {
    return {
      success: false,
      remaining: 0,
      resetAt: entry.resetAt,
    };
  }

  entry.count += 1;
  store.set(key, entry);

  return {
    success: true,
    remaining: Math.max(config.max - entry.count, 0),
    resetAt: entry.resetAt,
  };
};

export const clearRateLimitBuckets = () => {
  const store = getStore();
  store.clear();
};

type RateLimiterOptions = {
  prefix: string;
  limit: number;
  windowMs: number;
  redisUrl?: string | null;
};

type RateLimiterSource = "memory" | "redis";

type RateLimiterConsumeResult = {
  success: boolean;
  remaining: number;
  retryAfterMs: number;
  source: RateLimiterSource;
};

type RateLimiter = {
  consume: (identifier: string) => Promise<RateLimiterConsumeResult>;
};

const LUA_RATE_LIMIT_SCRIPT = `
local limit = tonumber(ARGV[1])
local windowMs = tonumber(ARGV[2])
local key = KEYS[1]
local current = redis.call("GET", key)
if current then
  current = tonumber(current)
else
  current = 0
end

if current >= limit then
  local ttl = redis.call("PTTL", key)
  if ttl < 0 then
    ttl = windowMs
  end
  return {0, 0, ttl}
end

current = redis.call("INCR", key)
if current == 1 then
  redis.call("PEXPIRE", key, windowMs)
end

local ttl = redis.call("PTTL", key)
if ttl < 0 then
  ttl = windowMs
end

local remaining = limit - current
if remaining < 0 then
  remaining = 0
end

return {1, remaining, ttl}
`;

const toNumber = (value: unknown): number => {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10);
    if (Number.isNaN(parsed)) {
      throw new Error(`Expected numeric string value, received ${value}`);
    }
    return parsed;
  }

  if (value instanceof Buffer) {
    const parsed = Number.parseInt(value.toString(), 10);
    if (Number.isNaN(parsed)) {
      throw new Error(`Expected numeric buffer value, received ${value.toString()}`);
    }
    return parsed;
  }

  throw new Error("Unsupported Redis response value");
};

const computeRetryAfterMs = (resetAt: number) => Math.max(resetAt - Date.now(), 0);

export const createRateLimiter = ({
  prefix,
  limit,
  windowMs,
  redisUrl,
}: RateLimiterOptions): RateLimiter => {
  const config: RateLimitConfig = { max: limit, windowMs };
  const resolvedRedisUrl = redisUrl ?? process.env.RATE_LIMIT_REDIS_URL ?? process.env.REDIS_URL ?? null;
  const redisClient = createRedisClient(resolvedRedisUrl);

  const consumeFromMemory = (identifier: string): RateLimiterConsumeResult => {
    const key = `${prefix}:${identifier}`;
    const result = consumeRateLimit(key, config);
    return {
      success: result.success,
      remaining: result.remaining,
      retryAfterMs: computeRetryAfterMs(result.resetAt),
      source: "memory",
    };
  };

  const consumeFromRedis = async (identifier: string): Promise<RateLimiterConsumeResult | null> => {
    if (!redisClient) {
      return null;
    }

    try {
      const key = `${prefix}:${identifier}`;
      const response = await redisClient.sendCommand(
        "EVAL",
        LUA_RATE_LIMIT_SCRIPT,
        1,
        key,
        limit,
        windowMs,
      );

      if (!Array.isArray(response) || response.length < 3) {
        throw new Error("Unexpected redis rate limit response");
      }

      const successFlag = toNumber(response[0]);
      const remaining = toNumber(response[1]);
      const ttl = toNumber(response[2]);

      const retryAfterMs = ttl > 0 ? ttl : windowMs;

      return {
        success: successFlag === 1,
        remaining,
        retryAfterMs,
        source: "redis",
      };
    } catch (error) {
      console.warn(
        "rate-limit: redis consume failed, falling back to memory store",
        error instanceof Error ? error.message : error,
      );
      return null;
    }
  };

  return {
    consume: async (identifier: string) => {
      const redisResult = await consumeFromRedis(identifier);
      if (redisResult) {
        return redisResult;
      }
      return consumeFromMemory(identifier);
    },
  };
};

export type { RateLimiter, RateLimiterConsumeResult, RateLimiterOptions };
