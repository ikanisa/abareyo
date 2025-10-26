# PWA Opt-In Behaviour

Our mobile-first experience defers service worker registration until fans explicitly opt in. This
keeps Lighthouse/PWA prompts aligned with user intent and avoids surprising install banners on
first load.

Key points:

- The onboarding flow or FAB records an opt-in via `recordPwaOptIn`, which stores a signed payload
  in `localStorage` (`PWA_OPT_IN_KEY`) and emits the `PWA_OPT_IN_EVENT` custom event.
- `app/providers.tsx` listens for that event and only calls `navigator.serviceWorker.register()` when
  an active opt-in exists. Users who previously opted in are re-registered on mount after storage
  validation (data expires after 180 days).
- Notification permission prompts are also gated on the opt-in state. If no opt-in exists, we skip
  permission requests entirely.

For local testing you can trigger the opt-in flow via the onboarding modal or dispatch the event:

```js
window.dispatchEvent(
  new CustomEvent('pwa-opt-in', { detail: { reason: 'install', timestamp: Date.now() } }),
);
```

This pattern ensures we stay compliant with browser install UX while still enabling offline caching
once fans explicitly choose to install the app.
