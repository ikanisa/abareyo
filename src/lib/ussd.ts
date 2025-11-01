import { recordAppStateEvent } from "@/lib/observability";

export type Provider = "mtn" | "airtel";

export type BuildUssdOptions = {
  amount: number;
  phone?: string;
  provider?: Provider;
};

export type UssdDialerOptions = {
  onFallback?: () => void;
  documentRef?: Document;
  windowRef?: Window;
  telemetryEndpoint?: string;
};

const DEFAULT_PHONE_PLACEHOLDER = "07xxxxxxx";
const IOS_FALLBACK_DELAY_MS = 700;

export const sanitizeAmount = (amount: number): string => {
  if (!Number.isFinite(amount)) {
    return "0";
  }

  const normalized = Math.max(0, Math.round(amount));
  return String(normalized);
};

export const sanitizePhoneNumber = (phone?: string): string | null => {
  if (!phone) {
    return null;
  }

  const digits = phone.replace(/\D/g, "");
  return digits.length > 0 ? digits : null;
};

const encodeUssdPayload = (payload: string) => payload.replace(/#/g, "%23");
const decodeUssdPayload = (payload: string) => payload.replace(/%23/gi, "#");

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

export const buildUssd = ({ amount, phone }: BuildUssdOptions): string => {
  const sanitizedAmount = sanitizeAmount(amount);
  const sanitizedPhone = sanitizePhoneNumber(phone) ?? DEFAULT_PHONE_PLACEHOLDER;
  const code = `*182*1*1*${sanitizedPhone}*${sanitizedAmount}#`;
  return formatTelUri(code);
};

export const isIOS = (
  navigatorOverride?: Navigator,
): boolean => {
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

export const launchUssdDialer = (ussd: string, options?: UssdDialerOptions) => {
  if (!ussd) {
    return;
  }

  const documentRef = options?.documentRef ?? (typeof document !== "undefined" ? document : undefined);
  const windowRef = options?.windowRef ?? (typeof window !== "undefined" ? window : undefined);

  if (!documentRef || !windowRef || !documentRef.body) {
    return;
  }

  const href = formatTelUri(ussd);
  const anchor = documentRef.createElement("a");
  anchor.href = href;
  anchor.style.display = "none";
  anchor.rel = "noopener noreferrer";

  documentRef.body.appendChild(anchor);
  anchor.click();
  documentRef.body.removeChild(anchor);

  if (options?.onFallback && isIOS(windowRef.navigator)) {
    windowRef.setTimeout(() => {
      options.onFallback?.();
    }, IOS_FALLBACK_DELAY_MS);
  }

  void recordAppStateEvent(
    {
      type: "ussd-launch",
      href,
      original: ussd,
      fallbackConfigured: Boolean(options?.onFallback),
    },
    options?.telemetryEndpoint,
  );
};
