import { randomInt, createHash, timingSafeEqual } from "node:crypto";

import { createRedisClient, type RedisClient } from "@/lib/server/redis-client";

const OTP_PREFIX = "otp:code";
const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes
const DEFAULT_LENGTH = 6;

const hashValue = (value: string) => createHash("sha256").update(value).digest();

const hashKey = (value: string) => `${OTP_PREFIX}:${createHash("sha256").update(value).digest("hex")}`;

type MemoryEntry = {
  hash: Buffer;
  expiresAt: number;
};

class OtpStore {
  private readonly redis: RedisClient | null;

  private redisHealthy = true;

  private readonly memoryStore = new Map<string, MemoryEntry>();

  constructor(redisUrl?: string | null) {
    this.redis = createRedisClient(redisUrl ?? process.env.REDIS_URL);
  }

  generate(length = DEFAULT_LENGTH) {
    const digits: string[] = [];
    for (let index = 0; index < length; index += 1) {
      digits.push(String(randomInt(0, 10)));
    }
    return digits.join("");
  }

  async save(identifier: string, code: string, ttlMs = DEFAULT_TTL_MS) {
    const key = hashKey(identifier);
    const hash = hashValue(code);
    const expiresAt = Date.now() + ttlMs;

    this.memoryStore.set(key, { hash, expiresAt });

    if (this.redis && this.redisHealthy) {
      try {
        await this.redis.sendCommand("SET", key, hash.toString("hex"), "PX", ttlMs, "NX");
      } catch (_error) {
        this.redisHealthy = false;
      }
    }
  }

  async consume(identifier: string, code: string) {
    const key = hashKey(identifier);
    const candidateHash = hashValue(code);

    if (this.redis && this.redisHealthy) {
      try {
        const stored = await this.redis.sendCommand("GET", key);
        if (typeof stored === "string" && stored.length > 0) {
          const storedBuffer = Buffer.from(stored, "hex");
          const match =
            storedBuffer.length === candidateHash.length && timingSafeEqual(storedBuffer, candidateHash);
          if (match) {
            await this.redis.sendCommand("DEL", key);
            this.memoryStore.delete(key);
            return true;
          }
          return false;
        }
      } catch (_error) {
        this.redisHealthy = false;
      }
    }

    const entry = this.memoryStore.get(key);
    if (!entry) {
      return false;
    }

    const isExpired = entry.expiresAt <= Date.now();
    if (isExpired) {
      this.memoryStore.delete(key);
      return false;
    }

    const match = entry.hash.length === candidateHash.length && timingSafeEqual(entry.hash, candidateHash);
    if (match) {
      this.memoryStore.delete(key);
      return true;
    }
    return false;
  }

  async invalidate(identifier: string) {
    const key = hashKey(identifier);
    this.memoryStore.delete(key);
    if (this.redis && this.redisHealthy) {
      try {
        await this.redis.sendCommand("DEL", key);
      } catch (_error) {
        this.redisHealthy = false;
      }
    }
  }
}

let singleton: OtpStore | null = null;

export const getOtpStore = () => {
  if (!singleton) {
    singleton = new OtpStore();
  }
  return singleton;
};

export const resetOtpStoreForTests = () => {
  singleton = null;
};

export const DEFAULT_OTP_TTL_MS = DEFAULT_TTL_MS;
