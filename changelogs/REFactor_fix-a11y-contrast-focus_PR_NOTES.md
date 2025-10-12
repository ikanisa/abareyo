# PR: fix/a11y-contrast-focus

## Scope
- Improve focus-visible states, color contrast, and keyboard navigation on top bar, quick tiles, and modals.
- Add automated Axe regression for home view.

## Risk
- Medium; CSS changes may affect branding visuals.

## Test Plan
- `npm run lint`
- `npx axe http://localhost:3000`
- Manual keyboard navigation audit.

## Rollback
- Revert styling changes and disable new Axe check in CI.
