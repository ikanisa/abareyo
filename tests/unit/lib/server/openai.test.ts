import { beforeEach, describe, expect, it, vi } from "vitest";

const fetchMock = vi.fn();

vi.mock("@/config/env", () => ({
  serverEnv: {
    OPENAI_API_KEY: "sk-test",
    NEXT_PUBLIC_OPENAI_BASE_URL: "https://example.com/v1/",
  },
}));

import { serverEnv } from "@/config/env";
import { callOpenAiResponses, OpenAiRequestError } from "@/lib/server/openai";

const mutableEnv = serverEnv as Record<string, string | undefined>;

describe("callOpenAiResponses", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    mutableEnv.NEXT_PUBLIC_OPENAI_BASE_URL = "https://example.com/v1/";
  });

  it("posts payload to the responses endpoint", async () => {
    const payload = { output: [{ content: [] }] };
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify(payload), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const result = await callOpenAiResponses({ model: "gpt-4o-mini", input: "hello" }, fetchMock);

    expect(result).toEqual(payload);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://example.com/v1/responses",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: `Bearer ${serverEnv.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        }),
      }),
    );
  });

  it("throws a network error when fetch rejects", async () => {
    fetchMock.mockRejectedValue(new Error("boom"));

    await expect(callOpenAiResponses({ model: "gpt-4o-mini", input: "hi" }, fetchMock)).rejects.toMatchObject({
      message: "openai_network_error",
      status: 502,
    });
  });

  it("includes upstream response details on failure", async () => {
    fetchMock.mockResolvedValue(
      new Response("nope", {
        status: 429,
        headers: { "Content-Type": "text/plain" },
      }),
    );

    await expect(callOpenAiResponses({ model: "gpt-4o-mini", input: "hi" }, fetchMock)).rejects.toMatchObject({
      message: "openai_upstream_error",
      status: 429,
      detail: "nope",
    });
  });

  it("wraps JSON parsing failures", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.reject(new Error("bad json")),
    } as unknown as Response);

    await expect(callOpenAiResponses({ model: "gpt-4o-mini", input: "hi" }, fetchMock)).rejects.toBeInstanceOf(
      OpenAiRequestError,
    );
  });
});
