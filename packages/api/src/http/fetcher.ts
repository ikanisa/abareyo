import { z } from "zod";

import { clientEnv } from "@rayon/config/env";

export class ApiError extends Error {
  readonly status: number;
  readonly statusText: string;
  readonly body: unknown;
  readonly url: string;
  readonly method: string;

  constructor({
    message,
    status,
    statusText,
    body,
    url,
    method,
  }: {
    message: string;
    status: number;
    statusText: string;
    body: unknown;
    url: string;
    method: string;
  }) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.statusText = statusText;
    this.body = body;
    this.url = url;
    this.method = method;
  }
}

export type FetchImplementation = typeof fetch;

export type RequestEncoder<TInput> = (input: TInput) => BodyInit | undefined;

export type RequestOptions<TInput> = Omit<RequestInit, "body"> & {
  /**
   * Optional payload that will be JSON encoded unless a custom encoder is provided.
   */
  body?: TInput;
  /**
   * Zod schema used to validate and coerce the request payload prior to encoding.
   */
  inputSchema?: z.ZodType<TInput>;
  /**
   * Custom encoder for the validated request payload.
   */
  encode?: RequestEncoder<TInput>;
};

export type ApiFetcher = <TOutput, TInput = unknown>(
  path: string,
  schema: z.ZodType<TOutput>,
  options?: RequestOptions<TInput>,
) => Promise<TOutput>;

export type ApiFetcherConfig = {
  baseUrl?: string;
  credentials?: RequestCredentials;
  fetch?: FetchImplementation;
  /**
   * Optional response transformer when a request returns a 401/403 status.
   * By default a failed response throws an {@link ApiError}.
   */
  onUnauthorized?: (error: ApiError) => Promise<unknown> | unknown;
};

const encodeJson = <TInput>(input: TInput): BodyInit | undefined => {
  if (input === undefined || input === null) {
    return undefined;
  }

  if (input instanceof FormData || input instanceof URLSearchParams || input instanceof Blob) {
    return input;
  }

  if (typeof input === "string" || input instanceof ArrayBuffer || ArrayBuffer.isView(input)) {
    return input as BodyInit;
  }

  return JSON.stringify(input);
};

const readBody = async (response: Response): Promise<unknown> => {
  const contentType = response.headers.get("content-type") ?? "";
  if (response.status === 204 || response.status === 205) {
    return undefined;
  }

  if (contentType.includes("application/json")) {
    return await response.json();
  }

  const text = await response.text();
  if (!text) {
    return undefined;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

const resolveBaseUrl = (config?: ApiFetcherConfig): string => {
  const raw = config?.baseUrl ?? clientEnv.NEXT_PUBLIC_BACKEND_URL ?? "/api";
  return raw.replace(/\/$/, "");
};

const ensureHeaders = (init?: RequestInit): Headers => {
  if (init?.headers instanceof Headers) {
    return init.headers;
  }

  const headers = new Headers(init?.headers);
  return headers;
};

export const createApiFetcher = (config?: ApiFetcherConfig): ApiFetcher => {
  const baseUrl = resolveBaseUrl(config);
  const fetchImpl = config?.fetch ?? globalThis.fetch.bind(globalThis);
  const defaultCredentials = config?.credentials ?? "include";

  return async <TOutput, TInput = unknown>(
    path: string,
    schema: z.ZodType<TOutput>,
    options?: RequestOptions<TInput>,
  ): Promise<TOutput> => {
    const requestUrl = `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
    const { inputSchema, encode = encodeJson, body, ...init } = options ?? {};
    const validatedBody = inputSchema ? inputSchema.parse(body) : body;
    const headers = ensureHeaders(init);
    const encoded = encode(validatedBody as TInput);

    const isStructuredBody =
      validatedBody !== undefined &&
      validatedBody !== null &&
      typeof validatedBody === "object" &&
      !(validatedBody instanceof FormData) &&
      !(validatedBody instanceof URLSearchParams) &&
      !(typeof Blob !== "undefined" && validatedBody instanceof Blob) &&
      !(validatedBody instanceof ArrayBuffer) &&
      !ArrayBuffer.isView(validatedBody);

    if (encoded !== undefined && isStructuredBody && !headers.has("content-type")) {
      headers.set("content-type", "application/json");
    }

    const response = await fetchImpl(requestUrl, {
      ...init,
      headers,
      body: encoded,
      credentials: init.credentials ?? defaultCredentials,
    });

    const payload = await readBody(response).catch(() => undefined);

    if (!response.ok) {
      const error = new ApiError({
        message: `Request to ${requestUrl} failed with status ${response.status}`,
        status: response.status,
        statusText: response.statusText,
        body: payload,
        url: requestUrl,
        method: init.method ?? "GET",
      });

      if (response.status === 401 || response.status === 403) {
        if (config?.onUnauthorized) {
          return (await config.onUnauthorized(error)) as TOutput;
        }
      }

      throw error;
    }

    return schema.parse(payload);
  };
};
