import {
  buildUssd,
  buildUssdString,
  createUssdCopyEvent,
  createUssdLaunchEvent,
  formatTelUri,
  formatUssdDisplay,
  isIOS,
  sanitizeAmount,
  sanitizePhoneNumber,
  type Provider,
  type BuildUssdOptions,
} from "@rayon/api/payments/ussd";

import { recordAppStateEvent } from "@/lib/observability";

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

const IOS_FALLBACK_DELAY_MS = 700;

const resolveDocument = (documentRef?: Document) =>
  documentRef ?? (typeof document !== "undefined" ? document : undefined);

const resolveWindow = (windowRef?: Window) =>
  windowRef ?? (typeof window !== "undefined" ? window : undefined);

const resolveNavigator = (navigatorRef?: Navigator) =>
  navigatorRef ?? (typeof navigator !== "undefined" ? navigator : undefined);

const openTelUri = (href: string, documentRef?: Document, _windowRef?: Window) => {
  if (!href) {
    return false;
  }

  const doc = resolveDocument(documentRef);
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

  void recordAppStateEvent(
    createUssdLaunchEvent({
      href,
      original: ussd,
      fallbackConfigured: Boolean(options?.onFallback),
    }),
    options?.telemetryEndpoint,
  );
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

export {
  buildUssd,
  buildUssdString,
  createUssdCopyEvent,
  createUssdLaunchEvent,
  formatTelUri,
  formatUssdDisplay,
  isIOS,
  sanitizeAmount,
  sanitizePhoneNumber,
};

export type { BuildUssdOptions, Provider };
