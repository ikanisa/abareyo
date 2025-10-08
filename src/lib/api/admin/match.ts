export type AdminMatch = {
  id: string;
  opponent: string;
  kickoff: string;
  venue: string;
  status: 'scheduled' | 'live' | 'finished' | 'postponed';
  competition?: string | null;
  zones: Array<{
    id: string;
    name: string;
    capacity: number;
    price: number;
    gate?: string | null;
    matchId: string;
  }>;
  gates: Array<{
    id: string;
    name: string;
    location?: string | null;
    maxThroughput?: number | null;
    matchId: string;
  }>;
};

export type MatchScanMetric = {
  gate: string;
  total: number;
  verified: number;
  rejected: number;
};

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:5000/api';

const request = async <T>(path: string, init?: RequestInit) => {
  const response = await fetch(`${BASE_URL.replace(/\/$/, '')}${path}`, {
    credentials: 'include',
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed (${response.status})`);
  }

  if (response.status === 204) {
    return undefined as unknown as T;
  }

  const contentType = response.headers.get('content-type');
  if (contentType?.includes('application/json')) {
    return (await response.json()) as T;
  }

  return undefined as unknown as T;
};

export const fetchAdminMatches = () =>
  request<{ data: AdminMatch[] }>(`/admin/match-ops/matches`).then((res) => res.data);

export const createAdminMatch = (payload: {
  opponent: string;
  kickoff: string;
  venue: string;
  status?: 'scheduled' | 'live' | 'finished' | 'postponed';
  competition?: string;
}) =>
  request<{ data: AdminMatch }>(`/admin/match-ops/matches`, {
    method: 'POST',
    body: JSON.stringify(payload),
  }).then((res) => res.data);

export const updateAdminMatch = (
  matchId: string,
  payload: Partial<{
    opponent: string;
    kickoff: string;
    venue: string;
    status: 'scheduled' | 'live' | 'finished' | 'postponed';
    competition?: string | null;
  }>,
) =>
  request<{ data: AdminMatch }>(`/admin/match-ops/matches/${matchId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }).then((res) => res.data);

export const deleteAdminMatch = (matchId: string) =>
  request<{ status: string }>(`/admin/match-ops/matches/${matchId}`, {
    method: 'DELETE',
  });

export const upsertMatchZone = (
  matchId: string,
  payload: {
    name: string;
    capacity: number;
    price: number;
    gate?: string;
  },
) =>
  request<{ data: AdminMatch['zones'][number] }>(`/admin/match-ops/matches/${matchId}/zones`, {
    method: 'POST',
    body: JSON.stringify(payload),
  }).then((res) => res.data);

export const deleteMatchZone = (matchId: string, zoneId: string) =>
  request<{ status: string }>(`/admin/match-ops/matches/${matchId}/zones/${zoneId}`, {
    method: 'DELETE',
  });

export const upsertMatchGate = (
  matchId: string,
  payload: {
    name: string;
    location?: string;
    maxThroughput?: number;
  },
) =>
  request<{ data: AdminMatch['gates'][number] }>(`/admin/match-ops/matches/${matchId}/gates`, {
    method: 'POST',
    body: JSON.stringify(payload),
  }).then((res) => res.data);

export const deleteMatchGate = (matchId: string, gateId: string) =>
  request<{ status: string }>(`/admin/match-ops/matches/${matchId}/gates/${gateId}`, {
    method: 'DELETE',
  });

export const fetchMatchScanMetrics = (matchId: string) =>
  request<{ data: MatchScanMetric[] }>(`/admin/match-ops/matches/${matchId}/scan-metrics`).then((res) => res.data);
