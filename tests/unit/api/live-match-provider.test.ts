import { beforeEach, describe, expect, it, vi } from 'vitest';

const { withServiceSupabaseClientMock } = vi.hoisted(() => ({
  withServiceSupabaseClientMock: vi.fn(),
}));

vi.mock('@/app/api/_lib/supabase', () => ({
  withServiceSupabaseClient: withServiceSupabaseClientMock,
}));
import {
  LiveMatchProviderError,
  fetchLiveMatchSnapshot,
  normalizeLiveMatchSnapshot,
} from '@/app/api/live/match/_providers/supabase';

describe('live match provider', () => {
  const withClientMocked = vi.mocked(withServiceSupabaseClientMock);

  beforeEach(() => {
    withClientMocked.mockReset();
  });

  it('throws when match id is empty', async () => {
    await expect(fetchLiveMatchSnapshot('  ')).rejects.toThrow(LiveMatchProviderError);
    expect(withClientMocked).not.toHaveBeenCalled();
  });

  it('returns null when Supabase credentials are missing', async () => {
    withClientMocked.mockImplementation(async (_handler, options) =>
      (options?.fallback ? options.fallback() : null) as null,
    );

    await expect(fetchLiveMatchSnapshot('match-1')).resolves.toBeNull();
  });

  it('normalizes snapshots from Supabase RPC', async () => {
    const maybeSingle = vi.fn().mockResolvedValue({
      data: {
        match_id: 'match-2',
        timeline: [
          { min: 5, text: 'Goal Rayon', side: 'home' },
          { minute: '10', text: 'Yellow card', side: 'away' },
          { min: null, text: 'Invalid' },
          null,
        ],
        stats: {
          possession: ['55', 45],
          shotsOnTarget: [3, 1],
          misc: 'value',
        },
        status: 'live',
        updated_at: '2024-01-01T12:00:00Z',
        score: [2, '1'],
      },
      error: null,
    });

    const rpc = vi.fn().mockReturnValue({ maybeSingle });
    const client = { rpc };

    withClientMocked.mockImplementation(async (handler) => handler(client));

    const snapshot = await fetchLiveMatchSnapshot('match-2');

    expect(rpc).toHaveBeenCalledWith('live_match_snapshot', { match_id: 'match-2' });
    expect(snapshot).toEqual({
      matchId: 'match-2',
      timeline: [
        { min: 5, text: 'Goal Rayon', side: 'home' },
        { min: 10, text: 'Yellow card', side: 'away' },
      ],
      stats: {
        possession: [55, 45],
        shotsOnTarget: [3, 1],
        misc: 'value',
      },
      status: 'live',
      updatedAt: '2024-01-01T12:00:00Z',
      score: [2, 1],
    });
  });

  it('propagates RPC failures as provider errors', async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: { message: 'rpc failed' } });
    const rpc = vi.fn().mockReturnValue({ maybeSingle });
    const client = { rpc };

    withClientMocked.mockImplementation(async (handler) => handler(client));

    await expect(fetchLiveMatchSnapshot('match-3')).rejects.toThrow(LiveMatchProviderError);
  });

  it('falls back to provided match id during normalization', () => {
    const snapshot = normalizeLiveMatchSnapshot(
      {
        timeline: [],
        stats: {},
      },
      'fallback-id',
    );

    expect(snapshot.matchId).toBe('fallback-id');
  });
});
