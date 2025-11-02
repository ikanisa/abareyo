import { z } from "zod";

import { ApiError, createApiFetcher } from "@rayon/api/http";

const fanSessionSchema = z.object({
  user: z.object({
    id: z.string(),
    status: z.string(),
    locale: z.string(),
    whatsappNumber: z.string().nullable().optional(),
    momoNumber: z.string().nullable().optional(),
  }),
  session: z.object({
    id: z.string(),
    expiresAt: z.string().nullable(),
  }),
  onboardingStatus: z.string(),
});

const fanSessionResponseSchema = z.object({ data: fanSessionSchema });
const statusResponseSchema = z.object({ data: z.object({ status: z.string() }) });

const finalizePayloadSchema = z.object({ sessionId: z.string().min(1) });
const supabaseLoginSchema = z.object({ accessToken: z.string().min(1) });

const fetcher = createApiFetcher();

export type FanSession = z.infer<typeof fanSessionSchema>;
export type FinalizeFanOnboardingPayload = z.infer<typeof finalizePayloadSchema>;
export type LoginWithSupabasePayload = z.infer<typeof supabaseLoginSchema>;

const unwrapData = <T>(result: { data: T }): T => result.data;

const handleUnauthorized = <T>(error: unknown, fallback: T): T => {
  if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
    return fallback;
  }
  throw error;
};

export const fetchFanSession = async (): Promise<FanSession | null> => {
  try {
    const payload = await fetcher("/auth/fan/me", fanSessionResponseSchema, { cache: "no-store" });
    return unwrapData(payload);
  } catch (error) {
    return handleUnauthorized(error, null);
  }
};

export const finalizeFanOnboarding = async (
  payload: FinalizeFanOnboardingPayload,
): Promise<FanSession | null> => {
  try {
    const response = await fetcher("/auth/fan/from-onboarding", fanSessionResponseSchema, {
      method: "POST",
      body: payload,
      inputSchema: finalizePayloadSchema,
    });
    return unwrapData(response);
  } catch (error) {
    return handleUnauthorized(error, null);
  }
};

export const loginWithSupabaseToken = async (
  payload: LoginWithSupabasePayload,
): Promise<FanSession | null> => {
  try {
    const response = await fetcher("/auth/fan/supabase", fanSessionResponseSchema, {
      method: "POST",
      body: payload,
      inputSchema: supabaseLoginSchema,
    });
    return unwrapData(response);
  } catch (error) {
    return handleUnauthorized(error, null);
  }
};

export const logoutFan = async (): Promise<{ status: string }> => {
  const response = await fetcher("/auth/fan/logout", statusResponseSchema, {
    method: "POST",
  });
  return unwrapData(response);
};
