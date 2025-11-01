import { createHash, timingSafeEqual } from 'node:crypto';

import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import type { Redis as RedisClient } from 'ioredis';

type VerificationResult =
  | { status: 'verified' }
  | { status: 'not_found' }
  | { status: 'expired' }
  | { status: 'invalid'; attemptsRemaining: number }
  | { status: 'locked' };

type MemoryOtpRecord = {
  codeHash: Buffer;
  expiresAt: number;
  attempts: number;
};

type MemoryCounter = {
  count: number;
  first: number;
};

type MemoryEvent = { raw: string; timestamp: number };

type BlacklistKind = 'phone' | 'ip';

@Injectable()
export class OtpStore implements OnModuleDestroy {
  private readonly logger = new Logger(OtpStore.name);
  private readonly redis: RedisClient | null;
  private redisEnabled: boolean;
  private lastRedisError: string | null = null;
  private readonly prefix: string;

  private readonly codes = new Map<string, MemoryOtpRecord>();
  private readonly counters = new Map<string, MemoryCounter>();
  private readonly cooldowns = new Map<string, number>();
  private readonly blacklistMemory: Record<BlacklistKind, Set<string>> = {
    phone: new Set(),
    ip: new Set(),
  };
  private readonly events: MemoryEvent[] = [];
  private readonly blacklistNotesMemory: Record<BlacklistKind, Map<string, string>> = {
    phone: new Map(),
    ip: new Map(),
  };

  constructor(private readonly configService: ConfigService) {
    this.prefix = this.configService.get<string>('otp.redisPrefix', 'otp');
    const redisUrl = this.configService.get<string>('redis.url');
    if (redisUrl) {
      this.redis = new (Redis as unknown as { new (...args: any[]): RedisClient })(redisUrl, {
        lazyConnect: true,
        maxRetriesPerRequest: 1,
        enableOfflineQueue: false,
      });
      this.redisEnabled = true;
      this.redis.on('error', (error) => {
        this.lastRedisError = error instanceof Error ? error.message : String(error);
        if (this.redisEnabled) {
          this.logger.error('Redis error in OTP store', error as Error);
        }
        this.redisEnabled = false;
      });
    } else {
      this.redis = null;
      this.redisEnabled = false;
      this.logger.warn('Redis URL missing – OTP store using in-memory fallback only.');
    }
  }

  getRedisStatus() {
    return {
      healthy: Boolean(this.redis && this.redisEnabled),
      mode: this.redis && this.redisEnabled ? 'redis' : 'memory',
      lastError: this.lastRedisError,
    } as const;
  }

  hashIdentifier(value: string) {
    return createHash('sha256').update(value).digest('hex');
  }

  async storeCode(identifier: string, code: string, ttlSeconds: number) {
    const codeHash = this.hashBuffer(code).toString('hex');
    const expiresAt = Date.now() + ttlSeconds * 1000;
    const key = this.buildKey(`code:${identifier}`);

    if (this.redis && this.redisEnabled) {
      try {
        await this.redis.set(key, JSON.stringify({ codeHash, expiresAt, attempts: 0 }), 'PX', ttlSeconds * 1000);
        return;
      } catch (error) {
        this.logger.warn('Redis unavailable for OTP code storage, using memory fallback', error as Error);
        this.redisEnabled = false;
        this.lastRedisError = error instanceof Error ? error.message : String(error);
      }
    }

    this.codes.set(identifier, {
      codeHash: Buffer.from(codeHash, 'hex'),
      expiresAt,
      attempts: 0,
    });
  }

