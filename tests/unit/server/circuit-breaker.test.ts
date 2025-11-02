import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  CircuitBreaker,
  CircuitBreakerOpenError,
  CircuitBreakerTimeoutError,
} from '../../../backend/src/observability/circuit-breaker.js';

const createLogger = () => ({
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
});

describe('CircuitBreaker', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01T00:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('closes after successful execution following an open state', async () => {
    const logger = createLogger();
    const breaker = new CircuitBreaker({
      name: 'demo',
      timeoutMs: 50,
      failureThreshold: 2,
      resetMs: 500,
      logger,
    });

    const failingAction = vi.fn().mockRejectedValue(new Error('boom'));

    await expect(breaker.execute(failingAction)).rejects.toThrow('boom');
    await expect(breaker.execute(failingAction)).rejects.toThrow('boom');

    await expect(breaker.execute(async () => 'ignored')).rejects.toBeInstanceOf(CircuitBreakerOpenError);
    expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('demo circuit breaker opened'));

    await vi.advanceTimersByTimeAsync(500);

    const success = vi.fn().mockResolvedValue('ok');
    await expect(breaker.execute(success)).resolves.toBe('ok');
    expect(success).toHaveBeenCalledTimes(1);
    expect(logger.log).toHaveBeenCalledWith(expect.stringContaining('demo circuit breaker closed'));
  });

  it('throws a timeout error and keeps the breaker open until reset', async () => {
    vi.useRealTimers();
    const breaker = new CircuitBreaker({
      name: 'timeout-demo',
      timeoutMs: 20,
      failureThreshold: 1,
      resetMs: 60,
      logger: createLogger(),
    });

    const awaited = breaker.execute(() => new Promise(() => {})).catch((error) => {
      throw error;
    });
    await expect(awaited).rejects.toBeInstanceOf(CircuitBreakerTimeoutError);
    await expect(breaker.execute(async () => 'next')).rejects.toBeInstanceOf(CircuitBreakerOpenError);

    await new Promise((resolve) => setTimeout(resolve, 120));

    await expect(breaker.execute(async () => 'ok')).resolves.toBe('ok');
  });

  it('reopens immediately when a half-open call fails', async () => {
    const breaker = new CircuitBreaker({
      name: 'half-open-demo',
      timeoutMs: 75,
      failureThreshold: 1,
      resetMs: 300,
      logger: createLogger(),
    });

    await expect(
      breaker.execute(async () => {
        throw new Error('initial failure');
      }),
    ).rejects.toThrow('initial failure');

    await expect(breaker.execute(async () => 'blocked')).rejects.toBeInstanceOf(CircuitBreakerOpenError);

    await vi.advanceTimersByTimeAsync(300);

    await expect(
      breaker.execute(async () => {
        throw new Error('half-open failure');
      }),
    ).rejects.toThrow('half-open failure');

    await expect(breaker.execute(async () => 'still blocked')).rejects.toBeInstanceOf(CircuitBreakerOpenError);
  });
});

