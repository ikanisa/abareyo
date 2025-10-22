import { randomUUID } from "node:crypto";

import type {
  OnboardingAuthorizationResultContract,
  OnboardingReplyResultContract,
  OnboardingSessionPublicContract,
  OnboardingSessionResultContract,
} from "@rayon/contracts/onboarding";

import { serverEnv } from "@/config/env";
import { callOpenAiResponses, OpenAiRequestError } from "@/lib/server/openai";

const DEFAULT_AGENT_ID = "gikundiro-onboarding";
const MOCK_REPLY = "(mock) Hello! Let's get your fan profile set up.";

type OnboardingConfig = {
  tokens: Set<string>;
  agentId: string;
  allowMock: boolean;
};

let cachedConfig: OnboardingConfig | null = null;

const buildConfig = (): OnboardingConfig => {
  const tokens = new Set(
    [serverEnv.ONBOARDING_API_TOKEN, serverEnv.NEXT_PUBLIC_ONBOARDING_PUBLIC_TOKEN]
      .map((value) => value?.trim())
      .filter((value): value is string => Boolean(value)),
  );

  const allowMock =
    serverEnv.ONBOARDING_ALLOW_MOCK === "1" || serverEnv.NEXT_PUBLIC_ONBOARDING_ALLOW_MOCK === "1";

  const agentId = serverEnv.AGENT_ID?.trim() || DEFAULT_AGENT_ID;

  return {
    tokens,
    agentId,
    allowMock,
  };
};

export const __internal = {
  resetConfigCache: () => {
    cachedConfig = null;
  },
};

const getConfig = () => {
  if (!cachedConfig) {
    cachedConfig = buildConfig();
  }
  return cachedConfig;
};

export const extractBearerToken = (header: string | null | undefined): string | null => {
  if (!header) return null;
  const match = /^Bearer\s+(.+)$/.exec(header);
  return match ? match[1] : null;
};

export const validateAuthorization = (
  header: string | null | undefined,
): OnboardingAuthorizationResultContract => {
  const token = extractBearerToken(header);
  if (!token) {
    return { ok: false, code: "missing" };
  }

  const { tokens } = getConfig();
  return tokens.has(token) ? { ok: true, token } : { ok: false, code: "invalid" };
};

export const createOnboardingSession = (): OnboardingSessionResultContract => {
  const { agentId, allowMock } = getConfig();
  const apiKey = serverEnv.OPENAI_API_KEY?.trim();

  if (!apiKey) {
    if (allowMock) {
      const session: OnboardingSessionPublicContract = {
        sessionId: randomUUID(),
        agentId,
        createdAt: new Date().toISOString(),
        mock: true,
      };
      return {
        ok: true,
        fromMock: true,
        session,
      };
    }

    return {
      ok: false,
      status: 503,
      error: "service_unavailable",
      message: "Onboarding service is not ready. Missing OPENAI_API_KEY.",
    };
  }

  const session: OnboardingSessionPublicContract = {
    sessionId: randomUUID(),
    agentId,
    createdAt: new Date().toISOString(),
  };

  return {
    ok: true,
    fromMock: false,
    session,
  };
};

export const createOnboardingReply = async (
  { sessionId, text }: { sessionId: string; text: string },
  fetchImpl: typeof fetch = fetch,
): Promise<OnboardingReplyResultContract> => {
  const { agentId, allowMock } = getConfig();
  const apiKey = serverEnv.OPENAI_API_KEY?.trim();

  if (allowMock) {
    return { ok: true, reply: MOCK_REPLY, fromMock: true, raw: null };
  }

  if (!apiKey || !agentId) {
    return {
      ok: false,
      status: 503,
      error: "service_unavailable",
      message: "Onboarding agent is not configured",
    };
  }

  try {
    const data = await callOpenAiResponses<{
      output?: Array<{ content?: Array<{ text?: string }> }>;
    }>(
      {
        model: "gpt-4o-mini",
        input: `Agent:${agentId}\nUser:${text}\nReturn a short onboarding reply.`,
        metadata: {
          app: "gikundiro",
          sessionId,
          stage: serverEnv.NODE_ENV,
        },
      },
      fetchImpl,
    );

    const reply = data?.output?.[0]?.content?.[0]?.text ?? "Muraho! Let's get started.";
    return { ok: true, reply, fromMock: false, raw: data };
  } catch (error) {
    if (error instanceof OpenAiRequestError) {
      return {
        ok: false,
        status: error.status,
        error: error.message,
        detail: error.detail,
      };
    }

    return {
      ok: false,
      status: 500,
      error: "unknown_error",
      message: error instanceof Error ? error.message : String(error),
    };
  }
};
