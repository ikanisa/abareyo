/* eslint-disable @typescript-eslint/no-explicit-any */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';

import {
  ServiceSupabaseClientUnavailableError,
  getServiceSupabaseClient,
  resetServiceSupabaseClient,
  tryGetServiceSupabaseClient,
  withServiceSupabaseClient,
} from '@/app/api/_lib/supabase';

vi.mock('@/lib/db', async () => {
  const actual = await vi.importActual<typeof import('@/lib/db')>('@/lib/db');
  return {
    ...actual,
    getSupabaseServiceRoleClient: vi.fn(),
    tryGetSupabaseServiceRoleClient: vi.fn(),
    resetSupabaseClients: vi.fn(),
  };
});

const {
  getSupabaseServiceRoleClient,
  tryGetSupabaseServiceRoleClient,
  resetSupabaseClients,
  SupabaseClientUnavailableError,
} = await import('@/lib/db');
const getSupabaseServiceRoleClientMock = vi.mocked(getSupabaseServiceRoleClient);
const tryGetSupabaseServiceRoleClientMock = vi.mocked(tryGetSupabaseServiceRoleClient);
const resetSupabaseClientsMock = vi.mocked(resetSupabaseClients);

describe('service supabase client helpers', () => {
  beforeEach(() => {
    getSupabaseServiceRoleClientMock.mockReset();
    tryGetSupabaseServiceRoleClientMock.mockReset();
    resetSupabaseClientsMock.mockReset();
    resetServiceSupabaseClient();
  });

  it('returns null when credentials are missing', () => {
    tryGetSupabaseServiceRoleClientMock.mockReturnValue(null);

    expect(tryGetServiceSupabaseClient()).toBeNull();
    expect(tryGetSupabaseServiceRoleClientMock).toHaveBeenCalledTimes(1);
  });

  it('throws when requiring a client without configuration', () => {
    getSupabaseServiceRoleClientMock.mockImplementation(() => {
      throw new SupabaseClientUnavailableError('missing');
    });

    expect(() => getServiceSupabaseClient()).toThrow(ServiceSupabaseClientUnavailableError);
  });

  it('provides a cached client instance', () => {
    const client = { from: vi.fn() } as unknown as SupabaseClient;
    getSupabaseServiceRoleClientMock.mockReturnValue(client as any);
    tryGetSupabaseServiceRoleClientMock.mockReturnValue(client as any);

    const first = getServiceSupabaseClient();
    const second = tryGetServiceSupabaseClient();

    expect(first).toBe(client);
    expect(second).toBe(client);
    expect(getSupabaseServiceRoleClientMock).toHaveBeenCalledTimes(1);
  });

  it('honours the fallback handler when configuration is missing', async () => {
    tryGetSupabaseServiceRoleClientMock.mockReturnValue(null);
    const fallback = vi.fn().mockResolvedValue('fallback');

    await expect(
      withServiceSupabaseClient(async () => 'unreachable', { fallback }),
    ).resolves.toBe('fallback');
    expect(fallback).toHaveBeenCalledTimes(1);
  });

  it('invokes the handler with the Supabase client when available', async () => {
    const client = { from: vi.fn() } as unknown as SupabaseClient;
    tryGetSupabaseServiceRoleClientMock.mockReturnValue(client as any);

    await expect(
      withServiceSupabaseClient(async (supabase) => {
        expect(supabase).toBe(client);
        return 'ok';
      }),
    ).resolves.toBe('ok');
  });
});
