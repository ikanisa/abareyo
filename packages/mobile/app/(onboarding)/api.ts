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

const buildUrl = (path: string) => {
  if (!API_BASE) {
    return path;
  }
  return `${API_BASE.replace(/\/$/, "")}${path}`;
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

  const profileResponse = await fetch(buildUrl("/api/me/onboarding"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!profileResponse.ok) {
    const message = await profileResponse.text();
    throw new Error(message || "Failed to complete onboarding");
  }

  const profileJson = (await profileResponse.json()) as { id?: string; code?: string };
  const userId = profileJson.id ?? payload.user_id;

  const prefsResponse = await fetch(buildUrl("/api/me/prefs"), {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-user-id": userId },
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
