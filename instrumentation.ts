/**
 * Ensures Sentry initialises in all runtimes without relying on legacy auto-instrumentation hooks.
 * Next.js invokes this register function during boot, so we dynamically import the matching config.
 */
export const register = async () => {
  const runtime = process.env.NEXT_RUNTIME;

  if (!runtime || runtime === "nodejs") {
    await import("./sentry.server.config");
    return;
  }

  if (runtime === "client") {
    await import("./sentry.client.config");
    return;
  }

  if (runtime === "edge") {
    await import("./sentry.edge.config");
  }
};
