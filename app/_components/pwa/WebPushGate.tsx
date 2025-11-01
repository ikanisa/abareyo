"use client";

import { useEffect } from "react";

import { ensureWebPushRegistered, postWebPushKeyToWorker } from "@/app/_lib/push";
import { PWA_OPT_IN_EVENT } from "@/app/_lib/pwa";
import { clientEnv } from "@/config/env";

const WebPushGate = () => {
  const publicKey = clientEnv.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY;

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    if (!publicKey) {
      return;
    }
    if (!('serviceWorker' in navigator)) {
      return;
    }

    void postWebPushKeyToWorker(publicKey);

    const handleOptIn = () => {
      void postWebPushKeyToWorker(publicKey);
      void ensureWebPushRegistered();
    };

    if (Notification.permission === 'granted') {
      void ensureWebPushRegistered();
    }

    let permissionStatus: PermissionStatus | null = null;
    if (navigator.permissions?.query) {
      navigator.permissions
        .query({ name: 'notifications' as PermissionName })
        .then((status) => {
          permissionStatus = status;
          status.onchange = () => {
            if (status.state === 'granted') {
              void ensureWebPushRegistered();
            }
          };
        })
        .catch(() => {
          // Permissions API not available; ignore.
        });
    }

    window.addEventListener(PWA_OPT_IN_EVENT, handleOptIn);

    return () => {
      window.removeEventListener(PWA_OPT_IN_EVENT, handleOptIn);
      if (permissionStatus) {
        permissionStatus.onchange = null;
      }
    };
  }, [publicKey]);

  return null;
};

export default WebPushGate;
