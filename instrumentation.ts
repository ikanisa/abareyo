import type { RegisterOptions } from "@sentry/nextjs";

/**
 * Ensures Sentry initialises in all runtimes without relying on legacy auto-instrumentation hooks.
 * Next.js invokes this register function during boot, so we dynamically import the matching config.
 */
export const register = async (_options?: RegisterOptions) => {
  const runtime = process.env.NEXT_RUNTIME;

  if (runtime === "edge") {
    await import("./sentry.edge.config");
    return;
  }

  if (runtime === "nodejs") {
    await import("./sentry.server.config");
    return;
  }

  if (runtime === "client") {
    await import("./sentry.client.config");
  }
};
