"use client";

import { clientEnv } from "@/config/env";

const base64UrlToUint8Array = (input: string): Uint8Array => {
  const padding = '='.repeat((4 - (input.length % 4)) % 4);
  const base64 = (input + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

const isBrowserSupported = () =>
  typeof window !== "undefined" &&
  'Notification' in window &&
  'serviceWorker' in navigator &&
  'PushManager' in window;

export const postWebPushKeyToWorker = async (publicKey: string) => {
  if (!isBrowserSupported()) {
    return;
  }
  try {
    const registration = await navigator.serviceWorker.ready;
    registration.active?.postMessage({ type: 'web-push:set-public-key', key: publicKey });
  } catch (error) {
    console.warn('Unable to post web push key to service worker', error);
  }
};

const syncSubscription = async (subscription: PushSubscription) => {
  try {
    await fetch('/api/notifications/subscription', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ platform: 'web', subscription }),
    });
  } catch (error) {
    console.warn('Failed to persist web push subscription', error);
  }
};

export const subscribeToPush = async () => {
  if (!isBrowserSupported()) {
    return { ok: false as const, reason: 'unsupported' as const };
  }

  const publicKey = clientEnv.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY;
  if (!publicKey) {
    return { ok: false as const, reason: 'missing-key' as const };
  }

  if (Notification.permission !== 'granted') {
    return { ok: false as const, reason: 'permission' as const };
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    registration.active?.postMessage({ type: 'web-push:set-public-key', key: publicKey });

    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: base64UrlToUint8Array(publicKey),
      });
    }

    await syncSubscription(subscription);
    return { ok: true as const, subscription };
  } catch (error) {
    console.warn('Web push subscription failed', error);
    return { ok: false as const, reason: 'error' as const };
  }
};

export const ensureWebPushRegistered = async () => {
  if (!isBrowserSupported()) {
    return;
  }
  if (Notification.permission !== 'granted') {
    return;
  }
  await subscribeToPush();
};
