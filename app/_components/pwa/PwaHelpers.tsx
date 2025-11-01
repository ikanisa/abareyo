"use client";

import { useEffect, useId, useRef, useState } from "react";

import { getStoredPwaOptIn, recordPwaOptIn } from "@/app/_lib/pwa";

// Types for the beforeinstallprompt event
// See: https://developer.mozilla.org/en-US/docs/Web/API/BeforeInstallPromptEvent
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
};

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

const hasWindow = () => typeof window !== "undefined";

export function InstallPrompt() {
  const [showIosPrompt, setShowIosPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);
  const installButtonRef = useRef<HTMLButtonElement | null>(null);
  const closeIosButtonRef = useRef<HTMLButtonElement | null>(null);
  const dialogTitleId = useId();
  const dialogDescriptionId = useId();

  useEffect(() => {
    if (!hasWindow()) return;

    // Detect iOS Safari (no beforeinstallprompt event) and show a custom message
    const ua = window.navigator.userAgent.toLowerCase();
    const isiOS = /iphone|ipad|ipod/.test(ua);
    const navigatorWithStandalone = window.navigator as Navigator & { standalone?: boolean };
    const inStandalone =
      "standalone" in navigatorWithStandalone && Boolean(navigatorWithStandalone.standalone);
    if (isiOS && !inStandalone) {
      setShowIosPrompt(true);
    }

    const onBeforeInstallPrompt = (event: BeforeInstallPromptEvent) => {
      event.preventDefault();
      setDeferredPrompt(event);
      setShow(true);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    };
  }, []);

  useEffect(() => {
    if (!hasWindow()) return;
    try {
      if (getStoredPwaOptIn(window.localStorage)) {
        setShow(false);
      }
    } catch (error) {
      console.warn("Unable to read stored PWA preference", error);
    }
  }, []);

  useEffect(() => {
    if (show) {
      installButtonRef.current?.focus();
    }
  }, [show]);

  useEffect(() => {
    if (showIosPrompt) {
      closeIosButtonRef.current?.focus();
    }
  }, [showIosPrompt]);

  const handleInstall = async () => {
    recordPwaOptIn({ reason: "install" });
    try {
      await deferredPrompt?.prompt();
    } catch (error) {
      console.warn("PWA installation prompt failed", error);
    } finally {
      setShow(false);
    }
  };

  // Render iOS guidance if necessary
  if (showIosPrompt) {
    return (
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={dialogTitleId}
        aria-describedby={dialogDescriptionId}
        className="card break-words whitespace-normal fixed inset-x-0 bottom-24 mx-auto flex w-fit max-w-lg flex-col gap-2 p-4"
      >
        <h2 id={dialogTitleId} className="text-base font-semibold">
          Install GIKUNDIRO on iOS
        </h2>
        <p id={dialogDescriptionId} className="text-sm text-white/80">
          Tap the Share icon and choose “Add to Home Screen” to keep matchday access one tap away.
        </p>
        <div className="flex items-center justify-end gap-2">
          <button
            ref={closeIosButtonRef}
            type="button"
            className="btn"
            onClick={() => setShowIosPrompt(false)}
          >
            Dismiss message
          </button>
        </div>
      </div>
    );
  }

  if (!show) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={dialogTitleId}
      aria-describedby={dialogDescriptionId}
      className="card break-words whitespace-normal fixed inset-x-0 bottom-24 mx-auto flex w-fit max-w-lg flex-col gap-3 p-4"
    >
      <h2 id={dialogTitleId} className="text-base font-semibold">
        Install GIKUNDIRO App?
      </h2>
      <p id={dialogDescriptionId} className="text-sm text-white/80">
        Save fixtures, tickets, and wallet access offline with the home screen app experience.
      </p>
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <button ref={installButtonRef} type="button" className="btn-primary" onClick={handleInstall}>
          Install
        </button>
        <button type="button" className="btn" onClick={() => setShow(false)}>
          Not now
        </button>
      </div>
    </div>
  );
}

export function OfflineBanner() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    if (!hasWindow()) return () => {};

    const handleOnline = () => setOffline(false);
    const handleOffline = () => setOffline(true);

    setOffline(!navigator.onLine);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!offline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 top-16 z-[60] bg-amber-300 px-4 py-3 text-center text-sm font-semibold text-slate-900 shadow-lg dark:bg-amber-200"
    >
      You’re offline. We’ll sync when you’re back.
    </div>
  );
}
