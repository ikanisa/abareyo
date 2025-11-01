import { describe, expect, it } from "vitest";

import { maskMsisdn } from "@/lib/msisdn";

describe("maskMsisdn", () => {
  it("masks standard mobile numbers", () => {
    expect(maskMsisdn("0781234567")).toBe("078*****67");
  });

  it("preserves leading plus and masks digits", () => {
    expect(maskMsisdn("+250781234567")).toBe("+250*******67");
  });

  it("returns null for short or placeholder values", () => {
    expect(maskMsisdn("07")).toBeNull();
    expect(maskMsisdn("07xxxxxxx")).toBeNull();
  });

  it("ensures at least two masked characters", () => {
    expect(maskMsisdn("0781234")).toBe("078**34");
  });
});
