# PR: fix/pwa-manifest-icons

## Scope
- Ensure manifest icons and apple-touch assets align with PWA install requirements.
- Wire PWA opt-in flow to visible FAB/modal.

## Risk
- Medium; regressions could break install prompt if paths mis-specified.

## Test Plan
- `npm run build`
- Manual install test on Android Chrome.

## Rollback
- Revert asset path changes and disable opt-in entrypoint.
