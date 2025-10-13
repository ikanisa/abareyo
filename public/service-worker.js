/* eslint-disable no-undef */
importScripts('/workbox-v6.5.4/workbox-sw.js');

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
