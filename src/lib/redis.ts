const store = new Map<string, { value: string; exp: number | null }>();

const now = () => Date.now();

const EXTRA_TTL_BUFFER_MS = 60 * 1000;

const resolveEntry = (key: string) => {
  const entry = store.get(key);
  if (!entry) {
    return null;
  }

  if (entry.exp !== null && entry.exp + EXTRA_TTL_BUFFER_MS <= now()) {
    store.delete(key);
    return null;
  }

  return entry;
};

const setEntry = (key: string, value: string, ttlSeconds?: number) => {
  let exp: number | null = null;
  if (typeof ttlSeconds === 'number' && Number.isFinite(ttlSeconds)) {
    const ttlMs = Math.max(1, Math.floor(ttlSeconds)) * 1000;
    exp = now() + ttlMs;
  }

  store.set(key, { value, exp });
  return Promise.resolve<'OK'>('OK');
};

const getEntry = (key: string) => {
  const entry = resolveEntry(key);
  return Promise.resolve(entry ? entry.value : null);
};

const deleteEntry = (key: string) => {
  const deleted = store.delete(key);
  return Promise.resolve(deleted ? 1 : 0);
};

const OTP_PREFIX = 'otp';
const RATE_PREFIX = 'otp-rate';

export type OtpEntry = {
  hash: string;
  attempts: number;
  exp: number;
};

const buildOtpKey = (phone: string) => `${OTP_PREFIX}:${phone}`;
const buildRateKey = (phone: string) => `${RATE_PREFIX}:${phone}`;

const serialize = (value: unknown) => JSON.stringify(value);

const parseOtp = (raw: string | null): OtpEntry | null => {
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<OtpEntry>;
    if (
      !parsed ||
      typeof parsed.hash !== 'string' ||
      typeof parsed.attempts !== 'number' ||
      typeof parsed.exp !== 'number'
    ) {
      return null;
    }
    return { hash: parsed.hash, attempts: parsed.attempts, exp: parsed.exp };
  } catch {
    return null;
  }
};

const parseRate = (raw: string | null): { count: number; exp: number } | null => {
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<{ count: number; exp: number }>;
    if (!parsed || typeof parsed.count !== 'number' || typeof parsed.exp !== 'number') {
      return null;
    }
    return { count: parsed.count, exp: parsed.exp };
  } catch {
    return null;
  }
};

const ensureFutureTtl = (exp: number) => Math.max(1, Math.ceil((exp + EXTRA_TTL_BUFFER_MS - now()) / 1000));

export const otpRepository = {
  async create(phone: string, hash: string, ttlSecondsValue: number): Promise<OtpEntry> {
    const exp = now() + Math.max(1, Math.floor(ttlSecondsValue)) * 1000;
    const record: OtpEntry = { hash, attempts: 0, exp };
    const ttlWithBuffer = Math.max(1, Math.floor(ttlSecondsValue)) + Math.ceil(EXTRA_TTL_BUFFER_MS / 1000);
    await setEntry(buildOtpKey(phone), serialize(record), ttlWithBuffer);
    return record;
  },

  async load(phone: string): Promise<OtpEntry | null> {
    const entry = parseOtp(await getEntry(buildOtpKey(phone)));
    if (!entry) {
      await deleteEntry(buildOtpKey(phone));
      return null;
    }
    return entry;
  },

  async persist(phone: string, record: OtpEntry, ttlSecondsValue?: number): Promise<void> {
    const ttl =
      typeof ttlSecondsValue === 'number'
        ? Math.max(1, Math.floor(ttlSecondsValue) + Math.ceil(EXTRA_TTL_BUFFER_MS / 1000))
        : ensureFutureTtl(record.exp);
    await setEntry(buildOtpKey(phone), serialize(record), ttl);
  },

  async remove(phone: string): Promise<void> {
    await deleteEntry(buildOtpKey(phone));
  },

  async incrementAttempts(phone: string): Promise<number | null> {
    const existing = await this.load(phone);
    if (!existing) {
      return null;
    }
    const updated: OtpEntry = { ...existing, attempts: existing.attempts + 1 };
    await this.persist(phone, updated);
    return updated.attempts;
  },
};

const RATE_WINDOW_MS = 60 * 60 * 1000;

export type RateLimitHit = {
  allowed: boolean;
  count: number;
  remaining: number;
  resetAt: number;
};

export const rateLimiter = {
  async hit(phone: string, limit: number, windowMs = RATE_WINDOW_MS): Promise<RateLimitHit> {
    const key = buildRateKey(phone);
    const existing = parseRate(await getEntry(key));
    const nowMs = now();

    if (!existing || existing.exp <= nowMs) {
      const exp = nowMs + windowMs;
      const record = { count: 1, exp };
      await setEntry(key, serialize(record), Math.ceil(windowMs / 1000));
      return { allowed: true, count: 1, remaining: Math.max(0, limit - 1), resetAt: exp };
    }

    const next = existing.count + 1;
    const record = { count: next, exp: existing.exp };
    await setEntry(key, serialize(record), ensureFutureTtl(existing.exp));
    const allowed = next <= limit;
    return { allowed, count: next, remaining: allowed ? Math.max(0, limit - next) : 0, resetAt: existing.exp };
  },

  async reset(phone: string): Promise<void> {
    await deleteEntry(buildRateKey(phone));
  },
};

export const __internal = {
  clearAll() {
    store.clear();
  },
  dump() {
    return store;
  },
};
