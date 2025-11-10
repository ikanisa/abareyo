import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { GET } from '@/app/api/health/route';

const buildSupabaseStub = () => {
  const throwOnError = vi.fn().mockResolvedValue({ data: null, error: null });
  const select = vi.fn(() => ({ throwOnError }));
  const from = vi.fn(() => ({ select }));
  return { from, select, throwOnError };
};

const supabaseServiceStub = buildSupabaseStub();
const supabaseAnonStub = buildSupabaseStub();

const supabaseServiceGetter = vi.fn(() => supabaseServiceStub as unknown);
const supabaseAnonGetter = vi.fn(() => supabaseAnonStub as unknown);

const redisSendCommand = vi.fn();
const redisQuit = vi.fn();
const redisClient = { sendCommand: redisSendCommand, quit: redisQuit } as const;
const createRedisClient = vi.fn(() => redisClient);

vi.mock('@/lib/db', () => ({
  tryGetSupabaseServiceRoleClient: () => supabaseServiceGetter(),
  tryGetSupabaseServerAnonClient: () => supabaseAnonGetter(),
}));

vi.mock('@/lib/server/redis-client', () => ({
  createRedisClient: (url: string) => createRedisClient(url),
}));

const originalEnv = { ...process.env };

describe('GET /api/health', () => {
  beforeEach(() => {
    Object.assign(process.env, originalEnv);
    supabaseServiceGetter.mockReturnValue(supabaseServiceStub as unknown);
    supabaseAnonGetter.mockReturnValue(supabaseAnonStub as unknown);
    supabaseServiceStub.from.mockClear();
    supabaseServiceStub.select.mockClear();
    supabaseServiceStub.throwOnError.mockClear();
    supabaseAnonStub.from.mockClear();
    supabaseAnonStub.select.mockClear();
    supabaseAnonStub.throwOnError.mockClear();
    redisSendCommand.mockReset().mockResolvedValue('PONG');
    redisQuit.mockReset().mockResolvedValue(undefined);
    createRedisClient.mockReset().mockReturnValue(redisClient);
    process.env.REDIS_URL = 'redis://localhost:6379/9';
  });

  afterEach(() => {
    Object.assign(process.env, originalEnv);
  });

  it('reports success when dependencies respond', async () => {
    const response = await GET();
    expect(response.status).toBe(200);
    const payload = (await response.json()) as {
      ok: boolean;
      checks: { supabase: { status: string }; redis: { status: string } };
    };
    expect(payload.ok).toBe(true);
    expect(payload.checks.supabase.status).toBe('ok');
    expect(payload.checks.redis.status).toBe('ok');
    expect(redisSendCommand).toHaveBeenCalledWith('PING');
    expect(redisQuit).toHaveBeenCalled();
  });

  it('skips checks when supabase and redis are not configured', async () => {
    supabaseServiceGetter.mockReturnValue(null);
    supabaseAnonGetter.mockReturnValue(null);
    process.env.REDIS_URL = '';

    const response = await GET();
    const payload = (await response.json()) as {
      checks: { supabase: { status: string; reason: string }; redis: { status: string; reason: string } };
    };

    expect(payload.checks.supabase).toEqual({ status: 'skipped', reason: 'not_configured' });
    expect(payload.checks.redis).toEqual({ status: 'skipped', reason: 'not_configured' });
  });

  it('surfaces redis errors when ping fails', async () => {
    redisSendCommand.mockRejectedValueOnce(new Error('ECONNREFUSED'));

    const response = await GET();
    const payload = (await response.json()) as {
      ok: boolean;
      checks: { redis: { status: string; error: string } };
    };

    expect(payload.ok).toBe(false);
    expect(payload.checks.redis.status).toBe('error');
    expect(payload.checks.redis.error).toContain('ECONNREFUSED');
  });
});
