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

const resolveDocument = (documentRef?: Document) =>
  documentRef ?? (typeof document !== "undefined" ? document : undefined);

const resolveWindow = (windowRef?: Window) =>
  windowRef ?? (typeof window !== "undefined" ? window : undefined);

const resolveNavigator = (navigatorRef?: Navigator) =>
  navigatorRef ?? (typeof navigator !== "undefined" ? navigator : undefined);

const openTelUri = (href: string, documentRef?: Document, windowRef?: Window) => {
  if (!href) {
    return false;
  }

  const doc = resolveDocument(documentRef);
  const win = resolveWindow(windowRef);
  if (!doc || !doc.body) {
    return false;
  }

  const anchor = doc.createElement("a");
  anchor.href = href;
  anchor.style.display = "none";
  anchor.rel = "noopener noreferrer";

  doc.body.appendChild(anchor);
  anchor.click();
  doc.body.removeChild(anchor);

  return true;
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

  const documentRef = resolveDocument(options?.documentRef);
  const windowRef = resolveWindow(options?.windowRef);
  const navRef = windowRef?.navigator;

  const href = formatTelUri(ussd);
  const attempted = openTelUri(href, documentRef, windowRef);

  if (options?.onFallback && isIOS(navRef ?? resolveNavigator())) {
    windowRef?.setTimeout(() => {
      options.onFallback?.();
    }, IOS_FALLBACK_DELAY_MS);
    if (!attempted) {
      options.onFallback?.();
    }
  }
};

export const startClipboardFirstUssdHandoff = async (
  ussd: string,
  options?: ClipboardHandoffOptions,
): Promise<ClipboardHandoffResult> => {
  const trimmed = ussd.trim();
  if (!trimmed) {
    throw new Error("Missing USSD code");
  }

  const documentRef = resolveDocument(options?.documentRef);
  const windowRef = resolveWindow(options?.windowRef);
  const navigatorRef = resolveNavigator(options?.navigatorRef);
  const displayCode = formatUssdDisplay(trimmed);
  const ios = isIOS(navigatorRef);

  let copied = false;
  try {
    if (navigatorRef?.clipboard?.writeText) {
      await navigatorRef.clipboard.writeText(displayCode);
      copied = true;
    }
  } catch {
    copied = false;
  }

  const dialerTarget = ios ? "tel:" : formatTelUri(trimmed);
  const dialerAttempted = openTelUri(dialerTarget, documentRef, windowRef);

  if (ios) {
    windowRef?.setTimeout(() => {
      openTelUri("tel:", documentRef, windowRef);
    }, IOS_FALLBACK_DELAY_MS);
    if (!dialerAttempted) {
      openTelUri("tel:", documentRef, windowRef);
    }
  }

  return {
    displayCode,
    copied,
    dialerAttempted,
    fallbackExpected: ios,
  };
};