  async verifyCode(identifier: string, code: string, maxAttempts: number): Promise<VerificationResult> {
    const key = this.buildKey(`code:${identifier}`);

    if (this.redis && this.redisEnabled) {
      try {
        const stored = await this.redis.get(key);
        if (!stored) {
          return { status: 'not_found' };
        }
        const payload = JSON.parse(stored) as { codeHash: string; expiresAt: number; attempts: number };
        if (Date.now() > payload.expiresAt) {
          await this.redis.del(key);
          return { status: 'expired' };
        }

        const providedHash = this.hashBuffer(code).toString('hex');
        const matches = timingSafeEqual(Buffer.from(payload.codeHash, 'hex'), Buffer.from(providedHash, 'hex'));
        if (!matches) {
          const attempts = payload.attempts + 1;
          if (attempts >= maxAttempts) {
            await this.redis.del(key);
            return { status: 'locked' };
          }
          await this.redis.set(
            key,
            JSON.stringify({ ...payload, attempts }),
            'PX',
            Math.max(payload.expiresAt - Date.now(), 1000),
          );
          return { status: 'invalid', attemptsRemaining: Math.max(0, maxAttempts - attempts) };
        }

        await this.redis.del(key);
        return { status: 'verified' };
      } catch (error) {
        this.logger.warn('Redis unavailable for OTP verification, using memory fallback', error as Error);
        this.redisEnabled = false;
        this.lastRedisError = error instanceof Error ? error.message : String(error);
      }
    }

    const record = this.codes.get(identifier);
    if (!record) {
      return { status: 'not_found' };
    }
    if (Date.now() > record.expiresAt) {
      this.codes.delete(identifier);
      return { status: 'expired' };
    }

    const providedHash = this.hashBuffer(code);
    const matches = timingSafeEqual(record.codeHash, providedHash);
    if (!matches) {
      record.attempts += 1;
      if (record.attempts >= maxAttempts) {
        this.codes.delete(identifier);
        return { status: 'locked' };
      }
      this.codes.set(identifier, record);
      return { status: 'invalid', attemptsRemaining: Math.max(0, maxAttempts - record.attempts) };
    }

    this.codes.delete(identifier);
    return { status: 'verified' };
  }

  async clearCode(identifier: string) {
    const key = this.buildKey(`code:${identifier}`);
    if (this.redis && this.redisEnabled) {
      try {
        await this.redis.del(key);
      } catch (error) {
        this.logger.warn('Redis unavailable when clearing OTP code', error as Error);
        this.redisEnabled = false;
        this.lastRedisError = error instanceof Error ? error.message : String(error);
      }
    }
    this.codes.delete(identifier);
  }

  async incrementWindowCounter(keySuffix: string, windowSeconds: number) {
    const key = this.buildKey(`rate:${keySuffix}`);
    if (this.redis && this.redisEnabled) {
      try {
        const count = await this.redis.incr(key);
        if (count === 1) {
          await this.redis.pexpire(key, windowSeconds * 1000);
        }
        return count;
      } catch (error) {
        this.logger.warn('Redis unavailable for OTP rate limiting, using memory fallback', error as Error);
        this.redisEnabled = false;
        this.lastRedisError = error instanceof Error ? error.message : String(error);
      }
    }

    const now = Date.now();
    const existing = this.counters.get(key);
    if (!existing || now - existing.first > windowSeconds * 1000) {
      this.counters.set(key, { count: 1, first: now });
      return 1;
    }
    existing.count += 1;
    this.counters.set(key, existing);
    return existing.count;
  }

  async getCooldownRemaining(keySuffix: string) {
    const key = this.buildKey(`cooldown:${keySuffix}`);
    if (this.redis && this.redisEnabled) {
      try {
        const ttl = await this.redis.pttl(key);
        return ttl > 0 ? ttl : 0;
      } catch (error) {
        this.logger.warn('Redis unavailable for OTP cooldown lookup, using memory fallback', error as Error);
        this.redisEnabled = false;
        this.lastRedisError = error instanceof Error ? error.message : String(error);
      }
    }

    const expiry = this.cooldowns.get(key);
    if (!expiry) {
      return 0;
    }
    const remaining = expiry - Date.now();
    if (remaining <= 0) {
      this.cooldowns.delete(key);
      return 0;
    }
    return remaining;
  }

  async startCooldown(keySuffix: string, seconds: number) {
    const key = this.buildKey(`cooldown:${keySuffix}`);
    if (this.redis && this.redisEnabled) {
      try {
        await this.redis.set(key, '1', 'PX', Math.max(1000, seconds * 1000));
        return;
      } catch (error) {
        this.logger.warn('Redis unavailable for OTP cooldown tracking, using memory fallback', error as Error);
        this.redisEnabled = false;
        this.lastRedisError = error instanceof Error ? error.message : String(error);
      }
    }

    this.cooldowns.set(key, Date.now() + seconds * 1000);
  }

  async addToBlacklist(kind: BlacklistKind, value: string) {
    const key = this.buildKey(`blacklist:${kind}`);
    if (this.redis && this.redisEnabled) {
      try {
        await this.redis.sadd(key, value);
        return;
      } catch (error) {
        this.logger.warn('Redis unavailable for OTP blacklist update, using memory fallback', error as Error);
        this.redisEnabled = false;
        this.lastRedisError = error instanceof Error ? error.message : String(error);
      }
    }

    this.blacklistMemory[kind].add(value);
  }

