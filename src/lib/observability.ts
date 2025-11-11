import * as Sentry from "@sentry/nextjs";

import { clientEnv, serverEnv } from "@/config/env";
import { getCorrelationId } from "@/lib/observability/correlation";

type TelemetryEvent = {
  type: string;
  timestamp?: number;
  [key: string]: unknown;
};

const SENTRY_DSN_SOURCES = [
  clientEnv.NEXT_PUBLIC_SENTRY_DSN,
  serverEnv.SENTRY_DSN,
  serverEnv.BACKEND_SENTRY_DSN,
  serverEnv.BACKEND_SENTRY_DSN_STAGING,
  serverEnv.BACKEND_SENTRY_DSN_PRODUCTION,
];

const resolveSentryDsn = () =>
  SENTRY_DSN_SOURCES.find((dsn) => typeof dsn === "string" && dsn.trim().length > 0)?.trim() ?? null;

const HAS_SENTRY_CONFIGURATION = Boolean(resolveSentryDsn());
const DEFAULT_TELEMETRY_ENDPOINT = clientEnv.NEXT_PUBLIC_TELEMETRY_URL || "/api/telemetry/app-state";

const isBrowser = typeof window !== "undefined";

let sentryWarningLogged = false;

const logWarningOnce = () => {
  if (!sentryWarningLogged) {
    sentryWarningLogged = true;
    console.warn(
      "[observability] Sentry DSN not configured. Exceptions will only be logged locally and forwarded to telemetry endpoints.",
    );
  }
};

const captureWithSentry = (error: unknown, context?: Record<string, unknown>) => {
  if (!HAS_SENTRY_CONFIGURATION) {
    return false;
  }

  const hub = Sentry.getCurrentHub?.();
  const client = hub?.getClient?.();

  if (!client) {
    return false;
  }

  const correlationId = getCorrelationId();

  hub?.configureScope?.((scope) => {
    scope.setTag("correlation_id", correlationId);
    if (context && Object.keys(context).length > 0) {
      scope.setContext("extra", context as Record<string, unknown>);
    }
  });

  if (context && Object.keys(context).length > 0) {
    Sentry.captureException(error, { extra: context });
  } else {
    Sentry.captureException(error);
  }

  return true;
};

export const getResolvedSentryDsn = () => resolveSentryDsn();

const createPayload = (event: TelemetryEvent) => {
  const timestamp = event.timestamp ?? Date.now();
  return JSON.stringify({ ...event, timestamp });
};

export const captureException = (error: unknown, context?: Record<string, unknown>) => {
  if (!captureWithSentry(error, context)) {
    logWarningOnce();

    if (context && Object.keys(context).length > 0) {
      console.error("[observability] exception", { context, error });
      return;
    }

    console.error("[observability] exception", error);
  }
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
    } catch (_error) {
      // Ignore beacon errors and fall back to fetch
    }

    try {
      await fetch(endpoint, {
        method: "POST",
        body,
        headers: { "content-type": "application/json" },
        keepalive: true,
      });
    } catch (_error) {
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
  } catch (_error) {
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
