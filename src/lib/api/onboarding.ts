import type {
  OnboardingSessionDto,
  SendOnboardingMessageRequest,
  StartOnboardingSessionRequest,
} from '@rayon/contracts/onboarding';

// Default to Next.js local API (/api). In production, set NEXT_PUBLIC_BACKEND_URL
// to your external API base (e.g., https://api.example.com/api).
const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? '/api';

const buildUrl = (path: string) => `${BASE_URL.replace(/\/$/, '')}${path}`;

async function apiJson<T>(path: string, init?: RequestInit) {
  const response = await fetch(buildUrl(path), {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(init?.headers ?? {}),
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    const message = await response.text();
    const error = new Error(message || `Request failed with status ${response.status}`) as Error & {
      status?: number;
    };
    error.status = response.status;
    throw error;
  }

  const body = (await response.json()) as { data: T };
  return body.data;
}

export function startOnboardingSession(payload?: StartOnboardingSessionRequest) {
  return apiJson<OnboardingSessionDto>('/onboarding/sessions', {
    method: 'POST',
    body: JSON.stringify(payload ?? {}),
  });
}

export function fetchOnboardingSession(sessionId: string) {
  return apiJson<OnboardingSessionDto>(`/onboarding/sessions/${sessionId}`);
}

export function sendOnboardingMessage(sessionId: string, payload: SendOnboardingMessageRequest) {
  return apiJson<OnboardingSessionDto>(`/onboarding/sessions/${sessionId}/messages`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
