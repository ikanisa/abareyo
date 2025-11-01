/* eslint-disable no-undef */
importScripts('/workbox-v6.5.4/workbox-sw.js');

const WEB_PUSH_SUBSCRIPTION_ENDPOINT = '/api/notifications/subscription';
let webPushPublicKey = null;

const base64UrlToUint8Array = (input) => {
  const padding = '='.repeat((4 - (input.length % 4)) % 4);
  const base64 = (input + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

const persistSubscription = async (subscription) => {
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

if (self.workbox) {
  workbox.setConfig({ modulePathPrefix: '/workbox-v6.5.4' });
  workbox.core.setCacheNameDetails({ prefix: 'rayon' });
  workbox.precaching.cleanupOutdatedCaches();

  workbox.routing.registerRoute(
    ({ url }) => url.pathname.startsWith('/api/tickets/passes'),
    new workbox.strategies.NetworkFirst({
      cacheName: 'rayon-active-passes',
      networkTimeoutSeconds: 3,
      plugins: [
        new workbox.expiration.ExpirationPlugin({ maxEntries: 20, maxAgeSeconds: 60 * 30 }),
      ],
    }),
    'GET',
  );

  const communityCacheConfig = {
    cacheName: 'rayon-community-data',
    plugins: [
      new workbox.expiration.ExpirationPlugin({ maxEntries: 30, maxAgeSeconds: 5 * 60 }),
    ],
  };

  workbox.routing.registerRoute(
    ({ url }) => url.pathname.startsWith('/api/community/leaderboard'),
    new workbox.strategies.StaleWhileRevalidate(communityCacheConfig),
    'GET',
  );

  workbox.routing.registerRoute(
    ({ url }) => url.pathname.startsWith('/api/community/missions'),
    new workbox.strategies.StaleWhileRevalidate(communityCacheConfig),
    'GET',
  );

  workbox.routing.registerRoute(
    ({ url }) => url.pathname.startsWith('/api/community/polls'),
    new workbox.strategies.StaleWhileRevalidate({
      cacheName: 'rayon-community-polls',
      plugins: [
        new workbox.expiration.ExpirationPlugin({ maxEntries: 20, maxAgeSeconds: 5 * 60 }),
      ],
    }),
    'GET',
  );

  workbox.routing.registerRoute(
    ({ request }) => request.destination === 'document',
    new workbox.strategies.NetworkFirst({ cacheName: 'rayon-pages' }),
  );

  workbox.routing.registerRoute(
    ({ url }) => url.pathname.startsWith('/tickets') || url.pathname.startsWith('/mytickets'),
    new workbox.strategies.NetworkFirst({
      cacheName: 'rayon-ticketing-pages',
      plugins: [
        new workbox.expiration.ExpirationPlugin({ maxEntries: 8, maxAgeSeconds: 60 * 60 }),
      ],
    }),
  );

  workbox.routing.registerRoute(
    ({ request }) => request.destination === 'image' && request.url.includes('/tickets/'),
    new workbox.strategies.CacheFirst({
      cacheName: 'rayon-ticketing-media',
      plugins: [
        new workbox.expiration.ExpirationPlugin({ maxEntries: 24, maxAgeSeconds: 60 * 60 * 24 * 7 }),
      ],
    }),
  );
} else {
  console.warn('Workbox failed to load.');
}

self.addEventListener('message', (event) => {
  if (event.data?.type === 'web-push:set-public-key') {
    webPushPublicKey = event.data.key;
  }
});

self.addEventListener('push', (event) => {
  if (!event.data) {
    return;
  }
  let payload = {};
  try {
    payload = event.data.json();
  } catch (error) {
    payload = { title: 'GIKUNDIRO', body: event.data.text() };
  }

  const title = payload.title || 'GIKUNDIRO';
  const options = {
    body: payload.body,
    data: payload.data || {},
    icon: payload.icon || '/icon-192x192.png',
    badge: payload.badge || '/icon-192x192.png',
    actions: payload.actions || [],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';
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
      }),
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
