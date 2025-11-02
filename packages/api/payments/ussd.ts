export type Provider = "mtn" | "airtel";

export type BuildUssdOptions = {
  amount: number;
  phone?: string;
  provider?: Provider;
};

const DEFAULT_PHONE_PLACEHOLDER = "07xxxxxxx";

const providerPrefix: Record<Provider, string> = {
  mtn: "*182*1*1*",
  airtel: "*500*1*",
};

const encodeUssdPayload = (payload: string) => payload.replace(/#/g, "%23");
const decodeUssdPayload = (payload: string) => payload.replace(/%23/gi, "#");

export const sanitizeAmount = (amount: number): string => {
  if (!Number.isFinite(amount)) {
    return "0";
  }

  const normalised = Math.max(0, Math.round(amount));
  return String(normalised);
};

export const sanitizePhoneNumber = (phone?: string): string | null => {
  if (!phone) {
    return null;
  }

  const digits = phone.replace(/\D/g, "");
  return digits.length > 0 ? digits : null;
};

export const formatUssdDisplay = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  const withoutScheme = trimmed.startsWith("tel:") ? trimmed.slice(4) : trimmed;
  return decodeUssdPayload(withoutScheme);
};

export const formatTelUri = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  if (trimmed.startsWith("tel:")) {
    const payload = trimmed.slice(4);
    return `tel:${encodeUssdPayload(decodeUssdPayload(payload))}`;
  }

  return `tel:${encodeUssdPayload(trimmed)}`;
};

export const buildUssdString = ({ amount, phone, provider = "mtn" }: BuildUssdOptions): string => {
  const sanitizedAmount = sanitizeAmount(amount);
  const sanitizedPhone = sanitizePhoneNumber(phone) ?? DEFAULT_PHONE_PLACEHOLDER;
  const prefix = providerPrefix[provider] ?? providerPrefix.mtn;

  return `${prefix}${sanitizedPhone}*${sanitizedAmount}#`;
};

export const buildUssd = (options: BuildUssdOptions): string => {
  const raw = buildUssdString(options);
  return formatTelUri(raw);
};

export const isIOS = (navigatorOverride?: Navigator): boolean => {
  const nav = navigatorOverride ?? (typeof navigator !== "undefined" ? navigator : undefined);
  if (!nav) {
    return false;
  }

  const userAgent = nav.userAgent ?? "";
  if (/iPad|iPhone|iPod/i.test(userAgent)) {
    return true;
  }

  const maybeMaxTouchPoints = (nav as Navigator & { maxTouchPoints?: number }).maxTouchPoints;
  return /Macintosh/.test(userAgent) && typeof maybeMaxTouchPoints === "number" && maybeMaxTouchPoints > 1;
};

export type UssdLaunchAnalyticsEvent = {
  type: "ussd-launch";
  href: string;
  original: string;
  fallbackConfigured: boolean;
};

export type UssdCopyAnalyticsEvent = {
  type: "ussd-copy";
  displayCode: string;
  succeeded: boolean;
};

export type UssdAnalyticsEvent = UssdLaunchAnalyticsEvent | UssdCopyAnalyticsEvent;

export const createUssdLaunchEvent = ({
  href,
  original,
  fallbackConfigured,
}: {
  href: string;
  original: string;
  fallbackConfigured: boolean;
}): UssdLaunchAnalyticsEvent => ({
  type: "ussd-launch",
  href,
  original,
  fallbackConfigured,
});

export const createUssdCopyEvent = ({
  displayCode,
  succeeded,
}: {
  displayCode: string;
  succeeded: boolean;
}): UssdCopyAnalyticsEvent => ({
  type: "ussd-copy",
  displayCode,
  succeeded,
});
