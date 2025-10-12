# PR: perf/code-split-and-images

## Scope
- Convert hero/CTA sections to server components, add dynamic imports for admin dashboards, and optimise Next/Image usage.

## Risk
- Medium; requires ensuring no client-only hooks run on server components.

## Test Plan
- `npm run build`
- Bundle analyzer before/after screenshot.

## Rollback
- Revert dynamic import changes and restore previous component boundaries.
