import type { Logger } from '@nestjs/common';

export interface CircuitBreakerOptions {
  name: string;
  timeoutMs: number;
  failureThreshold: number;
  resetMs: number;
  halfOpenMaxCalls?: number;
  logger?: Pick<Logger, 'log' | 'warn' | 'error'>;
}

type CircuitBreakerState = 'closed' | 'open' | 'half-open';

export class CircuitBreakerOpenError extends Error {
  readonly retryAt: number;

  constructor(name: string, retryAt: number) {
    super(`${name} circuit breaker is open`);
    this.name = 'CircuitBreakerOpenError';
    this.retryAt = retryAt;
  }
}

export class CircuitBreakerTimeoutError extends Error {
  readonly timeoutMs: number;

  constructor(name: string, timeoutMs: number) {
    super(`${name} timed out after ${timeoutMs}ms`);
    this.name = 'CircuitBreakerTimeoutError';
    this.timeoutMs = timeoutMs;
  }
}

export class CircuitBreaker {
  private readonly name: string;
  private readonly timeoutMs: number;
  private readonly failureThreshold: number;
  private readonly resetMs: number;
  private readonly halfOpenMaxCalls: number;
  private readonly logger?: Pick<Logger, 'log' | 'warn' | 'error'>;

  private state: CircuitBreakerState = 'closed';
  private failureCount = 0;
  private nextAttempt = 0;
  private halfOpenCalls = 0;

  constructor(options: CircuitBreakerOptions) {
    this.name = options.name;
    this.timeoutMs = Math.max(1, options.timeoutMs);
    this.failureThreshold = Math.max(1, options.failureThreshold);
    this.resetMs = Math.max(100, options.resetMs);
    this.halfOpenMaxCalls = Math.max(1, options.halfOpenMaxCalls ?? 1);
    this.logger = options.logger;
  }

  async execute<T>(action: () => Promise<T>): Promise<T> {
    const now = Date.now();
    if (this.state === 'open') {
      if (now < this.nextAttempt) {
        throw new CircuitBreakerOpenError(this.name, this.nextAttempt);
      }
      this.state = 'half-open';
      this.halfOpenCalls = 0;
    }

    if (this.state === 'half-open') {
      if (this.halfOpenCalls >= this.halfOpenMaxCalls) {
        throw new CircuitBreakerOpenError(this.name, this.nextAttempt || now + this.resetMs);
      }
      this.halfOpenCalls += 1;
    }

    let timeoutId: NodeJS.Timeout | undefined;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new CircuitBreakerTimeoutError(this.name, this.timeoutMs));
      }, this.timeoutMs);
    });

    try {
      const result = await Promise.race([action(), timeoutPromise]);
      clearTimeout(timeoutId);
      this.recordSuccess();
      return result as T;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof CircuitBreakerTimeoutError) {
        this.recordFailure(error);
        throw error;
      }

      this.recordFailure(error as Error);
      throw error;
    }
  }

  private recordSuccess() {
    this.failureCount = 0;
    this.halfOpenCalls = 0;
    this.state = 'closed';
    this.logger?.log?.(`${this.name} circuit breaker closed`);
  }

  private recordFailure(error: Error) {
    if (this.state === 'half-open') {
      this.trip(error);
      return;
    }

    this.failureCount += 1;
    if (this.failureCount >= this.failureThreshold) {
      this.trip(error);
    }
  }

  private trip(error: Error) {
    this.state = 'open';
    this.failureCount = 0;
    this.halfOpenCalls = 0;
    this.nextAttempt = Date.now() + this.resetMs;
    this.logger?.warn?.(`${this.name} circuit breaker opened: ${error.message}`);
  }
}
