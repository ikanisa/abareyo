import { getCorrelationId, withCorrelationHeaders } from "@/lib/observability/correlation";

let installed = false;

const applyHeaders = (headers: Headers, correlationId: string) => {
  if (!headers.has("x-correlation-id")) {
    headers.set("x-correlation-id", correlationId);
  }
  if (!headers.has("x-request-id")) {
    headers.set("x-request-id", correlationId);
  }
};

const mergeHeaders = (target: Headers, source: Headers) => {
  source.forEach((value, key) => {
    target.set(key, value);
  });
};

export const installFetchInterceptor = () => {
  if (installed || typeof globalThis.fetch !== "function") {
    return;
  }

  const originalFetch = globalThis.fetch.bind(globalThis);

  const patchedFetch: typeof fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const correlationId = getCorrelationId();

    if (input instanceof Request) {
      const baseHeaders = new Headers(input.headers);
      applyHeaders(baseHeaders, correlationId);

      if (init?.headers) {
        const override = new Headers(init.headers);
        mergeHeaders(baseHeaders, override);
      }

      const nextRequest = new Request(input, { ...init, headers: baseHeaders });
      return originalFetch(nextRequest);
    }

    const nextInit = withCorrelationHeaders(init);
    return originalFetch(input, nextInit);
  };

  globalThis.fetch = patchedFetch;
  installed = true;
};
