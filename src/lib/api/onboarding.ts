// Type definitions inlined from contracts
export type OnboardingMessageRole = 'user' | 'assistant' | 'tool';
export type OnboardingMessageKind = 'text' | 'tool_call' | 'tool_result';

export interface OnboardingMessageDto {
  id: string;
  role: OnboardingMessageRole;
  kind: OnboardingMessageKind;
  text?: string;
  callId?: string;
  toolName?: string;
  arguments?: Record<string, unknown>;
  payload?: Record<string, unknown>;
  createdAt: string;
}

export interface OnboardingSessionDto {
  id: string;
  status: 'collecting_profile' | 'awaiting_confirmation' | 'completed';
  userId: string;
  createdAt: string;
  updatedAt: string;
  messages: OnboardingMessageDto[];
}

export interface StartOnboardingSessionRequest {
  locale?: string;
}

export interface SendOnboardingMessageRequest {
  message: string;
}

// Default to Next.js local API (/api). In production, set NEXT_PUBLIC_BACKEND_URL
// to your external API base (e.g., https://api.example.com/api).
import { clientEnv } from "@/config/env";

const BASE_URL = clientEnv.NEXT_PUBLIC_BACKEND_URL ?? '/api';

const buildUrl = (path: string) => `${BASE_URL.replace(/\/$/, '')}${path}`;

async function apiJson<T>(path: string, init?: RequestInit) {
  const response = await fetch(buildUrl(path), {
    ...init,
    headers: {
      'content-type': 'application/json',
      'authorization': `Bearer ${clientEnv.NEXT_PUBLIC_ONBOARDING_PUBLIC_TOKEN ?? ''}`,
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
