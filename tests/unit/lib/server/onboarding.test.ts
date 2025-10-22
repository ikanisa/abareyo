import { beforeEach, describe, expect, it, vi } from "vitest";

const callOpenAiResponsesMock = vi.hoisted(() => vi.fn());

vi.mock("@/config/env", () => ({
  serverEnv: {
    ONBOARDING_API_TOKEN: "token-a",
    NEXT_PUBLIC_ONBOARDING_PUBLIC_TOKEN: "token-b",
    ONBOARDING_ALLOW_MOCK: undefined,
    NEXT_PUBLIC_ONBOARDING_ALLOW_MOCK: undefined,
    AGENT_ID: "agent-123",
    OPENAI_API_KEY: "sk-live",
    NEXT_PUBLIC_OPENAI_BASE_URL: "https://example.com/v1",
    NODE_ENV: "test",
  },
}));

vi.mock("@/lib/server/openai", async () => {
  const actual = await vi.importActual<typeof import("@/lib/server/openai")>("@/lib/server/openai");
  return {
    ...actual,
    callOpenAiResponses: callOpenAiResponsesMock,
  };
});

import { serverEnv } from "@/config/env";
import { OpenAiRequestError } from "@/lib/server/openai";
import {
  __internal,
  createOnboardingReply,
  createOnboardingSession,
  extractBearerToken,
  validateAuthorization,
} from "@/lib/server/onboarding";

const mutableEnv = serverEnv as typeof serverEnv;

describe("onboarding helpers", () => {
  beforeEach(() => {
    callOpenAiResponsesMock.mockReset();
    mutableEnv.ONBOARDING_ALLOW_MOCK = undefined;
    mutableEnv.NEXT_PUBLIC_ONBOARDING_ALLOW_MOCK = undefined;
    mutableEnv.OPENAI_API_KEY = "sk-live";
    mutableEnv.AGENT_ID = "agent-123";
    __internal.resetConfigCache();
  });

  it("extracts bearer tokens", () => {
    expect(extractBearerToken(null)).toBeNull();
    expect(extractBearerToken("Basic abc")).toBeNull();
    expect(extractBearerToken("Bearer secret")).toBe("secret");
  });

  it("validates onboarding tokens", () => {
    expect(validateAuthorization(null)).toMatchObject({ ok: false, code: "missing" });
    expect(validateAuthorization("Bearer nope")).toMatchObject({ ok: false, code: "invalid" });
    expect(validateAuthorization("Bearer token-a")).toMatchObject({ ok: true, token: "token-a" });
  });

  it("creates live sessions when OpenAI is configured", () => {
    const result = createOnboardingSession();
    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error("expected successful session");
    }
    expect(result.fromMock).toBe(false);
    expect(result.session.mock).toBeUndefined();
  });

  it("falls back to mock sessions when allowed", () => {
    mutableEnv.OPENAI_API_KEY = "";
    mutableEnv.ONBOARDING_ALLOW_MOCK = "1";
    __internal.resetConfigCache();

    const result = createOnboardingSession();
    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error("expected mock session");
    }
    expect(result.fromMock).toBe(true);
    expect(result.session.mock).toBe(true);
  });

  it("returns mock replies when mocks are enabled", async () => {
    mutableEnv.OPENAI_API_KEY = "";
    mutableEnv.ONBOARDING_ALLOW_MOCK = "1";
    __internal.resetConfigCache();

    const result = await createOnboardingReply({ sessionId: "s-1", text: "hello" });
    expect(result).toMatchObject({ ok: true, fromMock: true });
    expect(callOpenAiResponsesMock).not.toHaveBeenCalled();
  });

  it("invokes OpenAI when configured", async () => {
    callOpenAiResponsesMock.mockResolvedValue({
      output: [
        {
          content: [{ text: "Hi there" }],
        },
      ],
    });

    const result = await createOnboardingReply({ sessionId: "abc", text: "Muraho" });

    expect(callOpenAiResponsesMock).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "gpt-4o-mini",
        input: expect.stringContaining("Agent:agent-123"),
      }),
      expect.any(Function),
    );
    expect(result).toMatchObject({ ok: true, reply: "Hi there", fromMock: false });
  });

  it("surfaces OpenAI request failures", async () => {
    callOpenAiResponsesMock.mockRejectedValue(
      new OpenAiRequestError("openai_upstream_error", { status: 502, detail: "throttled" }),
    );

    const result = await createOnboardingReply({ sessionId: "abc", text: "Muraho" });
    expect(result).toMatchObject({ ok: false, status: 502, detail: "throttled" });
  });
});
