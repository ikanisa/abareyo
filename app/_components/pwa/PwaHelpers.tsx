"use client";

import { useEffect, useState } from "react";

import { PWA_OPT_IN_EVENT, PWA_OPT_IN_KEY, recordPwaOptIn } from "@/app/_lib/pwa";

// Types for the beforeinstallprompt event
// See: https://developer.mozilla.org/en-US/docs/Web/API/BeforeInstallPromptEvent
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
};

const hasWindow = () => typeof window !== "undefined";

export function InstallPrompt() {
  const [showIosPrompt, setShowIosPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!hasWindow()) return;

    // Detect iOS Safari (no beforeinstallprompt event) and show a custom message
    const ua = window.navigator.userAgent.toLowerCase();
    const isiOS = /iphone|ipad|ipod/.test(ua);
    const navigatorWithStandalone = window.navigator as Navigator & {
      standalone?: boolean;
    };
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

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    };
  }, []);

  useEffect(() => {
    if (!hasWindow()) return;
    try {
      if (window.localStorage.getItem(PWA_OPT_IN_KEY) === 'true') {
        setShow(false);
      }
    } catch (error) {
      console.warn('Unable to read stored PWA preference', error);
    }
  }, []);

  // Render iOS guidance if necessary
  if (showIosPrompt) {
    return (
      <div className="card break-words whitespace-normal fixed inset-x-0 bottom-24 mx-auto flex w-fit items-center gap-2">
        <span>Install GIKUNDIRO App to your Home Screen</span>
        <p className="text-xs text-white/70">
          Tap the Share icon and select “Add to Home Screen”.
        </p>
        <button className="btn" onClick={() => setShowIosPrompt(false)}>
          Close
        </button>
      </div>
    );
  }

  if (!show) {
    return null;
  }

  const handleInstall = async () => {
    recordPwaOptIn({ reason: 'install' });
    try {
      await deferredPrompt?.prompt();
    } catch (error) {
      console.warn('PWA installation prompt failed', error);
    } finally {
      setShow(false);
    }
  };

  return (
    <div className="card break-words whitespace-normal fixed inset-x-0 bottom-24 mx-auto flex w-fit items-center gap-2">
      <span>Install GIKUNDIRO App?</span>
      <button className="btn-primary" onClick={handleInstall}>
        Install
      </button>
      <button
        className="btn"
        onClick={() => {
          setShow(false);
        }}
      >
        Later
      </button>
    </div>
  );
}

export function OfflineBanner() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    if (!hasWindow()) {
      return () => {};
    }

    const handleOnline = () => setOffline(false);
    const handleOffline = () => setOffline(true);

    setOffline(!navigator.onLine);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!offline) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 top-14 bg-yellow-500/20 p-2 text-center text-yellow-100">
      You’re offline. We’ll sync when you’re back.
    </div>
  );
}
