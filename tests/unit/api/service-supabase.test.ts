import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';

import {
  ServiceSupabaseClientUnavailableError,
  getServiceSupabaseClient,
  resetServiceSupabaseClient,
  tryGetServiceSupabaseClient,
  withServiceSupabaseClient,
} from '@/app/api/_lib/supabase';
import type { Database } from '@/integrations/supabase/types';

vi.mock('@/integrations/supabase/server', () => ({
  createServiceSupabaseClient: vi.fn(),
}));

const { createServiceSupabaseClient } = await import('@/integrations/supabase/server');
const createServiceSupabaseClientMock = vi.mocked(createServiceSupabaseClient);

describe('service supabase client helpers', () => {
  beforeEach(() => {
    createServiceSupabaseClientMock.mockReset();
    resetServiceSupabaseClient();
  });

  it('returns null when credentials are missing', () => {
    createServiceSupabaseClientMock.mockReturnValue(null);

    expect(tryGetServiceSupabaseClient()).toBeNull();
    expect(createServiceSupabaseClientMock).toHaveBeenCalledTimes(1);
  });

  it('throws when requiring a client without configuration', () => {
    createServiceSupabaseClientMock.mockReturnValue(null);

    expect(() => getServiceSupabaseClient()).toThrow(ServiceSupabaseClientUnavailableError);
  });

  it('provides a cached client instance', () => {
    const client = { from: vi.fn() } as unknown as SupabaseClient<Database>;
    createServiceSupabaseClientMock.mockReturnValue(client);

    const first = getServiceSupabaseClient();
    const second = tryGetServiceSupabaseClient();

    expect(first).toBe(client);
    expect(second).toBe(client);
    expect(createServiceSupabaseClientMock).toHaveBeenCalledTimes(1);
  });

  it('honours the fallback handler when configuration is missing', async () => {
    createServiceSupabaseClientMock.mockReturnValue(null);
    const fallback = vi.fn().mockResolvedValue('fallback');

    await expect(
      withServiceSupabaseClient(async () => 'unreachable', { fallback }),
    ).resolves.toBe('fallback');
    expect(fallback).toHaveBeenCalledTimes(1);
  });

  it('invokes the handler with the Supabase client when available', async () => {
    const client = { from: vi.fn() } as unknown as SupabaseClient<Database>;
    createServiceSupabaseClientMock.mockReturnValue(client);

    await expect(
      withServiceSupabaseClient(async (supabase) => {
        expect(supabase).toBe(client);
        return 'ok';
      }),
    ).resolves.toBe('ok');
  });
});
