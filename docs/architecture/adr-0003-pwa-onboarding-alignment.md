# ADR 0003: PWA & Onboarding Alignment for Resilient Home

## Status
Accepted – 2025-10-21

## Context

Phase P3 focuses on closing the gaps identified during the UX audit: the fan home surface rendered static mocks, lacked reliable offline behaviour, and the onboarding/PWA affordances offered no operational guidance. Fans arriving with limited connectivity routinely saw blank modules and had no retry affordances, while operators had no documented process to verify that cached data stayed fresh.

## Decision

- Persist the aggregated home surface payload to `localStorage` under the `home-surface-cache-v1` key after every successful fetch so the feed and missions can render instantly, even when the device goes offline.
- Extend the `Feed` and `GamificationStrip` components with skeleton loaders, inline offline banners, and retry affordances so cached content is clearly labelled and recoverable without a full page reload.
- Hydrate the cached payload during boot, falling back to server-generated defaults when no cache is present, and expose lightweight telemetry hooks (`trackHomeSurfaceViewed`, `trackHomeInteraction`) unchanged so analytics remain comparable.
- Document the offline validation workflow—including DevTools steps, cache inspection, and retry expectations—in the operations runbook so matchday staff can smoke test the experience before each deployment.

## Consequences

- Local storage now holds structured JSON that must be invalidated if the home surface schema changes; bump the cache key version when fields are removed to avoid runtime parsing errors.
- The `console.warn` diagnostics added for cache hydration/persistence need to remain noise-free; recurring warnings should be triaged in QA before release.
- UX copy for offline banners is now centralised; localisation for RW/EN must include the new strings before launch to avoid fallback to English-only messaging.
