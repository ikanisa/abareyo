import { describe, expect, it, vi } from "vitest";

import {
  buildUssd,
  formatTelUri,
  isIOS,
  launchUssdDialer,
  sanitizeAmount,
  sanitizePhoneNumber,
} from "@/lib/ussd";
import { recordAppStateEvent } from "@/lib/observability";

vi.mock("@/lib/observability", () => ({
  recordAppStateEvent: vi.fn().mockResolvedValue(undefined),
}));

describe("ussd helpers", () => {
  it("sanitizes amounts and phone numbers", () => {
    expect(sanitizeAmount(1245.6)).toBe("1246");
    expect(sanitizeAmount(-10)).toBe("0");
    expect(sanitizeAmount(Number.NaN)).toBe("0");

    expect(sanitizePhoneNumber("078 888 999")).toBe("078888999");
    expect(sanitizePhoneNumber("+250 788 888 999")).toBe("250788888999");
    expect(sanitizePhoneNumber(undefined)).toBeNull();
  });

  it("formats tel URIs consistently", () => {
    expect(formatTelUri("*182*1*1*0780000000*1000#")).toBe("tel:*182*1*1*0780000000*1000%23");
    expect(formatTelUri("tel:*182*1*1*0780000000*1000%23"))
      .toBe("tel:*182*1*1*0780000000*1000%23");
    expect(formatTelUri("   ")).toBe("");
  });

  it("builds USSD links with placeholders when data missing", () => {
    expect(buildUssd({ amount: 1500 })).toBe("tel:*182*1*1*07xxxxxxx*1500%23");
    expect(buildUssd({ amount: 1500, phone: "0780000000" })).toBe(
      "tel:*182*1*1*0780000000*1500%23",
    );
  });

  it("detects iOS user agents", () => {
    expect(isIOS({ userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)" } as Navigator)).toBe(true);
    expect(isIOS({ userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" } as Navigator)).toBe(false);
    expect(isIOS({ userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", maxTouchPoints: 4 } as Navigator)).toBe(true);
  });

  it("launches dialer and triggers fallback on iOS", () => {
    const click = vi.fn();
    const appendChild = vi.fn();
    const removeChild = vi.fn();

    const fakeAnchor = {
      href: "",
      style: { display: "" } as CSSStyleDeclaration,
      rel: "",
      click,
    } as unknown as HTMLAnchorElement;

    const fakeDocument = {
      body: { appendChild, removeChild },
      createElement: vi.fn().mockReturnValue(fakeAnchor),
    } as unknown as Document;

    const onFallback = vi.fn();
    const fakeNavigator = {
      userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)",
      maxTouchPoints: 5,
    } as unknown as Navigator;

    const fakeWindow = {
      navigator: fakeNavigator,
      setTimeout: vi.fn((cb: () => void) => {
        cb();
        return 0;
      }),
    } as unknown as Window;

    launchUssdDialer("*182*1*1*0780000000*2000#", {
      documentRef: fakeDocument,
      windowRef: fakeWindow,
      onFallback,
    });

    expect(fakeDocument.createElement).toHaveBeenCalledWith("a");
    expect(appendChild).toHaveBeenCalledWith(fakeAnchor);
    expect(click).toHaveBeenCalled();
    expect(removeChild).toHaveBeenCalledWith(fakeAnchor);
    expect(fakeWindow.setTimeout).toHaveBeenCalled();
    expect(onFallback).toHaveBeenCalled();
    expect(recordAppStateEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "ussd-launch",
        href: "tel:*182*1*1*0780000000*2000%23",
      }),
      undefined,
    );
  });
});
