import { describe, expect, it } from "vitest";

import {
  PWA_OPT_IN_KEY,
  PWA_OPT_IN_TTL_MS,
  getStoredPwaOptIn,
  parsePwaOptInRecord,
  serialisePwaOptInRecord,
} from "@/app/_lib/pwa";

class MemoryStorage implements Storage {
  private store = new Map<string, string>();

  clear(): void {
    this.store.clear();
  }

  get length(): number {
    return this.store.size;
  }

  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key) ?? null : null;
  }

  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }
}

describe("parsePwaOptInRecord", () => {
  it("returns a record for valid stored JSON", () => {
    const now = Date.now();
    const payload = serialisePwaOptInRecord({ reason: "install" }, now);
    const parsed = parsePwaOptInRecord(payload);
    expect(parsed).toEqual({
      optedIn: true,
      reason: "install",
      timestamp: now,
    });
  });

  it("returns null for invalid payloads", () => {
    expect(parsePwaOptInRecord(null)).toBeNull();
    expect(parsePwaOptInRecord("not-json")).toBeNull();
    expect(parsePwaOptInRecord(JSON.stringify({ reason: "install" }))).toBeNull();
  });
});

describe("getStoredPwaOptIn", () => {
  it("returns the stored record when within TTL", () => {
    const storage = new MemoryStorage();
    const now = Date.now();
    storage.setItem(PWA_OPT_IN_KEY, serialisePwaOptInRecord({ reason: "settings" }, now));

    const record = getStoredPwaOptIn(storage, now + PWA_OPT_IN_TTL_MS - 1000);
    expect(record).toEqual({
      optedIn: true,
      reason: "settings",
      timestamp: now,
    });
  });

  it("clears expired records", () => {
    const storage = new MemoryStorage();
    const now = Date.now() - PWA_OPT_IN_TTL_MS - 1000;
    storage.setItem(PWA_OPT_IN_KEY, serialisePwaOptInRecord({ reason: "install" }, now));

    const record = getStoredPwaOptIn(storage, Date.now());
    expect(record).toBeNull();
    expect(storage.getItem(PWA_OPT_IN_KEY)).toBeNull();
  });
});
