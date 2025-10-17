import * as Sentry from "@sentry/nextjs";

type TelemetryEvent = {
  type: string;
  timestamp?: number;
  [key: string]: unknown;
};

const SENTRY_ENABLED = Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN);
const DEFAULT_TELEMETRY_ENDPOINT = process.env.NEXT_PUBLIC_TELEMETRY_URL || "/api/telemetry/app-state";

const isBrowser = typeof window !== "undefined";

const createPayload = (event: TelemetryEvent) => {
  const timestamp = event.timestamp ?? Date.now();
  return JSON.stringify({ ...event, timestamp });
};

export const captureException = (error: unknown, context?: Record<string, unknown>) => {
  if (!SENTRY_ENABLED) {
    return;
  }

  if (context && Object.keys(context).length > 0) {
    Sentry.withScope((scope) => {
      Object.entries(context).forEach(([key, value]) => {
        scope.setExtra(key, value as unknown as string | number | boolean | null);
      });
      Sentry.captureException(error);
    });
    return;
  }

  Sentry.captureException(error);
};

export const dispatchTelemetryEvent = async (
  event: TelemetryEvent,
  endpoint: string = DEFAULT_TELEMETRY_ENDPOINT,
) => {
  const body = createPayload(event);

  if (isBrowser) {
    try {
      if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
        navigator.sendBeacon(endpoint, body);
        return;
      }
    } catch (error) {
      // Ignore beacon errors and fall back to fetch
    }

    try {
      await fetch(endpoint, {
        method: "POST",
        body,
        headers: { "content-type": "application/json" },
        keepalive: true,
      });
    } catch (error) {
      // Suppress network failures for telemetry
    }

    return;
  }

  try {
    await fetch(endpoint, {
      method: "POST",
      body,
      headers: { "content-type": "application/json" },
    });
  } catch (error) {
    // Telemetry is best-effort on the server as well
  }
};

export const recordClientException = async (
  error: unknown,
  info?: { componentStack?: string },
  endpoint: string = DEFAULT_TELEMETRY_ENDPOINT,
) => {
  const stack = info?.componentStack;

  captureException(error, stack ? { componentStack: stack } : undefined);

  const description = error instanceof Error ? error.message : String(error);
  const userAgent = isBrowser ? window.navigator?.userAgent ?? "unknown" : "ssr";

  await dispatchTelemetryEvent(
    {
      type: "client-error",
      description,
      stack: error instanceof Error ? error.stack ?? stack ?? null : stack ?? null,
      userAgent,
    },
    endpoint,
  );
};

export const recordAppStateEvent = async (
  state: { type: string; [key: string]: unknown },
  endpoint: string = DEFAULT_TELEMETRY_ENDPOINT,
) => {
  await dispatchTelemetryEvent({ ...state, type: state.type }, endpoint);
};

export const recordPageView = async (
  event: {
    path: string;
    locale?: string | null;
    referrer?: string | null;
    title?: string | null;
  },
  endpoint: string = DEFAULT_TELEMETRY_ENDPOINT,
) => {
  await dispatchTelemetryEvent(
    {
      type: "page-view",
      path: event.path,
      locale: event.locale ?? null,
      referrer: event.referrer ?? null,
      title: event.title ?? null,
      timestamp: Date.now(),
    },
    endpoint,
  );
};

export const recordNavigationEvent = async (
  event: {
    source: string;
    destination: string;
    label?: string;
    locale?: string | null;
  },
  endpoint: string = DEFAULT_TELEMETRY_ENDPOINT,
) => {
  await dispatchTelemetryEvent(
    {
      type: "navigation",
      source: event.source,
      destination: event.destination,
      label: event.label ?? null,
      locale: event.locale ?? null,
      timestamp: Date.now(),
    },
    endpoint,
  );
};

export type HomeInteractionEvent = {
  action:
    | "quick-action"
    | "gamification"
    | "story"
    | "fixture"
    | "wallet-action"
    | "sponsor"
    | "community";
  id: string;
  label?: string;
};

export const trackHomeInteraction = async (
  event: HomeInteractionEvent,
  endpoint: string = DEFAULT_TELEMETRY_ENDPOINT,
) => {
  await dispatchTelemetryEvent(
    {
      type: "home-interaction",
      ...event,
      timestamp: Date.now(),
    },
    endpoint,
  );
};

export const trackHomeSurfaceViewed = async (
  payload: { generatedAt: string; modules: string[] },
  endpoint: string = DEFAULT_TELEMETRY_ENDPOINT,
) => {
  await dispatchTelemetryEvent(
    {
      type: "home-surface-view",
      generatedAt: payload.generatedAt,
      modules: payload.modules,
    },
    endpoint,
  );
};
