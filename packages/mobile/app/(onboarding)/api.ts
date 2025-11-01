import { getAuthToken } from "./authStorage";

const API_BASE = process.env.EXPO_PUBLIC_WEB_URL || process.env.NEXT_PUBLIC_SITE_URL || "";

export type OnboardingPreferences = {
  whatsappNumber: string;
  momoNumber?: string;
  useWhatsappForMomo: boolean;
  language: "rw" | "en" | "fr";
  publicProfile: boolean;
  notifications: {
    kickoff: boolean;
    goals: boolean;
    final: boolean;
    club: boolean;
  };
};

export type OnboardingResult = {
  userId: string;
  userCode?: string;
};

export type WhatsappAuthStartResponse = {
  sessionId: string;
  expiresAt?: string;
  resendAt?: string;
};

export type WhatsappVerifyResponse = {
  token: string;
  refreshToken?: string;
  userId?: string;
};

const buildUrl = (path: string) => {
  if (!API_BASE) {
    return path;
  }
  return `${API_BASE.replace(/\/$/, "")}${path}`;
};

const withAuthHeader = async (headers: Record<string, string>) => {
  const token = await getAuthToken();
  if (!token) {
    return headers;
  }
  return { ...headers, Authorization: `Bearer ${token}` };
};

export const startWhatsappAuth = async (
  whatsappNumber: string,
): Promise<WhatsappAuthStartResponse> => {
  const response = await fetch(buildUrl("/auth/whatsapp/start"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ whatsappNumber }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Failed to start WhatsApp verification");
  }

  const json = (await response.json()) as {
    sessionId?: string;
    expiresAt?: string;
    resendAt?: string;
  };

  if (!json.sessionId) {
    throw new Error("Missing verification session identifier");
  }

  return {
    sessionId: json.sessionId,
    expiresAt: json.expiresAt,
    resendAt: json.resendAt,
  };
};

export const verifyWhatsappCode = async (
  sessionId: string,
  code: string,
): Promise<WhatsappVerifyResponse> => {
  const response = await fetch(buildUrl("/auth/whatsapp/verify"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, code }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Failed to verify WhatsApp code");
  }

  const json = (await response.json()) as WhatsappVerifyResponse;
  if (!json.token) {
    throw new Error("Missing authentication token");
  }

  return json;
};

export const submitOnboarding = async (prefs: OnboardingPreferences): Promise<OnboardingResult> => {
  const generatedId =
    typeof globalThis.crypto !== "undefined" && typeof globalThis.crypto.randomUUID === "function"
      ? globalThis.crypto.randomUUID()
      : `guest-${Math.random().toString(36).slice(2, 10)}`;
  const payload = {
    user_id: generatedId,
    whatsappNumber: prefs.whatsappNumber,
    useWhatsappForMomo: prefs.useWhatsappForMomo,
    momoNumber: prefs.useWhatsappForMomo ? undefined : prefs.momoNumber,
    publicProfile: prefs.publicProfile,
  };

  const profileHeaders = await withAuthHeader({ "Content-Type": "application/json" });
  const profileResponse = await fetch(buildUrl("/api/me/onboarding"), {
    method: "POST",
    headers: profileHeaders,
    body: JSON.stringify(payload),
  });

  if (!profileResponse.ok) {
    const message = await profileResponse.text();
    throw new Error(message || "Failed to complete onboarding");
  }

  const profileJson = (await profileResponse.json()) as { id?: string; code?: string };
  const userId = profileJson.id ?? payload.user_id;

  const prefsHeaders = await withAuthHeader({
    "Content-Type": "application/json",
    "x-user-id": userId,
  });
  const prefsResponse = await fetch(buildUrl("/api/me/prefs"), {
    method: "POST",
    headers: prefsHeaders,
    body: JSON.stringify({
      language: prefs.language,
      notifications: prefs.notifications,
    }),
  });

  if (!prefsResponse.ok) {
    const message = await prefsResponse.text();
    throw new Error(message || "Failed to save notification preferences");
  }

  return { userId, userCode: profileJson.code };
};
