export const register = async (_options?: Record<string, unknown>) => {
  const runtime = process.env.NEXT_RUNTIME;

  if (runtime === "nodejs") {
    const { setupNodeObservability } = await import("./src/lib/observability/node-observability");
    setupNodeObservability();
    await import("./sentry.server.config");
    return;
  }

  if (runtime === "edge") {
    await import("./sentry.edge.config");
    return;
  }

  if (runtime === "client") {
    await import("./sentry.client.config");
  }
};
