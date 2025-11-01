const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "/api";

const request = async <T>(path: string, init?: RequestInit) => {
  const response = await fetch(`${BASE_URL.replace(/\/$/, "")}${path}`, {
    credentials: "include",
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (response.status === 401 || response.status === 403) {
    throw new Error("Authentication required");
  }

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed (${response.status})`);
  }

  const payload = (await response.json()) as { data: T };
  return payload.data;
};

export type TapMoMoPayload = {
  aid: string;
  payload: string;
  nonce: string;
  issuedAt: number;
  expiresAt: number;
  signature: string;
  ttlSeconds: number;
};

export const requestTapMoMoPayload = () =>
  request<TapMoMoPayload>("/merchant/tapmomo/payload", { method: "POST" });
