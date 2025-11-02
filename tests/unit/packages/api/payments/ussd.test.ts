import { describe, expect, it } from "vitest";

import {
  buildUssd,
  buildUssdString,
  createUssdCopyEvent,
  createUssdLaunchEvent,
  formatTelUri,
  formatUssdDisplay,
  isIOS,
  sanitizeAmount,
  sanitizePhoneNumber,
} from "@rayon/api/payments/ussd";

describe("packages/api/payments/ussd", () => {
  it("sanitises primitive values before building USSD payloads", () => {
    expect(sanitizeAmount(1499.7)).toBe("1500");
    expect(sanitizeAmount(-12)).toBe("0");
    expect(sanitizeAmount(Number.NaN)).toBe("0");

    expect(sanitizePhoneNumber(undefined)).toBeNull();
    expect(sanitizePhoneNumber("078 888 999")).toBe("078888999");
    expect(sanitizePhoneNumber("+250 788 888 999")).toBe("250788888999");
  });

  it("normalises tel URIs for display and navigation", () => {
    const raw = "*182*1*1*0780000000*2500#";
    expect(formatTelUri(raw)).toBe("tel:*182*1*1*0780000000*2500%23");
    expect(formatUssdDisplay(raw)).toBe("*182*1*1*0780000000*2500#");
    expect(formatUssdDisplay("tel:*500*1*07xxxxxxx*1000%23")).toBe("*500*1*07xxxxxxx*1000#");
  });

  it("builds tel URIs with provider-specific prefixes", () => {
    expect(buildUssdString({ amount: 1500 })).toBe("*182*1*1*07xxxxxxx*1500#");
    expect(buildUssd({ amount: 2000, phone: "0780000000" })).toBe("tel:*182*1*1*0780000000*2000%23");
    expect(buildUssd({ amount: 1200, phone: "0780000000", provider: "airtel" })).toBe(
      "tel:*500*1*0780000000*1200%23",
    );
  });

  it("detects iOS user agents using heuristics", () => {
    expect(isIOS({ userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)" } as Navigator)).toBe(true);
    expect(isIOS({ userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" } as Navigator)).toBe(false);
    expect(
      isIOS({ userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", maxTouchPoints: 4 } as Navigator),
    ).toBe(true);
  });

  it("creates telemetry payloads for launch and copy actions", () => {
    expect(
      createUssdLaunchEvent({
        href: "tel:*182*1*1*0780000000*2000%23",
        original: "*182*1*1*0780000000*2000#",
        fallbackConfigured: true,
      }),
    ).toEqual({
      type: "ussd-launch",
      href: "tel:*182*1*1*0780000000*2000%23",
      original: "*182*1*1*0780000000*2000#",
      fallbackConfigured: true,
    });

    expect(
      createUssdCopyEvent({
        displayCode: "*182*1*1*0780000000*2000#",
        succeeded: false,
      }),
    ).toEqual({
      type: "ussd-copy",
      displayCode: "*182*1*1*0780000000*2000#",
      succeeded: false,
    });
  });
});
