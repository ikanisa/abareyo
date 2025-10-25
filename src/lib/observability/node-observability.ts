import pino, { type Logger, type TransportTargetOptions } from "pino";

import { resolveSentryConfiguration } from "./sentry-config";

let lokiLogger: Logger | undefined;
let consolePatched = false;

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


  const methods: (keyof Console)[] = ["log", "info", "warn", "error", "debug"];

  methods.forEach((method) => {
    const original = console[method] as (...args: unknown[]) => unknown;

    console[method] = ((...args: unknown[]) => {
      const level = mapLevel(method);
      if (args.length === 1) {
        logger[level](args[0]);
      } else {
        logger[level](args);
      }
      return original.apply(console, args);
    }) as Console[typeof method];
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

  if (transportTargets.length === 1 && !lokiTarget) {
    return;
  }

  const transport = pino.transport({
    targets: transportTargets,
  });

  lokiLogger = pino({ level }, transport);
  patchConsole(lokiLogger);
};
