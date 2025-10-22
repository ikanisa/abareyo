import { beforeEach, describe, expect, it, vi } from "vitest";

const recordAppStateEventMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/observability", () => ({
  recordAppStateEvent: recordAppStateEventMock,
}));

import {
  dispatchAnalyticsEvent,
  subscribeToAnalytics,
  track,
} from "@/lib/track";

describe("track helpers", () => {
  beforeEach(() => {
    recordAppStateEventMock.mockReset();
  });

  it("dispatches analytics events and records telemetry", () => {
    const handler = vi.fn();
    const unsubscribe = subscribeToAnalytics(handler);

    track("tickets.purchase", { amount: 1200 });

    expect(handler).toHaveBeenCalledWith({ name: "tickets.purchase", props: { amount: 1200 } });
    expect(recordAppStateEventMock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "analytics-event",
        name: "tickets.purchase",
        props: { amount: 1200 },
        dispatched: true,
      }),
    );

    unsubscribe();
  });

  it("supports manual event dispatch and cleanup", () => {
    const handler = vi.fn();
    const unsubscribe = subscribeToAnalytics(handler);

    const dispatched = dispatchAnalyticsEvent({ name: "custom", props: { foo: "bar" } });

    expect(dispatched).toBe(true);
    expect(handler).toHaveBeenCalledWith({ name: "custom", props: { foo: "bar" } });

    handler.mockClear();
    unsubscribe();

    dispatchAnalyticsEvent({ name: "after", props: undefined });
    expect(handler).not.toHaveBeenCalled();
  });

  it("falls back gracefully when analytics listeners throw", () => {
    const faulty = vi.fn(() => {
      throw new Error("boom");
    });

    const unsubscribe = subscribeToAnalytics(faulty);

    expect(() => dispatchAnalyticsEvent({ name: "boom" })).not.toThrow();

    unsubscribe();
  });
});
