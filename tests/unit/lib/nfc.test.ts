import { describe, expect, it, vi } from "vitest";

import { emitNfcTap, emitNfcTransactionPending, NFC_TAP_EVENT, NFC_TRANSACTION_EVENT } from "@/lib/nfc";

const withWindow = (callback: () => void) => {
  const originalWindow = globalThis.window;
  Object.defineProperty(globalThis, "window", {
    value: originalWindow ?? {},
    configurable: true,
    writable: true,
  });
  try {
    callback();
  } finally {
    if (originalWindow === undefined) {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete (globalThis as { window?: Window }).window;
    } else {
      Object.defineProperty(globalThis, "window", { value: originalWindow, configurable: true, writable: true });
    }
  }
};

describe("nfc helpers", () => {
  it("dispatches tap events in the browser", () => {
    withWindow(() => {
      const listener = vi.fn();
      window.addEventListener(NFC_TAP_EVENT, listener as EventListener);
      const dispatched = emitNfcTap({ token: "abc", method: "nfc" });
      window.dispatchEvent(new Event("noop"));
      expect(dispatched).toBe(true);
      expect(listener).toHaveBeenCalledTimes(1);
      window.removeEventListener(NFC_TAP_EVENT, listener as EventListener);
    });
  });

  it("dispatches transaction events", () => {
    withWindow(() => {
      const listener = vi.fn();
      window.addEventListener(NFC_TRANSACTION_EVENT, listener as EventListener);
      const dispatched = emitNfcTransactionPending({ transactionId: "tx-1", amount: 5000 });
      expect(dispatched).toBe(true);
      expect(listener).toHaveBeenCalledTimes(1);
      window.removeEventListener(NFC_TRANSACTION_EVENT, listener as EventListener);
    });
  });

  it("returns false when window unavailable", () => {
    const original = globalThis.window;
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete (globalThis as { window?: Window }).window;
    expect(emitNfcTap({ token: "abc" })).toBe(false);
    expect(emitNfcTransactionPending({ transactionId: "tx-1" })).toBe(false);
    if (original) {
      Object.defineProperty(globalThis, "window", { value: original, configurable: true, writable: true });
    }
  });
});
