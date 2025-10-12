# PR: feat/mobile-home-complete

## Scope
- Deliver full mobile home composition: stories, ticker, upcoming, wallet mini, community, sponsors.
- Add analytics hooks and skeleton loaders for each section.

## Risk
- High; touches primary landing route and multiple data fetches.

## Test Plan
- `npm run build`
- `npm run test:unit`
- `npx playwright test --project=mobile-small`

## Rollback
- Revert feature commit and restore previous static home modules.
