export type FanSession = {
  user: {
    id: string;
    status: string;
    locale: string;
    whatsappNumber?: string | null;
    momoNumber?: string | null;
  };
  session: {
    id: string;
    expiresAt: string | null;
  };
  onboardingStatus: string;
};

// Default to Next.js local API (/api). In production, set NEXT_PUBLIC_BACKEND_URL
// to your external API base (e.g., https://api.example.com/api).
const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? '/api';

const request = async <T>(path: string, init?: RequestInit) => {
  const response = await fetch(`${BASE_URL.replace(/\/$/, '')}${path}`, {
    credentials: 'include',
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  if (response.status === 401 || response.status === 403) {
    return null;
  }

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed (${response.status})`);
  }

  const payload = (await response.json()) as { data: T };
  return payload.data;
};

export const fetchFanSession = () => request<FanSession>('/auth/fan/me');

export const finalizeFanOnboarding = (payload: { sessionId: string }) =>
  request<FanSession>('/auth/fan/from-onboarding', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const loginWithSupabaseToken = (payload: { accessToken: string }) =>
  request<FanSession>('/auth/fan/supabase', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const logoutFan = () =>
  request<{ status: string }>('/auth/fan/logout', {
    method: 'POST',
  });
