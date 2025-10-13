const ENDPOINT = "/api/marketplace/events";

export type MarketplaceTelemetryEvent = {
  event: string;
  locale?: string;
  payload?: Record<string, unknown>;
};

const sendWithBeacon = (body: string) => {
  if (navigator.sendBeacon) {
    const blob = new Blob([body], { type: "application/json" });
    navigator.sendBeacon(ENDPOINT, blob);
    return true;
  }
  return false;
};

export const reportMarketplaceEvent = (input: MarketplaceTelemetryEvent) => {
  if (typeof window === "undefined") return;
  const payload = {
    ...input,
    timestamp: new Date().toISOString(),
  };
  const body = JSON.stringify(payload);
  try {
    if (!sendWithBeacon(body)) {
      void fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
      });
    }
  } catch (error) {
    console.warn("Failed to record marketplace event", error);
  }
};
