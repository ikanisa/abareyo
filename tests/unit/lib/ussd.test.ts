import { describe, expect, it, vi } from "vitest";

import { formatTelUri, launchUssdDialer, startClipboardFirstUssdHandoff } from "@/lib/ussd";
import { recordAppStateEvent } from "@/lib/observability";

vi.mock("@/lib/observability", () => ({
  recordAppStateEvent: vi.fn().mockResolvedValue(undefined),
}));

describe("lib/ussd", () => {
  it("launches the dialer, schedules iOS fallback, and records analytics", () => {
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
      {
        type: "ussd-launch",
        href: "tel:*182*1*1*0780000000*2000%23",
        original: "*182*1*1*0780000000*2000#",
        fallbackConfigured: true,
      },
      undefined,
    );
  });

  it("performs clipboard-first handoff and reports dialer attempts", async () => {
    const appendChild = vi.fn();
    const removeChild = vi.fn();
    const fakeAnchor = {
      href: "",
      style: { display: "" } as CSSStyleDeclaration,
      rel: "",
      click: vi.fn(),
    } as unknown as HTMLAnchorElement;

    const fakeDocument = {
      body: { appendChild, removeChild },
      createElement: vi.fn().mockReturnValue(fakeAnchor),
      execCommand: vi.fn(),
    } as unknown as Document;

    const writeText = vi.fn().mockResolvedValue(undefined);
    const fakeNavigator = {
      userAgent: "Mozilla/5.0 (Linux; Android 14; Pixel 7)",
      clipboard: { writeText },
    } as unknown as Navigator;

    const fakeWindow = {
      navigator: fakeNavigator,
      setTimeout: vi.fn(),
    } as unknown as Window;

    const result = await startClipboardFirstUssdHandoff("*182*1*1*0780000000*2000#", {
      documentRef: fakeDocument,
      windowRef: fakeWindow,
      navigatorRef: fakeNavigator,
    });

    expect(writeText).toHaveBeenCalledWith("*182*1*1*0780000000*2000#");
    expect(fakeDocument.createElement).toHaveBeenCalledWith("a");
    expect(result).toEqual({
      displayCode: "*182*1*1*0780000000*2000#",
      copied: true,
      dialerAttempted: true,
      fallbackExpected: false,
    });
  });

  it("normalises tel URIs within the browser helper", () => {
    expect(formatTelUri("*182*1*1*0780000000*1000#")).toBe("tel:*182*1*1*0780000000*1000%23");
  });
});
