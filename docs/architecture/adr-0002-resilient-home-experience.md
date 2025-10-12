# ADR 0002: Resilient Home Experience for Offline & Empty States

## Status
Accepted – 2025-10-12

## Context

Phase P3 requires the mobile-first home experience to degrade gracefully when content feeds are empty or the fan temporarily loses connectivity. The existing implementation assumed every home section was populated and rendered client-side only messaging, leaving users with blank cards and no guidance during outages or offseason gaps.

## Decision

- Introduce a reusable `EmptyState` UI component that provides copy, iconography, and optional recovery actions for every content rail on the home screen.
- Add an accessible offline banner in `HomeInteractiveLayer` that listens for `online/offline` events, announces connectivity loss with `aria-live="assertive"`, and clears itself automatically when the connection returns.
- Ship a dedicated `loading.tsx` route skeleton to cover the full home composition while data hydrates, ensuring fans perceive progress within 200ms.
- Document the operational procedures (daily checks, smokes, incident triage) in `docs/runbooks/operations.md` so matchday operators know how to respond when the new fallbacks trigger.

## Consequences

- Additional unit coverage ensures the offline banner remains regression-free and is exercised in CI.
- Editors and operators have clear copy-driven guidance when feeds are intentionally empty between fixtures, reducing emergency content patches.
- The skeleton loader increases perceived performance but adds a small amount of additional markup; no measurable Core Web Vitals impact was observed during local profiling.
