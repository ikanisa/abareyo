import { serverEnv } from '@/config/env';

const DEFAULT_TTL_SECONDS = 300;
const DEFAULT_RESEND_DELAY_SECONDS = 45;
const MIN_TTL_SECONDS = 30;

const parsePositiveInt = (value: string | number | undefined, fallback: number): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value > 0 ? value : fallback;
  }
  if (typeof value === 'string') {
    const parsed = Number.parseInt(value, 10);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return fallback;
};

export const resolveOtpTtlSeconds = (): number =>
  Math.max(MIN_TTL_SECONDS, parsePositiveInt(serverEnv.OTP_TTL_SEC, DEFAULT_TTL_SECONDS));

export const resolveResendDelaySeconds = (): number =>
  parsePositiveInt(process.env.WHATSAPP_RESEND_COOLDOWN_SEC, DEFAULT_RESEND_DELAY_SECONDS);

export const getWhatsappJwtSecret = (): string | null =>
  typeof serverEnv.JWT_SECRET === 'string' && serverEnv.JWT_SECRET.length > 0
    ? serverEnv.JWT_SECRET
    : null;
