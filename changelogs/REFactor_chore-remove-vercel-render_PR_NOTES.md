# PR Notes – REFactor_chore-remove-vercel-render

## Scope
- Snapshot the previous deployment state on `main` using the `pre-vercel-render-cleanup` tag.
- Bootstrap the `chore/remove-vercel-render` branch from that tag so Vercel/Render cleanup stays isolated.

## Risk
- None. This is metadata-only version-control scaffolding.

## Test Plan
- Not applicable.

## Rollback
- Checkout the `pre-vercel-render-cleanup` tag to restore the pre-cleanup baseline.
- Force-push `main` (or any follow-up branch) from that tag if the cleanup must be reverted.
