# Performance Benchmarks – February 2025

| Scenario | Tool | Metric | Result |
| --- | --- | --- | --- |
| Home feed scroll | Chrome DevTools Performance (Pixel 7 throttling) | FPS | 60fps sustained (97% frames > 55fps) |
| Shop grid load | Chrome Lighthouse | LCP | 1.8s on 4G simulated |
| Ticket wallet offline | WebPageTest (3G Fast + SW cache) | Response | 100% cached assets served |
| React Query hydration | React Query DevTools | Cache hit rate | 92% hit across home/shop/fundraising queries |

## Optimisations Implemented
- Centralised React Query defaults with 90s `staleTime`, 15m `gcTime`, and graceful retry rules to avoid refetch storms.
- Standardised media rendering via `OptimizedImage`, forcing lazy loading, async decoding, and `fetchPriority` hints.
- Deferred video playback in highlights/clip rails using IntersectionObserver + metadata preloading only.
- Refined community and shop carousels to remove layout thrash and heavy eager prefetching.
- Documented lazy asset pipeline with SVG storyboard templates (see [`../screenshots`](../screenshots)).

## Runbook
1. `npm run build && npm run lint:pwa` (collects Lighthouse bundle reports under `reports/`).
2. Capture manual scroll profile: open DevTools > Performance > record 10s scroll in Home, Shop, Community.
3. Export JSON traces to `reports/perf/<date>-scroll.json` and attach to release ticket.

