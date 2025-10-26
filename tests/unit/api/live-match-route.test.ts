import { beforeEach, describe, expect, it, vi } from 'vitest';

const { ffMock, fetchLiveMatchSnapshotMock } = vi.hoisted(() => ({
  ffMock: vi.fn<(flag: string, fallback?: boolean) => boolean>(),
  fetchLiveMatchSnapshotMock: vi.fn(),
}));

vi.mock('@/lib/flags', () => ({
  ff: ffMock,
}));

vi.mock('@/app/api/live/match/_providers/supabase', () => ({
  fetchLiveMatchSnapshot: fetchLiveMatchSnapshotMock,
}));

import { ff } from '@/lib/flags';
import { fetchLiveMatchSnapshot } from '@/app/api/live/match/_providers/supabase';
import { GET } from '@/app/api/live/match/[id]/route';

const createRequest = () => new Request('https://rayon.example/api/live/match/test');

const expectFallbackPayload = async (response: Response, matchId: string) => {
  expect(response.status).toBe(200);
  const body = await response.json();
  expect(body).toEqual({
    matchId,
    timeline: [{ min: 12, text: 'Goal!' }],
    stats: { possession: [52, 48] },
  });
};

describe('live match route', () => {
  const ffMocked = vi.mocked(ffMock);
  const fetchLiveMatchSnapshotMocked = vi.mocked(fetchLiveMatchSnapshotMock);

  beforeEach(() => {
    ffMocked.mockReset();
    fetchLiveMatchSnapshotMocked.mockReset();
    ffMocked.mockReturnValue(true);
  });

  it('returns 400 when match id is missing', async () => {
    const response = await GET(createRequest(), { params: { id: '   ' } });
    expect(response.status).toBe(400);
    expect(fetchLiveMatchSnapshotMocked).not.toHaveBeenCalled();
  });

  it('uses fallback payload when feature flag disabled', async () => {
    ffMocked.mockReturnValue(false);

    const response = await GET(createRequest(), { params: { id: 'match-123' } });

    expect(fetchLiveMatchSnapshotMocked).not.toHaveBeenCalled();
    await expectFallbackPayload(response, 'match-123');
  });

  it('returns provider payload when available', async () => {
    const snapshot = {
      matchId: 'match-123',
      timeline: [{ min: 1, text: 'Kick-off' }],
      stats: { possession: [60, 40] },
      status: 'live',
    };
    fetchLiveMatchSnapshotMocked.mockResolvedValue(snapshot);

    const response = await GET(createRequest(), { params: { id: 'match-123' } });

    expect(fetchLiveMatchSnapshotMocked).toHaveBeenCalledWith('match-123');
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(snapshot);
  });

  it('falls back when provider returns null', async () => {
    fetchLiveMatchSnapshotMocked.mockResolvedValue(null);
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const response = await GET(createRequest(), { params: { id: 'match-456' } });

    expect(fetchLiveMatchSnapshotMocked).toHaveBeenCalledWith('match-456');
    expect(warnSpy).toHaveBeenCalledWith('live_match_snapshot_missing', { matchId: 'match-456' });
    await expectFallbackPayload(response, 'match-456');

    warnSpy.mockRestore();
  });

  it('falls back when provider throws', async () => {
    const error = new Error('offline');
    fetchLiveMatchSnapshotMocked.mockRejectedValue(error);
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const response = await GET(createRequest(), { params: { id: 'match-789' } });

    expect(fetchLiveMatchSnapshotMocked).toHaveBeenCalledWith('match-789');
    expect(errorSpy).toHaveBeenCalledWith('live_match_provider_error', { error, matchId: 'match-789' });
    await expectFallbackPayload(response, 'match-789');

    errorSpy.mockRestore();
  });
});
