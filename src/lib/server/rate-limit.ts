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
