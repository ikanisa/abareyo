# PR Notes – REFactor_polish-and-docs

## Scope
- Add resilient UI states for the home experience (skeleton loader, offline banner, empty state copy) without regressing optional onboarding.
- Ship supporting documentation (operations runbook, ADR) so operators understand new behaviours and daily checks.

## Risk
- Low: additive UI states and documentation only; minimal shared dependencies.

## Test Plan
- `npm run type-check`
- `npm run lint`
- `npm run test:unit`
- `CI=1 npm run build`

## Rollback
- Revert commit and redeploy; home page will return to previous behaviour without skeletons/offline banner.
