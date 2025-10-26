import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const recordAppStateEventMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/observability", () => ({
  recordAppStateEvent: recordAppStateEventMock,
}));

import {
  Analytics,
  AnalyticsProvider,
  type AnalyticsBridge,
  track,
  useAnalytics,
  useTrack,
} from "@/lib/analytics";

const flushAnalytics = async (bridge: AnalyticsBridge | undefined) => {
  await bridge?.flush();
  bridge?.identify("noop");
  bridge?.pageview("noop");
};

describe("analytics compatibility shims", () => {
  beforeEach(() => {
    recordAppStateEventMock.mockReset();
  });

  it("renders Analytics as a no-op component", () => {
    const { container } = render(<Analytics />);
    expect(container.firstChild).toBeNull();
  });

  it("exposes stable hooks and providers without runtime dependencies", async () => {
    const captured: { value?: AnalyticsBridge; trackFn?: typeof track } = {};

    const Consumer = () => {
      captured.value = useAnalytics();
      captured.trackFn = useTrack();
      return <span>shim-child</span>;
    };

    const { rerender } = render(
      <AnalyticsProvider>
        <Consumer />
      </AnalyticsProvider>,
    );

    expect(screen.getByText("shim-child")).toBeInTheDocument();
    expect(captured.value).toBeDefined();
    expect(captured.value?.track).toBe(track);
    expect(typeof captured.value?.flush).toBe("function");
    expect(typeof captured.value?.identify).toBe("function");
    expect(typeof captured.value?.pageview).toBe("function");
    expect(captured.trackFn).toBe(track);

    const previousValue = captured.value;
    const previousTrack = captured.trackFn;

    rerender(
      <AnalyticsProvider>
        <Consumer />
      </AnalyticsProvider>,
    );

    expect(captured.value).toBe(previousValue);
    expect(captured.trackFn).toBe(previousTrack);

    await flushAnalytics(captured.value);
    captured.trackFn?.("shim.event", { foo: "bar" });

    expect(recordAppStateEventMock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "analytics-event",
        name: "shim.event",
        props: { foo: "bar" },
      }),
    );
  });
});
