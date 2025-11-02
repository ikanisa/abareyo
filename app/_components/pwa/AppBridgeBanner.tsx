"use client";

import { useEffect, useRef, useState } from "react";

const DISMISS_KEY = "gikundiro:app-bridge-dismissed";
const HANDOFF_FALLBACK_DELAY_MS = 1200;

const hasWindow = () => typeof window !== "undefined";

const isStandaloneDisplay = () => {
  if (!hasWindow()) {
    return false;
  }
  const mediaQuery = window.matchMedia?.("(display-mode: standalone)");
  const navigatorWithStandalone = window.navigator as Navigator & { standalone?: boolean };
  return Boolean(mediaQuery?.matches || navigatorWithStandalone?.standalone);
};

type AppBridgeBannerProps = {
  target: string | null;
  fallback: string | null;
};

const AppBridgeBanner = ({ target, fallback }: AppBridgeBannerProps) => {
  const [visible, setVisible] = useState(false);
  const hasAttemptedLaunchRef = useRef(false);

  useEffect(() => {
    if (!hasWindow() || !target) {
      return;
    }

    let dismissed = false;
    try {
      dismissed = window.sessionStorage.getItem(DISMISS_KEY) === "1";
    } catch (error) {
      console.warn("Unable to read stored app bridge preference", error);
    }

    if (dismissed) {
      return;
    }

    const ua = window.navigator.userAgent.toLowerCase();
    const isMobile = /iphone|ipad|ipod|android/.test(ua);

    if (!isMobile || isStandaloneDisplay()) {
      return;
    }

    setVisible(true);
  }, [target]);

  useEffect(() => {
    if (!hasWindow()) {
      return;
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        hasAttemptedLaunchRef.current = false;
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const dismissBanner = () => {
    try {
      window.sessionStorage.setItem(DISMISS_KEY, "1");
    } catch (error) {
      console.warn("Unable to persist app bridge dismissal", error);
    }
    setVisible(false);
  };

  const openNativeApp = () => {
    if (!hasWindow() || !target) {
      return;
    }

    dismissBanner();

    if (hasAttemptedLaunchRef.current) {
      return;
    }
    hasAttemptedLaunchRef.current = true;

    const fallbackUrl = fallback ?? undefined;
    try {
      window.location.href = target;
      if (fallbackUrl) {
        window.setTimeout(() => {
          if (document.visibilityState === "visible") {
            window.location.href = fallbackUrl;
          }
        }, HANDOFF_FALLBACK_DELAY_MS);
      }
    } catch (error) {
      if (fallbackUrl) {
        window.location.href = fallbackUrl;
      }
    }
  };

  if (!visible || !target) {
    return null;
  }

  return (
    <div className="fixed inset-x-4 top-4 z-[70] mx-auto max-w-xl rounded-3xl border border-white/15 bg-slate-900/90 p-4 text-white shadow-xl backdrop-blur">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/60">Open in app</p>
          <p className="text-lg font-semibold">Continue in the GIKUNDIRO app</p>
          <p className="text-sm text-white/70">
            Jump back to the native experience for faster payments, richer match insights, and wallet sync.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button type="button" className="btn" onClick={dismissBanner}>
            Not now
          </button>
          <button type="button" className="btn-primary" onClick={openNativeApp}>
            Open app
          </button>
        </div>
      </div>
    </div>
  );
};

export default AppBridgeBanner;
