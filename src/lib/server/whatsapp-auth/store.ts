import { randomUUID } from "node:crypto";

const MS_IN_SECOND = 1000;

export type WhatsappAuthRequestRecord = {
  id: string;
  phone: string;
  hash: string;
  attempts: number;
  createdAt: number;
  expiresAt: number;
  resendAvailableAt: number;
  lastSentAt: number;
};

type CreateParams = {
  phone: string;
  hash: string;
  ttlSeconds: number;
  resendDelaySeconds: number;
};

type ResendParams = {
  requestId: string;
  hash: string;
  ttlSeconds: number;
  resendDelaySeconds: number;
};

type LoadResult = {
  record: WhatsappAuthRequestRecord | null;
  expired: boolean;
};

const store = new Map<string, WhatsappAuthRequestRecord>();
const phoneIndex = new Map<string, string>();

const now = () => Date.now();

const cloneRecord = (record: WhatsappAuthRequestRecord): WhatsappAuthRequestRecord => ({
  ...record,
});

const persistRecord = (record: WhatsappAuthRequestRecord) => {
  store.set(record.id, record);
  phoneIndex.set(record.phone, record.id);
};

export const createWhatsappAuthRequest = ({
  phone,
  hash,
  ttlSeconds,
  resendDelaySeconds,
}: CreateParams): WhatsappAuthRequestRecord => {
  const existingId = phoneIndex.get(phone);
  if (existingId) {
    store.delete(existingId);
    phoneIndex.delete(phone);
  }

  const createdAt = now();
  const record: WhatsappAuthRequestRecord = {
    id: randomUUID(),
    phone,
    hash,
    attempts: 0,
    createdAt,
    expiresAt: createdAt + Math.max(1, Math.floor(ttlSeconds)) * MS_IN_SECOND,
    resendAvailableAt: createdAt + Math.max(0, Math.floor(resendDelaySeconds)) * MS_IN_SECOND,
    lastSentAt: createdAt,
  };

  persistRecord(record);
  return cloneRecord(record);
};

export const loadWhatsappAuthRequest = (requestId: string): LoadResult => {
  const record = requestId ? store.get(requestId) ?? null : null;
  if (!record) {
    return { record: null, expired: false };
  }

  if (record.expiresAt <= now()) {
    store.delete(requestId);
    phoneIndex.delete(record.phone);
    return { record: null, expired: true };
  }

  return { record: cloneRecord(record), expired: false };
};

export const applyWhatsappAuthResend = ({
  requestId,
  hash,
  ttlSeconds,
  resendDelaySeconds,
}: ResendParams): WhatsappAuthRequestRecord | null => {
  const entry = store.get(requestId);
  if (!entry) {
    return null;
  }

  const current = loadWhatsappAuthRequest(requestId);
  if (!current.record) {
    return null;
  }

  const timestamp = now();
  const updated: WhatsappAuthRequestRecord = {
    ...current.record,
    hash,
    attempts: 0,
    lastSentAt: timestamp,
    resendAvailableAt: timestamp + Math.max(0, Math.floor(resendDelaySeconds)) * MS_IN_SECOND,
    expiresAt: timestamp + Math.max(1, Math.floor(ttlSeconds)) * MS_IN_SECOND,
  };

  persistRecord(updated);
  return cloneRecord(updated);
};

export const incrementWhatsappAuthAttempts = (requestId: string): number | null => {
  const current = store.get(requestId);
  if (!current) {
    return null;
  }

  const latest = loadWhatsappAuthRequest(requestId);
  if (!latest.record) {
    return null;
  }

  const updated: WhatsappAuthRequestRecord = { ...latest.record, attempts: latest.record.attempts + 1 };
  persistRecord(updated);
  return updated.attempts;
};

export const deleteWhatsappAuthRequest = (requestId: string): void => {
  const record = store.get(requestId);
  if (record) {
    phoneIndex.delete(record.phone);
  }
  store.delete(requestId);
};

export const getWhatsappAuthRequestCountdowns = (
  record: WhatsappAuthRequestRecord,
): { expiresInSeconds: number; resendAfterSeconds: number } => {
  const current = now();
  const expiresInSeconds = Math.max(0, Math.ceil((record.expiresAt - current) / MS_IN_SECOND));
  const resendAfterSeconds = Math.max(0, Math.ceil((record.resendAvailableAt - current) / MS_IN_SECOND));
  return { expiresInSeconds, resendAfterSeconds };
};

export const __internal = {
  dump(): Map<string, WhatsappAuthRequestRecord> {
    return new Map(store);
  },
  upsert(record: WhatsappAuthRequestRecord) {
    store.set(record.id, record);
    phoneIndex.set(record.phone, record.id);
  },
  reset() {
    store.clear();
    phoneIndex.clear();
  },
};
