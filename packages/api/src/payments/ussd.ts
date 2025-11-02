/**
 * USSD Payment Utilities
 * Shared utilities for building USSD payment codes (MTN MoMo, Airtel Money)
 * and handling cross-platform dialing (web + mobile).
 */

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

export type ClipboardHandoffOptions = {
  documentRef?: Document;
  windowRef?: Window;
  navigatorRef?: Navigator;
};

export type ClipboardHandoffResult = {
  displayCode: string;
  copied: boolean;
  dialerAttempted: boolean;
  fallbackExpected: boolean;
};

const DEFAULT_PHONE_PLACEHOLDER = "07xxxxxxx";
const IOS_FALLBACK_DELAY_MS = 700;

/**
 * Sanitize and format amount for USSD payload
 */
export const sanitizeAmount = (amount: number): string => {
  if (!Number.isFinite(amount)) {
    return "0";
  }

  const normalized = Math.max(0, Math.round(amount));
  return String(normalized);
};

/**
 * Sanitize phone number to digits only
 */
export const sanitizePhoneNumber = (phone?: string): string | null => {
  if (!phone) {
    return null;
  }

  const digits = phone.replace(/\D/g, "");
  return digits.length > 0 ? digits : null;
};

/**
 * Encode USSD payload for tel: URI
 */
const encodeUssdPayload = (payload: string) => payload.replace(/#/g, "%23");

/**
 * Decode USSD payload from tel: URI
 */
const decodeUssdPayload = (payload: string) => payload.replace(/%23/gi, "#");

/**
 * Format USSD code for display (human-readable)
 */
export const formatUssdDisplay = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  const withoutScheme = trimmed.startsWith("tel:") ? trimmed.slice(4) : trimmed;
  return decodeUssdPayload(withoutScheme);
};

/**
 * Format USSD code as tel: URI
 */
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

/**
 * Provider-specific USSD prefixes
 */
const providerPrefix: Record<Provider, string> = {
  mtn: "*182*1*1*",
  airtel: "*500*1*",
};

/**
 * Build USSD payment code for a given provider
 */
export const buildUssd = ({
  amount,
  phone,
  provider = "mtn",
}: BuildUssdOptions): string => {
  const sanitizedAmount = sanitizeAmount(amount);
  const sanitizedPhone = sanitizePhoneNumber(phone) ?? DEFAULT_PHONE_PLACEHOLDER;
  const prefix = providerPrefix[provider] ?? providerPrefix.mtn;
  const code = `${prefix}${sanitizedPhone}*${sanitizedAmount}#`;
  return formatTelUri(code);
};

/**
 * Detect iOS device (including iPad with desktop UA)
 */
export const isIOS = (navigatorOverride?: Navigator): boolean => {
  const nav =
    navigatorOverride ?? (typeof navigator !== "undefined" ? navigator : undefined);
  if (!nav) {
    return false;
  }

  const userAgent = nav.userAgent ?? "";
  if (/iPad|iPhone|iPod/i.test(userAgent)) {
    return true;
  }

  const maybeMaxTouchPoints = (nav as Navigator & { maxTouchPoints?: number })
    .maxTouchPoints;
  return (
    /Macintosh/.test(userAgent) &&
    typeof maybeMaxTouchPoints === "number" &&
    maybeMaxTouchPoints > 1
  );
};

/**
 * Format provider name for display
 */
export const formatProviderName = (provider: Provider): string => {
  const names: Record<Provider, string> = {
    mtn: "MTN MoMo",
    airtel: "Airtel Money",
  };
  return names[provider] ?? provider.toUpperCase();
};

/**
 * Get provider-specific shortcode for display
 */
export const getProviderShortcode = (provider: Provider): string => {
  const shortcodes: Record<Provider, string> = {
    mtn: "*182*1*1*078xxxxxxx*",
    airtel: "*500*1*073xxxxxxx*",
  };
  return shortcodes[provider] ?? "";
};
