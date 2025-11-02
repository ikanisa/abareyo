import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const originalCopy = process.env.NEXT_PUBLIC_ROLLOUT_USSD_COPY;
const originalAnalytics = process.env.NEXT_PUBLIC_ROLLOUT_USSD_ANALYTICS;

const importComponent = async ({ copyRollout = "off", analyticsRollout = "on" } = {}) => {
  vi.resetModules();
  process.env.NEXT_PUBLIC_ROLLOUT_USSD_COPY = copyRollout;
  process.env.NEXT_PUBLIC_ROLLOUT_USSD_ANALYTICS = analyticsRollout;

  const recordMock = vi.fn().mockResolvedValue(undefined);
  vi.doMock("@/lib/observability", () => ({
    recordAppStateEvent: recordMock,
  }));

  const module = await import("@web/app/_components/payments/UssdPayButton");
  const { recordAppStateEvent } = await import("@/lib/observability");

  return { Component: module.default, recordAppStateEvent };
};

afterEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
});

beforeEach(() => {
  if (originalCopy === undefined) {
    delete process.env.NEXT_PUBLIC_ROLLOUT_USSD_COPY;
  } else {
    process.env.NEXT_PUBLIC_ROLLOUT_USSD_COPY = originalCopy;
  }

  if (originalAnalytics === undefined) {
    delete process.env.NEXT_PUBLIC_ROLLOUT_USSD_ANALYTICS;
  } else {
    process.env.NEXT_PUBLIC_ROLLOUT_USSD_ANALYTICS = originalAnalytics;
  }
});

describe("UssdPayButton (web)", () => {
  it("renders disabled state when amount is unavailable", async () => {
    const { Component } = await importComponent();
    render(<Component amount={0} disabledLabel="Sold out" />);

    const disabledButton = screen.getByRole("button", { name: /sold out/i });
    expect(disabledButton).toBeDisabled();
  });

  it("exposes copy fallback on iOS when rollout enabled", async () => {
    const clipboardWrite = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(window.navigator, "clipboard", {
      configurable: true,
      value: { writeText: clipboardWrite },
    });

    const userAgentSpy = vi.spyOn(window.navigator, "userAgent", "get").mockReturnValue(
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)",
    );
    const originalMaxTouchPoints = (window.navigator as Navigator & { maxTouchPoints?: number }).maxTouchPoints;
    Object.defineProperty(window.navigator, "maxTouchPoints", { configurable: true, value: 5 });

    const { Component, recordAppStateEvent } = await importComponent({ copyRollout: "on", analyticsRollout: "on" });

    render(<Component amount={2500} phone="0780000000" />);

    const dialLink = screen.getByRole("link", { name: /pay via ussd/i });
    expect(dialLink).toHaveAttribute("href", "tel:*182*1*1*0780000000*2500%23");

    const copyButton = screen.getByRole("button", { name: /copy ussd/i });
    await userEvent.click(copyButton);

    expect(clipboardWrite).toHaveBeenCalledWith("*182*1*1*0780000000*2500#");
    expect(copyButton).toHaveTextContent(/code copied/i);
    expect(screen.getByTestId("ussd-display-code")).toHaveTextContent("*182*1*1*0780000000*2500#");
    expect(recordAppStateEvent).toHaveBeenCalledWith(
      {
        type: "ussd-copy",
        displayCode: "*182*1*1*0780000000*2500#",
        succeeded: true,
      },
    );

    userAgentSpy.mockRestore();
    if (typeof originalMaxTouchPoints === "number") {
      Object.defineProperty(window.navigator, "maxTouchPoints", {
        configurable: true,
        value: originalMaxTouchPoints,
      });
    } else {
      delete (window.navigator as Navigator & { maxTouchPoints?: number }).maxTouchPoints;
    }
    delete (window.navigator as Navigator & { clipboard?: unknown }).clipboard;
  });
});
