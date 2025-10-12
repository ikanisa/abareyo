# PR: chore/vercel-config-node20

## Scope
- Align Vercel project settings with Node 20.x, ensure build command `next build`, and remove legacy export workflows.

## Risk
- Low; config-only updates.

## Test Plan
- `npm run build`
- Verify Vercel deployment preview uses Node 20.x in logs.

## Rollback
- Restore previous Vercel settings if deployment fails.
