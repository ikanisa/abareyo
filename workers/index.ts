/// <reference lib="webworker" />

import { clientsClaim, cacheNames } from 'workbox-core';
import { cleanupOutdatedCaches, precacheAndRoute, type PrecacheEntry } from 'workbox-precaching';
import { registerRoute, setCatchHandler } from 'workbox-routing';
import { NetworkFirst, StaleWhileRevalidate, CacheFirst } from 'workbox-strategies';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { ExpirationPlugin } from 'workbox-expiration';

declare let self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<PrecacheEntry>;
};

type LifecyclePhase =
  | 'installing'
  | 'installed'
  | 'activating'
  | 'activated'
  | 'offline-fallback-served';

type OfflineRoute = {
  prefix: string;
  fallback: string;
};

const SERVICE_WORKER_SOURCE = 'gikundiro-service-worker';
const WEB_PUSH_SUBSCRIPTION_ENDPOINT = '/api/notifications/subscription';
const OFFLINE_FALLBACK_URL = '/offline.html';
const OFFLINE_FALLBACK_REVISION = '20250118';
const OFFLINE_ROUTES: OfflineRoute[] = [
  { prefix: '/wallet', fallback: '/wallet/offline' },
  { prefix: '/news', fallback: '/news/offline' },
];

let webPushPublicKey: string | null = null;

const base64UrlToUint8Array = (input: string): Uint8Array => {
  const padding = '='.repeat((4 - (input.length % 4)) % 4);
  const base64 = (input + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

const broadcastLifecycleEvent = async (phase: LifecyclePhase, detail?: unknown) => {
  const payload = {
    source: SERVICE_WORKER_SOURCE,
    type: 'sw:lifecycle',
    phase,
    detail: detail ?? null,
  } as const;

  const clientList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  for (const client of clientList) {
    client.postMessage(payload);
  }
};

const persistSubscription = async (subscription: PushSubscription) => {
  try {
    await fetch(WEB_PUSH_SUBSCRIPTION_ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ platform: 'web', subscription }),
    });
  } catch (error) {
    console.warn('Failed to sync push subscription', error);
  }
};

const allPrecacheEntries: Array<PrecacheEntry> = [
  ...(self.__WB_MANIFEST ?? []),
  { url: OFFLINE_FALLBACK_URL, revision: OFFLINE_FALLBACK_REVISION },
  ...OFFLINE_ROUTES.map((route) => ({ url: route.fallback, revision: OFFLINE_FALLBACK_REVISION })),
];

cleanupOutdatedCaches();
precacheAndRoute(allPrecacheEntries, {
  ignoreURLParametersMatching: [/^utm_/, /^fbclid$/],
});

clientsClaim();

const htmlStrategy = new NetworkFirst({
  cacheName: 'gikundiro-pages',
  plugins: [
    new CacheableResponsePlugin({ statuses: [0, 200] }),
    new ExpirationPlugin({ maxEntries: 48, maxAgeSeconds: 60 * 30 }),
  ],
});

registerRoute(({ request }) => request.mode === 'navigate', htmlStrategy);

registerRoute(
  ({ url, request }) =>
    url.origin === self.location.origin &&
    url.pathname.startsWith('/api/') &&
    request.method === 'GET',
  new StaleWhileRevalidate({
    cacheName: 'gikundiro-api',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 60, maxAgeSeconds: 60 * 5 }),
    ],
  }),
  'GET',
);

registerRoute(
  ({ request, url }) =>
    ['image', 'video', 'audio'].includes(request.destination) && url.origin === self.location.origin,
  new CacheFirst({
    cacheName: 'gikundiro-media',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 64, maxAgeSeconds: 60 * 60 * 24 * 14 }),
    ],
  }),
);

const resolveOfflineFallback = (url: URL) => {
  for (const route of OFFLINE_ROUTES) {
    if (url.pathname.startsWith(route.prefix)) {
      return route.fallback;
    }
  }
  return OFFLINE_FALLBACK_URL;
};

setCatchHandler(async ({ request }) => {
  if (request.destination === 'document') {
    const url = new URL(request.url);
    const fallback = resolveOfflineFallback(url);
    const cache = await caches.open(cacheNames.precache);
    const cached = await cache.match(fallback);
    if (cached) {
      await broadcastLifecycleEvent('offline-fallback-served', { requested: url.pathname, served: fallback });
      return cached;
    }
  }

  return Response.error();
});

self.addEventListener('message', (event) => {
  const data = event.data as { type?: string; key?: string } | undefined;
  if (!data) {
    return;
  }

  if (data.type === 'skip-waiting') {
    void broadcastLifecycleEvent('installing');
    self.skipWaiting();
    return;
  }

  if (data.type === 'web-push:set-public-key' && typeof data.key === 'string') {
    webPushPublicKey = data.key;
  }
});

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      await broadcastLifecycleEvent('installing');
      await self.skipWaiting();
      await broadcastLifecycleEvent('installed');
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      await broadcastLifecycleEvent('activating');
      clientsClaim();
      await broadcastLifecycleEvent('activated');
    })(),
  );
});

self.addEventListener('push', (event) => {
  if (!event.data) {
    return;
  }

  type NotificationActionInit = { action: string; title: string; icon?: string };
  type PushPayload = {
    title?: string;
    body?: string;
    icon?: string;
    badge?: string;
    actions?: NotificationActionInit[];
    data?: unknown;
  };

  let payload: PushPayload = {};
  try {
    payload = event.data.json();
  } catch (_error) {
    payload = { title: 'GIKUNDIRO', body: event.data.text() };
  }

  const title = payload.title || 'GIKUNDIRO';
  const options: NotificationOptions & { actions?: NotificationActionInit[] } = {
    body: payload.body,
    data: payload.data || {},
    icon: payload.icon || '/icon-192x192.png',
    badge: payload.badge || '/icon-192x192.png',
  };

  if (Array.isArray(payload.actions) && payload.actions.length > 0) {
    options.actions = payload.actions;
  }

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const notificationData = event.notification.data as { url?: string } | undefined;
  const targetUrl = notificationData?.url || '/';
  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientsArr) => {
        const matchingClient = clientsArr.find((client) => client.url.includes(targetUrl));
        if (matchingClient && 'focus' in matchingClient) {
          return matchingClient.focus();
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
        return undefined;
      })
      .catch(() => self.clients.openWindow?.(targetUrl)),
  );
});

self.addEventListener('pushsubscriptionchange', (event) => {
  if (!webPushPublicKey) {
    return;
  }

  event.waitUntil(
    (async () => {
      try {
        const subscription = await self.registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: base64UrlToUint8Array(webPushPublicKey),
        });
        await persistSubscription(subscription);
      } catch (error) {
        console.warn('Unable to renew push subscription', error);
      }
    })(),
  );
});
