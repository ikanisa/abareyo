import { cookies } from 'next/headers';

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:5000/api';

export type FanSessionServer = {
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

export const fetchFanSessionServer = async (): Promise<FanSessionServer | null> => {
  const cookieStore = cookies();
  const cookieHeader = cookieStore.toString();
  if (!cookieHeader) {
    return null;
  }

  const response = await fetch(`${BASE_URL.replace(/\/$/, '')}/auth/fan/me`, {
    headers: {
      cookie: cookieHeader,
    },
    cache: 'no-store',
  });

  if (response.status === 401 || response.status === 403) {
    return null;
  }

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'Failed to load fan session');
  }

  const payload = (await response.json()) as { data: FanSessionServer };
  return payload.data;
};
