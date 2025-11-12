# Visual Regression Testing for Admin Components

This directory contains visual regression tests for admin UI components using Playwright.

## Overview

Visual regression tests capture screenshots of Storybook stories at multiple breakpoints (1280px, 1440px, 1920px) and compare them against baseline images. This helps catch unintended visual changes in admin components.

## Running Tests

### Prerequisites

1. **Install dependencies:**
   ```bash
   npm ci
   ```

2. **Install Playwright browsers:**
   ```bash
   npx playwright install --with-deps
   ```

3. **Start Storybook:**
   ```bash
   npm run storybook
   # Storybook runs on http://localhost:6006
   ```

### Run Visual Tests

**In a separate terminal (while Storybook is running):**

```bash
# Run visual regression tests
npm run test:visual

# Update baseline screenshots (after reviewing changes)
npm run test:visual:update
```

### CI Integration

Visual regression tests run automatically in the CI pipeline (`.github/workflows/ci.yml`):

1. Storybook is built (`npm run build-storybook`)
2. Visual tests run against the static build
3. If differences detected, diffs are uploaded as CI artifacts

## Test Structure

```
tests/visual-regression/
├── admin-components.spec.ts   # Main visual regression test
├── baselines/                 # Baseline screenshots (gitignored)
│   └── admin-components.spec.ts/
│       ├── admin-primitives-button--playground-1280px.png
│       ├── admin-primitives-card--success-1440px.png
│       └── ...
└── diffs/                     # Visual diffs on failure (gitignored)
    └── ...
```

## Adding New Component Tests

To add a new component to visual regression testing:

1. **Create Storybook story** in `src/components/admin/ui/__stories__/YourComponent.stories.tsx`

2. **Add to test list** in `admin-components.spec.ts`:
   ```typescript
   const ADMIN_STORIES = [
     // ...existing stories
     { title: 'Admin/Primitives/YourComponent', id: 'admin-primitives-yourcomponent--default' },
   ];
   ```

3. **Generate baseline:**
   ```bash
   npm run test:visual:update
   ```

4. **Review baselines** in `tests/visual-regression/baselines/` and commit if acceptable

## Updating Baselines

When you make intentional visual changes:

1. **Run tests** to see what changed:
   ```bash
   npm run test:visual
   ```

2. **Review diffs** in Playwright report:
   ```bash
   npx playwright show-report
   ```

3. **If changes are correct**, update baselines:
   ```bash
   npm run test:visual:update
   ```

4. **Commit updated baselines** with your PR

## Troubleshooting

### Tests fail with "Storybook not running"

**Solution:** Start Storybook first:
```bash
npm run storybook
```

### Baselines look different on CI vs local

**Cause:** Font rendering differences between OS/browsers

**Solution:** 
- Use `maxDiffPixels` threshold (already configured)
- Generate baselines in Linux container matching CI:
  ```bash
  docker run -it --rm -v $(pwd):/app -w /app mcr.microsoft.com/playwright:v1.50.1 bash
  npm ci
  npm run build-storybook
  npx http-server storybook-static -p 6006 &
  npm run test:visual:update
  ```

### Flaky tests due to animations

**Solution:** Tests already disable animations with `animations: 'disabled'` in screenshot options. If still flaky, increase wait time in the test.

## Best Practices

1. **Test interactive states** separately (hover, focus, disabled)
2. **Use semantic story IDs** that match component hierarchy
3. **Keep viewport set small** (3 breakpoints max) to reduce test time
4. **Review diffs carefully** before updating baselines
5. **Document visual changes** in PR description with screenshots

## Related Documentation

- [Admin Design System](../../docs/admin-design-system.md)
- [Storybook Setup](../../.storybook/main.ts)
- [Playwright Config](../../playwright.config.ts)
- [CI Workflow](../../.github/workflows/ci.yml)

## Questions?

Contact @platform-team or @design-team for visual regression testing questions.
