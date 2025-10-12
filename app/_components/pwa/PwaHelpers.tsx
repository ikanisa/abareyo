"use client";

import { useEffect, useState } from "react";

import { PWA_OPT_IN_EVENT, PWA_OPT_IN_KEY, recordPwaOptIn } from "@/app/_lib/pwa";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
};

const hasWindow = () => typeof window !== "undefined";

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!hasWindow()) {
      return () => {};
    }

    const onBeforeInstallPrompt = (event: BeforeInstallPromptEvent) => {
      event.preventDefault();
      setDeferredPrompt(event);
      setShow(true);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
  }, []);

  useEffect(() => {
    if (!hasWindow()) {
      return;
    }

    try {
      if (window.localStorage.getItem(PWA_OPT_IN_KEY) === "true") {
        setShow(false);
      }
    } catch (error) {
      console.warn("Unable to read stored PWA preference", error);
    }
  }, []);

  if (!show) {
    return null;
  }

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

  return (
    <div className="card fixed inset-x-0 bottom-4 mx-auto flex w-fit items-center gap-2">
      <span>Install Abareyo?</span>
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
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
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

declare global {
  interface WindowEventMap {
    [PWA_OPT_IN_EVENT]: CustomEvent;
  }
}
