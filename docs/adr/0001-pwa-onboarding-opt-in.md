# ADR 0001 — PWA Onboarding Opt‑In and Push Permissions

Status: Accepted
Date: 2025-10-26

## Context

Browsers increasingly require explicit, user‑initiated gestures for installing
PWAs and granting push/notification permissions. Auto‑registering a service
worker on first load can trigger install prompts prematurely and lead to poor
UX metrics (bounce, prompt dismissals) and confused users.

## Decision

- Defer service worker registration until an explicit user opt‑in is recorded.
- Gate notification permission requests behind the same opt‑in.
- Persist opt‑in with a signed payload in `localStorage` and revalidate it on
  mount (expiry 180 days). See `app/_lib/pwa.ts`.
- `app/providers.tsx` listens for `PWA_OPT_IN_EVENT` and calls
  `navigator.serviceWorker.register('/service-worker.js')` only after opt‑in.
- On native (Capacitor) builds we continue to initialize app state telemetry
  listeners regardless of PWA status.

## Consequences

- Lighthouse/PWA scores align with user intent; install banners only surface
  after opt‑in.
- Push permissions are not requested at page load, reducing consent fatigue.
- QA can manually trigger opt‑in in dev tools:

```
window.dispatchEvent(new CustomEvent('pwa-opt-in', { detail: { reason: 'install', timestamp: Date.now() } }))
```

## Alternatives Considered

- Auto‑register SW on first load: rejected for UX and compliance concerns.
- Server‑side persisted preference: may follow later; current approach keeps it
  client‑only until a backend opt‑in API is required.

## References

- Docs: `docs/mobile/pwa-opt-in.md`
- Code: `app/providers.tsx`, `app/_lib/pwa.ts`

