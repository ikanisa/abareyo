const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:5000/api';

export interface FundraisingProject {
  id: string;
  title: string;
  description?: string | null;
  goal: number;
  progress: number;
  status: string;
  coverImage?: string | null;
  coverImageUrl?: string | null;
}

export interface FundraisingDonatePayload {
  projectId: string;
  amount: number;
  channel: 'mtn' | 'airtel';
  userId?: string;
  donorName?: string;
}

export interface FundraisingDonationResponse {
  donationId: string;
  paymentId?: string;
  amount: number;
  ussdCode: string;
  expiresAt: string;
  project: FundraisingProject;
}

async function apiGet<T>(path: string) {
  const response = await fetch(`${BASE_URL.replace(/\/$/, '')}${path}`);
  if (!response.ok) {
    throw new Error(await response.text());
  }
  const { data } = (await response.json()) as { data: T };
  return data;
}

export function fetchFundraisingProjects() {
  return apiGet<FundraisingProject[]>(`/fundraising/projects`);
}

export async function donateToProject(payload: FundraisingDonatePayload): Promise<FundraisingDonationResponse> {
  const response = await fetch(`${BASE_URL.replace(/\/$/, '')}/fundraising/donate`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const { data } = (await response.json()) as { data: FundraisingDonationResponse };
  return data;
}
