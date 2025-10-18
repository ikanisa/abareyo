const REDACT_KEYS = ['email', 'phone', 'msisdn', 'token', 'password', 'otp'];

type LogPayload = Record<string, unknown> | undefined;

const scrub = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map((entry) => scrub(entry));
  }
  if (value && typeof value === 'object') {
    const output: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      if (REDACT_KEYS.includes(key.toLowerCase())) {
        output[key] = '[REDACTED]';
        continue;
      }
      output[key] = scrub(val);
    }
    return output;
  }
  if (typeof value === 'string' && value.length > 128) {
    return `${value.slice(0, 125)}…`;
  }
  return value;
};

export const adminLogger = {
  info(event: string, payload?: LogPayload) {
    console.info('[admin-api]', event, payload ? scrub(payload) : undefined);
  },
  warn(event: string, payload?: LogPayload) {
    console.warn('[admin-api]', event, payload ? scrub(payload) : undefined);
  },
  error(event: string, payload?: LogPayload) {
    console.error('[admin-api]', event, payload ? scrub(payload) : undefined);
  },
};
