type RequestOptions = RequestInit & { skipAuthHeaders?: boolean };

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? '/api';

const request = async <T>(path: string, init?: RequestOptions) => {
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

  const payload = (await response.json()) as { data: T };
  return payload.data;
};

export type WhatsappAuthStartResponse = {
  requestId: string;
  expiresIn: number;
  resendAfter: number;
};

export type WhatsappAuthVerifyResponse = {
  accessToken: string;
  refreshToken?: string | null;
  userId: string;
};

export const startWhatsappAuth = (payload: { phone: string }) =>
  request<WhatsappAuthStartResponse>('/auth/whatsapp/start', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const verifyWhatsappOtp = (payload: { requestId: string; code: string }) =>
  request<WhatsappAuthVerifyResponse>('/auth/whatsapp/verify', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const resendWhatsappOtp = (payload: { requestId: string }) =>
  request<{ resendAfter: number }>('/auth/whatsapp/resend', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
