import { randomBytes, randomUUID } from "crypto";

const DEFAULT_TTL_MS = 1000 * 60 * 5;

export type HandshakeStatus = "pending" | "confirmed" | "completed" | "expired";

export type HandshakeRecord = {
  id: string;
  secret: string;
  createdAt: number;
  expiresAt: number;
  status: HandshakeStatus;
  userId?: string;
  accessToken?: string;
  refreshToken?: string | null;
  completedAt?: number;
};

export type HandshakeSummary = {
  id: string;
  status: HandshakeStatus;
  expiresAt: number;
  userId?: string;
  completedAt?: number;
};

const store = new Map<string, HandshakeRecord>();

const now = () => Date.now();

const generateSecret = () => randomBytes(24).toString("hex");

const ensureRecord = (record: HandshakeRecord | undefined): HandshakeRecord | null => {
  if (!record) return null;
  if (record.status === "expired") return record;
  if (record.expiresAt <= now()) {
    const expired: HandshakeRecord = { ...record, status: "expired" };
    store.set(record.id, expired);
    return expired;
  }
  return record;
};

export const createHandshake = (ttlMs = DEFAULT_TTL_MS) => {
  const id = randomUUID();
  const secret = generateSecret();
  const createdAt = now();
  const expiresAt = createdAt + Math.max(1000, ttlMs);

  const record: HandshakeRecord = {
    id,
    secret,
    createdAt,
    expiresAt,
    status: "pending",
  };

  store.set(id, record);

  return {
    record,
    qrPayload: {
      id,
      secret,
      kind: "qr_login",
      expiresAt,
    },
  } as const;
};

export const readHandshake = (id: string): HandshakeRecord | null => {
  return ensureRecord(store.get(id));
};

export const confirmHandshake = (
  id: string,
  secret: string,
  payload: { userId: string; accessToken: string; refreshToken?: string | null },
): HandshakeRecord | null => {
  const record = ensureRecord(store.get(id));
  if (!record || record.status !== "pending") {
    return record;
  }

  if (record.secret !== secret) {
    return null;
  }

  const updated: HandshakeRecord = {
    ...record,
    status: "confirmed",
    userId: payload.userId,
    accessToken: payload.accessToken,
    refreshToken: payload.refreshToken ?? null,
  };

  store.set(id, updated);
  return updated;
};

export const completeHandshake = (id: string): HandshakeRecord | null => {
  const record = ensureRecord(store.get(id));
  if (!record || (record.status !== "confirmed" && record.status !== "pending")) {
    return record;
  }

  const updated: HandshakeRecord = {
    ...record,
    status: record.status === "pending" ? "expired" : "completed",
    completedAt: record.status === "confirmed" ? now() : record.completedAt,
    accessToken: record.status === "confirmed" ? undefined : record.accessToken,
    refreshToken: record.status === "confirmed" ? undefined : record.refreshToken,
    secret: record.secret,
  };

  store.set(id, updated);
  return updated;
};

export const summarizeHandshake = (record: HandshakeRecord): HandshakeSummary => ({
  id: record.id,
  status: record.status,
  expiresAt: record.expiresAt,
  userId: record.userId,
  completedAt: record.completedAt,
});

export const refreshHandshakeTtl = (id: string, ttlMs = DEFAULT_TTL_MS): HandshakeRecord | null => {
  const record = ensureRecord(store.get(id));
  if (!record || record.status !== "pending") {
    return record;
  }
  const nowMs = now();
  const updated: HandshakeRecord = {
    ...record,
    createdAt: nowMs,
    expiresAt: nowMs + Math.max(1000, ttlMs),
  };
  store.set(id, updated);
  return updated;
};

export const clearHandshakeStore = () => {
  store.clear();
};
