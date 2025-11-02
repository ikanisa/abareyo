export type CommunityModerationStatus = 'visible' | 'hidden' | 'warned' | 'banned';

export type CommunityModerationEvidence = {
  type: string;
  label: string | null;
  value: string | null;
  url: string | null;
  confidence: number | null;
  raw: unknown;
};

export type CommunityModerationPost = {
  id: string;
  userId: string | null;
  body: string;
  media: unknown[];
  status: string;
  createdAt: string;
  moderatorNotes: string | null;
  evidence: CommunityModerationEvidence[];
};

export type CommunityRateLimitEntry = {
  userId: string | null;
  displayName: string;
  avatarUrl: string | null;
  posts15m: number;
  limit15m: number;
  posts1h: number;
  limit1h: number;
  posts24h: number;
  limit24h: number;
  flaggedTotal: number;
  warnsTotal: number;
  bansTotal: number;
  lastPostAt: string | null;
  rateLimited: boolean;
};

const parseEvidence = (value: unknown): CommunityModerationEvidence[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((entry) => {
    const record = typeof entry === 'object' && entry !== null ? (entry as Record<string, unknown>) : {};
    const type = typeof record.type === 'string' ? record.type : 'note';
    const label = typeof record.label === 'string' ? record.label : null;
    const url = typeof record.url === 'string' ? record.url : null;
    const valueText =
      typeof record.value === 'string'
        ? record.value
        : typeof record.text === 'string'
          ? record.text
          : typeof record.snippet === 'string'
            ? record.snippet
            : null;
    const confidence = typeof record.confidence === 'number' ? record.confidence : null;

    return {
      type,
      label,
      value: valueText,
      url,
      confidence,
      raw: entry,
    } satisfies CommunityModerationEvidence;
  });
};

import { adminFetch } from '@/lib/admin/csrf';

const parseModerationPost = (row: Record<string, unknown>): CommunityModerationPost => ({
  id: String(row.id ?? ''),
  userId: typeof row.user_id === 'string' ? row.user_id : null,
  body: typeof row.body === 'string' ? row.body : '',
  media: Array.isArray(row.media) ? row.media : [],
  status: typeof row.status === 'string' ? row.status : 'pending',
  createdAt: typeof row.created_at === 'string' ? row.created_at : new Date().toISOString(),
  moderatorNotes: typeof row.moderator_notes === 'string' ? row.moderator_notes : null,
  evidence: parseEvidence(row.evidence),
});

const fetchJson = async (input: RequestInfo, init?: RequestInit) => {
  const response = await adminFetch(input, {
    credentials: 'include',
    ...init,
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    const errorMessage =
      typeof json?.error?.message === 'string'
        ? json.error.message
        : typeof json?.message === 'string'
          ? json.message
          : 'community_request_failed';
    throw new Error(errorMessage);
  }
  return json as { data?: unknown };
};

export const fetchCommunityModerationQueue = async (): Promise<CommunityModerationPost[]> => {
  const json = await fetchJson('/admin/api/community/moderation');
  const payload = (json.data ?? {}) as Record<string, unknown>;
  const posts = Array.isArray(payload.posts) ? payload.posts : [];
  return posts.map((row) => parseModerationPost(typeof row === 'object' && row !== null ? (row as Record<string, unknown>) : {}));
};

export const updateCommunityPostModeration = async (options: {
  id: string;
  status: CommunityModerationStatus;
  notes?: string;
}): Promise<CommunityModerationPost> => {
  const json = await fetchJson('/admin/api/community/moderation', {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ id: options.id, status: options.status, notes: options.notes ?? undefined }),
  });
  const payload = (json.data ?? {}) as Record<string, unknown>;
  const post = typeof payload.post === 'object' && payload.post !== null ? (payload.post as Record<string, unknown>) : {};
  return parseModerationPost(post);
};

export const fetchCommunityRateLimits = async (): Promise<CommunityRateLimitEntry[]> => {
  const json = await fetchJson('/admin/api/community/rate-limits');
  const payload = (json.data ?? {}) as Record<string, unknown>;
  const rows = Array.isArray(payload.rateLimits) ? payload.rateLimits : [];
  return rows.map((row) => {
    const record = typeof row === 'object' && row !== null ? (row as Record<string, unknown>) : {};
    const toNumber = (value: unknown) => {
      if (typeof value === 'number') return value;
      if (typeof value === 'string') {
        const parsed = Number(value);
        return Number.isNaN(parsed) ? 0 : parsed;
      }
      return 0;
    };

    return {
      userId: typeof record.user_id === 'string' ? record.user_id : null,
      displayName: typeof record.display_name === 'string' ? record.display_name : 'Anonymous',
      avatarUrl: typeof record.avatar_url === 'string' ? record.avatar_url : null,
      posts15m: toNumber(record.posts_15m),
      limit15m: toNumber(record.limit_15m),
      posts1h: toNumber(record.posts_1h),
      limit1h: toNumber(record.limit_1h),
      posts24h: toNumber(record.posts_24h),
      limit24h: toNumber(record.limit_24h),
      flaggedTotal: toNumber(record.flagged_total),
      warnsTotal: toNumber(record.warns_total),
      bansTotal: toNumber(record.bans_total),
      lastPostAt: typeof record.last_post_at === 'string' ? record.last_post_at : null,
      rateLimited: Boolean(record.rate_limited),
    } satisfies CommunityRateLimitEntry;
  });
};
