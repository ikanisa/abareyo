import { Injectable, Logger, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';

import {
  CircuitBreaker,
  CircuitBreakerOpenError,
  CircuitBreakerTimeoutError,
} from '../../../observability/circuit-breaker.js';

@Injectable()
export class SupabaseAdminAuthService {
  private readonly logger = new Logger(SupabaseAdminAuthService.name);
  private readonly client: SupabaseClient | null;
  private readonly breaker: CircuitBreaker;

  constructor(private readonly configService: ConfigService) {
    const url = this.configService.get<string>('supabase.url');
    const serviceRoleKey = this.configService.get<string>('supabase.serviceRoleKey');
    const requestTimeoutMs = this.configService.get<number>('supabase.requestTimeoutMs', 4000);
    const breakerFailureThreshold = this.configService.get<number>('supabase.circuitBreaker.failureThreshold', 4);
    const breakerResetMs = this.configService.get<number>('supabase.circuitBreaker.resetMs', 30000);

    this.breaker = new CircuitBreaker({
      name: 'supabase-admin-auth',
      timeoutMs: requestTimeoutMs,
      failureThreshold: breakerFailureThreshold,
      resetMs: breakerResetMs,
      logger: this.logger,
    });

    if (!url || !serviceRoleKey) {
      this.client = null;
      if (process.env.NODE_ENV !== 'production') {
        this.logger.warn('Supabase admin authentication is not fully configured.');
      }
      return;
    }

    this.client = createClient(url, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    });
  }

  get isEnabled() {
    return this.client !== null;
  }

  async getUserFromAccessToken(accessToken: string): Promise<User> {
    if (!this.client) {
      throw new ServiceUnavailableException('Supabase admin authentication is not configured.');
    }

    if (!accessToken?.trim()) {
      throw new UnauthorizedException('A Supabase access token is required.');
    }

    let response;
    try {
      response = await this.breaker.execute(() => this.client!.auth.getUser(accessToken));
    } catch (error) {
      if (error instanceof CircuitBreakerOpenError) {
        this.logger.error('Supabase admin authentication circuit breaker is open');
        throw new ServiceUnavailableException('Supabase admin authentication is temporarily unavailable.');
      }
      if (error instanceof CircuitBreakerTimeoutError) {
        this.logger.warn(`Supabase admin authentication timed out after ${error.timeoutMs}ms`);
        throw new ServiceUnavailableException('Supabase admin authentication timed out. Please retry.');
      }
      throw error;
    }

    const { data, error } = response;

    if (error || !data.user) {
      this.logger.warn(
        JSON.stringify({
          event: 'admin.auth.supabase.invalidToken',
          error: error?.message ?? 'unknown',
        }),
      );
      throw new UnauthorizedException('Invalid Supabase access token.');
    }

    if (!data.user.email) {
      throw new UnauthorizedException('Supabase account is missing an email address.');
    }

    return data.user;
  }
}