  async removeFromBlacklist(kind: BlacklistKind, value: string) {
    const key = this.buildKey(`blacklist:${kind}`);
    if (this.redis && this.redisEnabled) {
      try {
        await this.redis.srem(key, value);
        await this.setBlacklistNote(kind, value, null);
        return;
      } catch (error) {
        this.logger.warn('Redis unavailable for OTP blacklist removal, using memory fallback', error as Error);
        this.redisEnabled = false;
        this.lastRedisError = error instanceof Error ? error.message : String(error);
      }
    }

    this.blacklistMemory[kind].delete(value);
    this.blacklistNotesMemory[kind].delete(value);
  }

  async listBlacklist(kind: BlacklistKind) {
    const key = this.buildKey(`blacklist:${kind}`);
    if (this.redis && this.redisEnabled) {
      try {
        const members = await this.redis.smembers(key);
        return members ?? [];
      } catch (error) {
        this.logger.warn('Redis unavailable for OTP blacklist listing, using memory fallback', error as Error);
        this.redisEnabled = false;
        this.lastRedisError = error instanceof Error ? error.message : String(error);
      }
    }

    return Array.from(this.blacklistMemory[kind]);
  }

  async setBlacklistNote(kind: BlacklistKind, value: string, note?: string | null) {
    const key = this.buildKey(`blacklist_notes:${kind}`);
    if (this.redis && this.redisEnabled) {
      try {
        if (note && note.trim()) {
          await this.redis.hset(key, value, note.trim());
        } else {
          await this.redis.hdel(key, value);
        }
        return;
      } catch (error) {
        this.logger.warn('Redis unavailable for OTP blacklist note update, using memory fallback', error as Error);
        this.redisEnabled = false;
        this.lastRedisError = error instanceof Error ? error.message : String(error);
      }
    }

    if (note && note.trim()) {
      this.blacklistNotesMemory[kind].set(value, note.trim());
    } else {
      this.blacklistNotesMemory[kind].delete(value);
    }
  }

  async getBlacklistNotes(kind: BlacklistKind) {
    const key = this.buildKey(`blacklist_notes:${kind}`);
    if (this.redis && this.redisEnabled) {
      try {
        const entries = await this.redis.hgetall(key);
        return entries ?? {};
      } catch (error) {
        this.logger.warn('Redis unavailable for OTP blacklist note retrieval, using memory fallback', error as Error);
        this.redisEnabled = false;
        this.lastRedisError = error instanceof Error ? error.message : String(error);
      }
    }

    return Object.fromEntries(this.blacklistNotesMemory[kind]);
  }

  async pushEvent(raw: Record<string, unknown>, limit: number) {
    const payload = JSON.stringify({ ...raw, timestamp: Date.now() });
    const key = this.buildKey('events');
    if (this.redis && this.redisEnabled) {
      try {
        await this.redis.lpush(key, payload);
        await this.redis.ltrim(key, 0, Math.max(0, limit - 1));
        return;
      } catch (error) {
        this.logger.warn('Redis unavailable for OTP event logging, using memory fallback', error as Error);
        this.redisEnabled = false;
        this.lastRedisError = error instanceof Error ? error.message : String(error);
      }
    }

    this.events.unshift({ raw: payload, timestamp: Date.now() });
    if (this.events.length > limit) {
      this.events.length = limit;
    }
  }

  async listEvents(limit: number) {
    const key = this.buildKey('events');
    if (this.redis && this.redisEnabled) {
      try {
        const entries = await this.redis.lrange(key, 0, Math.max(0, limit - 1));
        return entries.map((entry) => JSON.parse(entry) as Record<string, unknown>);
      } catch (error) {
        this.logger.warn('Redis unavailable for OTP event retrieval, using memory fallback', error as Error);
        this.redisEnabled = false;
        this.lastRedisError = error instanceof Error ? error.message : String(error);
      }
    }

    return this.events.slice(0, limit).map((entry) => JSON.parse(entry.raw) as Record<string, unknown>);
  }

  async onModuleDestroy() {
    if (this.redis) {
      try {
        await this.redis.quit();
      } catch (error) {
        this.logger.warn('Failed to close Redis connection for OTP store', error as Error);
      }
    }
  }

  private buildKey(suffix: string) {
    return `${this.prefix}:${suffix}`;
  }

  private hashBuffer(value: string) {
    return createHash('sha256').update(value).digest();
  }
}

export type { VerificationResult };
