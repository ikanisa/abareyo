import { createHash } from 'node:crypto';

import { Injectable, Logger, OnModuleDestroy, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import type { Redis as RedisClient } from 'ioredis';

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const REDIS_PREFIX = 'admin:login:attempt';

type AttemptState = {
  count: number;
  firstAttempt: number;
};

@Injectable()
export class LoginRateLimiterService implements OnModuleDestroy {
  private readonly logger = new Logger(LoginRateLimiterService.name);
  private readonly fallbackAttempts = new Map<string, AttemptState>();
  private readonly redis: RedisClient | null;
  private redisEnabled: boolean;

  constructor(private readonly configService: ConfigService) {
    const redisUrl = this.configService.get<string>('redis.url');
    if (redisUrl) {
      this.redis = new (Redis as unknown as { new (...args: any[]): RedisClient })(redisUrl, {
        lazyConnect: true,
        maxRetriesPerRequest: 1,
        enableOfflineQueue: false,
      });
      this.redisEnabled = true;
      this.redis.on('error', (error) => {
        if (this.redisEnabled) {
          this.logger.error('Redis error in admin login rate limiter', error as Error);
        }
      });
    } else {
      this.redis = null;
      this.redisEnabled = false;
      this.logger.warn('Redis URL missing – admin login rate limiting will use in-memory fallback only.');
    }
  }

  async registerAttempt(key: string) {
    const count = await this.incrementAttempts(key);
    if (count > MAX_ATTEMPTS) {
      throw new HttpException('Too many login attempts. Please try again soon.', HttpStatus.TOO_MANY_REQUESTS);
    }
  }

  async reset(key: string) {
    const hashedKey = this.hashKey(key);
    if (this.redis && this.redisEnabled) {
      try {
        await this.redis.del(hashedKey);
      } catch (error) {
        this.logger.warn('Failed to clear Redis rate limit key, falling back to memory', error as Error);
        this.redisEnabled = false;
      }
    }

    this.fallbackAttempts.delete(key);
  }

  async onModuleDestroy() {
    if (this.redis) {
      try {
        await this.redis.quit();
      } catch (error) {
        this.logger.warn('Failed to close Redis connection for login rate limiter', error as Error);
      }
    }
  }

  private async incrementAttempts(key: string) {
    if (this.redis && this.redisEnabled) {
      try {
        const redisKey = this.hashKey(key);
        const attemptCount = await this.redis.incr(redisKey);
        if (attemptCount === 1) {
          await this.redis.pexpire(redisKey, WINDOW_MS);
        }
        return attemptCount;
      } catch (error) {
        this.logger.warn('Redis unavailable for login rate limiting, switching to memory fallback', error as Error);
        this.redisEnabled = false;
      }
    }

    return this.incrementAttemptsInMemory(key);
  }

  private incrementAttemptsInMemory(key: string) {
    const now = Date.now();
    const attempt = this.fallbackAttempts.get(key);

    if (!attempt || now - attempt.firstAttempt > WINDOW_MS) {
      this.fallbackAttempts.set(key, { count: 1, firstAttempt: now });
      return 1;
    }

    const nextCount = attempt.count + 1;
    this.fallbackAttempts.set(key, { count: nextCount, firstAttempt: attempt.firstAttempt });
    return nextCount;
  }

  private hashKey(key: string) {
    return `${REDIS_PREFIX}:${createHash('sha256').update(key).digest('hex')}`;
  }
}
