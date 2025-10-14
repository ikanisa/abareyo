export const PWA_OPT_IN_KEY = "rayon-pwa-opt-in";
export const PWA_OPT_IN_EVENT = "pwa-opt-in";
export const PWA_OPT_IN_TTL_MS = 1000 * 60 * 60 * 24 * 180; // 180 days

export type PwaOptInReason = "install" | "settings";

export type PwaOptInDetail = {
  reason: PwaOptInReason;
};

export type PwaOptInRecord = {
  optedIn: boolean;
  reason: PwaOptInReason;
  timestamp: number;
};

const hasWindow = () => typeof window !== "undefined";

export const serialisePwaOptInRecord = (detail: PwaOptInDetail, timestamp = Date.now()): string =>
  JSON.stringify({
    optedIn: true,
    reason: detail.reason,
    timestamp,
  } satisfies PwaOptInRecord);

export const parsePwaOptInRecord = (rawValue: string | null): PwaOptInRecord | null => {
  if (!rawValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue) as Partial<PwaOptInRecord>;
    if (!parsed || typeof parsed !== "object") {
      return null;
    }

    if (parsed.optedIn !== true) {
      return null;
    }

    if (typeof parsed.timestamp !== "number" || Number.isNaN(parsed.timestamp)) {
      return null;
    }

    if (parsed.reason !== "install" && parsed.reason !== "settings") {
      return null;
    }

    return {
      optedIn: true,
      reason: parsed.reason,
      timestamp: parsed.timestamp,
    };
  } catch (error) {
    console.warn("Unable to parse stored PWA preference", error);
    return null;
  }
};

export const isPwaOptInActive = (record: PwaOptInRecord | null, now = Date.now()): record is PwaOptInRecord => {
  if (!record) {
    return false;
  }

  const age = now - record.timestamp;
  return age >= 0 && age <= PWA_OPT_IN_TTL_MS;
};

export const getStoredPwaOptIn = (storage: Pick<Storage, "getItem" | "removeItem"> | null, now = Date.now()): PwaOptInRecord | null => {
  if (!storage) {
    return null;
  }

  const record = parsePwaOptInRecord(storage.getItem(PWA_OPT_IN_KEY));
  if (!isPwaOptInActive(record, now)) {
    if (record) {
      storage.removeItem(PWA_OPT_IN_KEY);
    }
    return null;
  }

  return record;
};

export const recordPwaOptIn = (detail: PwaOptInDetail) => {
  if (!hasWindow()) {
    return;
  }

  try {
    const payload = serialisePwaOptInRecord(detail);
    window.localStorage.setItem(PWA_OPT_IN_KEY, payload);
  } catch (error) {
    console.warn("Unable to persist PWA opt-in choice", error);
  }

  window.dispatchEvent(
    new CustomEvent(PWA_OPT_IN_EVENT, {
      detail: {
        ...detail,
        timestamp: Date.now(),
      },
    })
  );
};
