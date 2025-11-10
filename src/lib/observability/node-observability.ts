import pino, { type Logger, type LogFn, type TransportTargetOptions } from "pino";

import { installFetchInterceptor } from "@/lib/observability/fetch-interceptor";
import { resolveSentryConfiguration } from "./sentry-config";

let lokiLogger: Logger | undefined;
let consolePatched = false;
const originalConsoleMethods: Partial<Record<keyof Console, ((...args: unknown[]) => unknown) | undefined>> = {};

const buildLokiTarget = (service: string, environment: string, level: string): TransportTargetOptions | null => {
  const host = process.env.LOKI_URL ?? process.env.LOKI_HOST ?? "";
  if (!host) {
    return null;
  }

  const batchInterval = Number(process.env.LOKI_BATCH_INTERVAL ?? "5");
  const basicAuthEnv =
    process.env.LOKI_BASIC_AUTH ??
    (process.env.LOKI_USERNAME && process.env.LOKI_PASSWORD
      ? `${process.env.LOKI_USERNAME}:${process.env.LOKI_PASSWORD}`
      : undefined);
  const headers = process.env.LOKI_TENANT_ID
    ? {
        "X-Scope-OrgID": process.env.LOKI_TENANT_ID,
      }
    : undefined;

  return {
    target: "pino-loki",
    level,
    options: {
      host,
      batching: true,
      interval: Number.isFinite(batchInterval) ? Math.max(1, batchInterval) : 5,
      labels: {
        service,
        env: environment,
      },
      basicAuth: basicAuthEnv,
      headers,
    },
  } satisfies TransportTargetOptions;
};

const patchConsole = (logger: Logger) => {
  if (consolePatched) {
    return;
  }

  const mapLevel = (method: keyof Console): keyof Logger => {
    switch (method) {
      case "error":
        return "error";
      case "warn":
        return "warn";
      case "debug":
        return "debug";
      default:
        return "info";
    }
  };


  const emitLog = (method: keyof Logger, payload: unknown) => {
    const fn = logger[method] as unknown as LogFn | undefined;
    // Accept any payload shape; pino LogFn overloads include string/object.
    fn?.call(logger as unknown as Record<string, unknown>, payload as unknown as string);
  };

  const methods: (keyof Console)[] = ["log", "info", "warn", "error", "debug"];

  methods.forEach((method) => {
    const original = console[method] as unknown as ((...args: unknown[]) => unknown) | undefined;
    if (!originalConsoleMethods[method]) {
      originalConsoleMethods[method] = original;
    }
    const consoleRef = console as unknown as Record<string, (...args: unknown[]) => unknown>;
    consoleRef[method as string] = (...args: unknown[]) => {
      const logFn = mapLevel(method);
      if (args.length === 1) {
        emitLog(logFn, args[0]);
      } else {
        emitLog(logFn, args);
      }
      return original?.apply(console, args);
    };
  });

  consolePatched = true;
};

export const setupNodeObservability = (service = "nextjs-frontend") => {
  if (typeof window !== "undefined") {
    return;
  }

  if (lokiLogger) {
    return;
  }

  const { environment } = resolveSentryConfiguration("server");
  const level = process.env.LOG_LEVEL ?? process.env.APP_LOG_LEVEL ?? "info";

  const transportTargets: TransportTargetOptions[] = [
    {
      target: "pino/file",
      level,
      options: { destination: 1 },
    },
  ];

  const lokiTarget = buildLokiTarget(service, environment, level);
  if (lokiTarget) {
    transportTargets.push(lokiTarget);
  }

  const transport = pino.transport({
    targets: transportTargets,
  });

  lokiLogger = pino({ level }, transport);
  patchConsole(lokiLogger);
  installFetchInterceptor();
};

export const resetNodeObservability = () => {
  lokiLogger = undefined;
  if (!consolePatched) {
    return;
  }
  const consoleRef = console as unknown as Record<string, (...args: unknown[]) => unknown>;
  (["log", "info", "warn", "error", "debug"] as (keyof Console)[]).forEach((method) => {
    const original = originalConsoleMethods[method];
    if (original) {
      consoleRef[method as string] = original;
      originalConsoleMethods[method] = undefined;
    }
  });
  consolePatched = false;
};
