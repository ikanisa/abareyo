# PR: chore/hosting-config-node20

## Scope
- Align managed hosting configuration with Node 20.x, ensure build command `next build`, and remove legacy export workflows.

## Risk
- Low; config-only updates.

## Test Plan
- `npm run build`
- Verify container or self-hosted preview uses Node 20.x in logs.

## Rollback
- Restore previous hosting settings if deployment fails.
