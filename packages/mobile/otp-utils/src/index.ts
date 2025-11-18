export const OTP_LENGTH = 6;
export const RESEND_INTERVAL_SECONDS = 30;

export const sanitisePhoneNumber = (value: string) =>
  value
    .replace(/[^0-9+]/g, '')
    .replace(/\+{2,}/g, '+')
    .replace(/(\+)(?=\+)/g, '');

export const normalisePhoneNumber = (value: string) => {
  const trimmed = sanitisePhoneNumber(value).trim();
  if (!trimmed.startsWith('+')) {
    return `+${trimmed}`;
  }
  return trimmed;
};

export const normaliseOtp = (value: string) => value.replace(/\D/g, '').slice(0, OTP_LENGTH);

export const isValidOtp = (value: string) => normaliseOtp(value).length === OTP_LENGTH;

export type CountdownHandle = {
  stop: () => void;
};

export const createCountdown = (
  durationSeconds: number,
  onTick: (remainingSeconds: number) => void,
): CountdownHandle => {
  let remaining = durationSeconds;
  onTick(remaining);

  const interval = setInterval(() => {
    remaining -= 1;
    if (remaining <= 0) {
      clearInterval(interval);
      onTick(0);
      return;
    }
    onTick(remaining);
  }, 1000);

  return {
    stop: () => clearInterval(interval),
  };
};

export class ResendController {
  private nextAllowedAt = 0;

  constructor(private readonly windowSeconds: number) {}

  canSend(now: number = Date.now()) {
    return now >= this.nextAllowedAt;
  }

  registerSend(now: number = Date.now()) {
    this.nextAllowedAt = now + this.windowSeconds * 1000;
  }

  secondsUntilNext(now: number = Date.now()) {
    if (this.canSend(now)) {
      return 0;
    }
    return Math.ceil((this.nextAllowedAt - now) / 1000);
  }
}
