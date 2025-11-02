"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import {
  NATIVE_HANDOFF_PARAMS,
  buildNativeUrl,
  getStoreFallback,
  shouldAttemptNativeHandoff,
} from "@/lib/native/links";

const HANDOFF_FALLBACK_DELAY_MS = 1200;

const NativeAppHandoff = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const hasAttemptedRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    if (!pathname) {
      return;
    }
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    if (!shouldAttemptNativeHandoff(params)) {
      return;
    }
    if (hasAttemptedRef.current) {
      return;
    }
    hasAttemptedRef.current = true;

    const nativeUrl = buildNativeUrl(pathname, params);
    const fallbackUrl = getStoreFallback(window.navigator.userAgent ?? null);

    const cleanParams = new URLSearchParams(params);
    for (const key of NATIVE_HANDOFF_PARAMS) {
      cleanParams.delete(key);
    }
    const cleanQuery = cleanParams.toString();
    const cleanHref = `${window.location.pathname}${cleanQuery ? `?${cleanQuery}` : ""}${window.location.hash}`;
    window.history.replaceState(window.history.state, "", cleanHref);

    let fallbackTimer: ReturnType<typeof setTimeout> | undefined;
    try {
      window.location.href = nativeUrl;
      if (fallbackUrl) {
        fallbackTimer = setTimeout(() => {
          window.location.href = fallbackUrl;
        }, HANDOFF_FALLBACK_DELAY_MS);
      }
    } catch (_error) {
      if (fallbackUrl) {
        window.location.href = fallbackUrl;
      }
    }

    return () => {
      if (fallbackTimer) {
        clearTimeout(fallbackTimer);
      }
    };
  }, [pathname, searchParams]);

  return null;
};

export default NativeAppHandoff;
