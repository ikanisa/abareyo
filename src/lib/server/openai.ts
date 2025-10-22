import { serverEnv } from "@/config/env";

const DEFAULT_OPENAI_BASE_URL = "https://api.openai.com/v1";

export type ResponsesPayload = {
  model: string;
  input: unknown;
  metadata?: Record<string, unknown>;
};

export class OpenAiRequestError extends Error {
  readonly status: number;
  readonly detail?: string;

  constructor(message: string, options: { status: number; detail?: string }) {
    super(message);
    this.name = "OpenAiRequestError";
    this.status = options.status;
    this.detail = options.detail;
  }
}

const buildEndpoint = (baseUrl: string) => {
  const trimmed = baseUrl.replace(/\/$/, "");
  return `${trimmed}/responses`;
};

export const callOpenAiResponses = async <T = unknown>(
  payload: ResponsesPayload,
  fetchImpl: typeof fetch = fetch,
  requestInit?: RequestInit,
): Promise<T> => {
  const baseUrl = serverEnv.NEXT_PUBLIC_OPENAI_BASE_URL?.trim() || DEFAULT_OPENAI_BASE_URL;
  const endpoint = buildEndpoint(baseUrl);

  let response: Response;
  try {
    response = await fetchImpl(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${serverEnv.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      ...requestInit,
    });
  } catch (error) {
    throw new OpenAiRequestError("openai_network_error", {
      status: 502,
      detail: error instanceof Error ? error.message : String(error),
    });
  }

  if (!response.ok) {
    const detail = await response
      .text()
      .catch(() => undefined);
    throw new OpenAiRequestError("openai_upstream_error", {
      status: response.status,
      detail,
    });
  }

  try {
    return (await response.json()) as T;
  } catch (error) {
    throw new OpenAiRequestError("openai_invalid_json", {
      status: 502,
      detail: error instanceof Error ? error.message : String(error),
    });
  }
};
