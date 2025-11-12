# Contributing to Rayon Sports Platform

Thank you for your interest in contributing to the Rayon Sports Platform! This guide will help you get started.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Admin Component Guidelines](#admin-component-guidelines)
- [Pull Request Process](#pull-request-process)
- [Testing Requirements](#testing-requirements)
- [Code Style](#code-style)

## Code of Conduct

We are committed to providing a welcoming and inclusive environment. Please be respectful and professional in all interactions.

## Getting Started

### Prerequisites

- Node.js 20.x (see `.nvmrc`)
- npm 11.4.2 or compatible
- Git

### Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/ikanisa/abareyo.git
   cd abareyo
   ```

2. **Install dependencies:**
   ```bash
   npm ci
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Run tests:**
   ```bash
   npm test
   ```

## Development Workflow

1. **Create a branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** following the guidelines below

3. **Test your changes:**
   ```bash
   npm run lint
   npm run type-check
   npm test
   npm run build
   ```

4. **Commit your changes:**
   ```bash
   git add .
   git commit -m "feat: your descriptive commit message"
   ```

5. **Push and create a PR:**
   ```bash
   git push origin feature/your-feature-name
   ```

### Commit Message Format

Follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

## Admin Component Guidelines

**When working on admin components (`app/admin/**` or `src/components/admin/**`), follow these additional requirements:**

### Design System Compliance

1. **Use design tokens** from `src/components/admin/ui/theme.ts`:
   - Colors: Use semantic tokens (`text.primary`, `surfaces.base`, etc.)
   - Spacing: Use CSS variables (`var(--space-4)`, `var(--space-6)`)
   - Border radius: Use `adminTheme.radii` tokens
   - Motion: Use `adminTheme.motion` for animations

2. **Follow responsive guidelines:**
   - Test at 1280px, 1440px, and 1920px breakpoints
   - Use responsive containers with max-width clamps
   - Implement mobile-first responsive patterns
   - See [`docs/design-system/responsive-guidelines.md`](docs/design-system/responsive-guidelines.md)

3. **Create Storybook stories:**
   ```bash
   # Create story file at:
   # src/components/admin/ui/__stories__/YourComponent.stories.tsx
   ```
   
   Example story structure:
   ```typescript
   import type { Meta, StoryObj } from '@storybook/react';
   import { YourComponent } from '../YourComponent';

   const meta: Meta<typeof YourComponent> = {
     title: 'Admin/Primitives/YourComponent',
     component: YourComponent,
     tags: ['autodocs'],
   };

   export default meta;
   type Story = StoryObj<typeof YourComponent>;

   export const Default: Story = {
     args: {
       // component props
     },
   };
   ```

4. **Document the component:**
   - Add JSDoc comments to props
   - Update [`docs/admin-design-system.md`](docs/admin-design-system.md)
   - Add to [`docs/design-system/admin-component-audit.md`](docs/design-system/admin-component-audit.md)

### Accessibility Requirements

**All admin components MUST meet WCAG 2.1 Level AA standards:**

1. **Keyboard navigation:**
   - All interactive elements reachable via Tab
   - Focus indicators visible (2px ring, sky-400/60)
   - Modal focus traps with Escape to close
   - Dropdown menus navigable with arrow keys

2. **Screen reader support:**
   - Use semantic HTML (`<button>`, `<nav>`, `<main>`, etc.)
   - Add ARIA attributes where needed:
     ```tsx
     <button aria-label="Close dialog">
       <X className="h-4 w-4" />
     </button>
     ```
   - Use `aria-live` for dynamic updates
   - Add `aria-describedby` for error messages

3. **Contrast ratios:**
   - Normal text: ≥ 4.5:1
   - Large text (≥18pt): ≥ 3:1
   - UI components: ≥ 3:1
   - Validate with Axe DevTools

4. **Testing checklist:**
   ```bash
   # Run accessibility linter
   npm run lint:a11y

   # Test keyboard navigation (no mouse)
   # Test with screen reader (NVDA/VoiceOver)
   # Validate with Axe DevTools browser extension
   ```

### Visual Regression Testing

1. **Create or update tests:**
   ```typescript
   // Add to tests/visual-regression/admin-components.spec.ts
   const ADMIN_STORIES = [
     { title: 'Admin/Primitives/YourComponent', id: 'admin-primitives-yourcomponent--default' },
   ];
   ```

2. **Generate baselines:**
   ```bash
   npm run storybook  # In one terminal
   npm run test:visual:update  # In another terminal
   ```

3. **Review screenshots** before committing baselines

4. **On visual changes:**
   - Run `npm run test:visual` to see diffs
   - Review in Playwright report: `npx playwright show-report`
   - Update baselines if intentional: `npm run test:visual:update`
   - Include screenshots in PR description

## Pull Request Process

### Before Submitting

1. **Run all checks locally:**
   ```bash
   npm run lint
   npm run type-check
   npm test
   npm run build
   ```

2. **For admin components, also run:**
   ```bash
   npm run lint:a11y
   npm run storybook  # Verify stories work
   npm run test:visual  # Check for visual regressions
   ```

3. **Update documentation:**
   - README if changing setup/build process
   - `docs/admin-design-system.md` if changing admin components
   - JSDoc comments for new/modified functions

### PR Template

Fill out the PR template completely:
- Summary of changes
- Checklist items
- **For admin components:** Complete the "Admin Component Changes" section
- Attach screenshots for visual changes
- Link related issues/docs

### Review Requirements

PRs touching admin components (`app/admin/**` or `src/components/admin/**`) require:

1. ✅ **Design team approval** (for visual changes)
2. ✅ **Accessibility champion approval** (for interactive changes)
3. ✅ **Platform team approval** (code quality)
4. ✅ **All CI checks pass** (lint, test, build, visual regression, a11y)

Reviewers are auto-assigned based on CODEOWNERS.

### Merge Criteria

Your PR will be merged when:
- ✅ All CI checks pass
- ✅ Required approvals received
- ✅ No unresolved review comments
- ✅ Visual regression baselines updated (if applicable)
- ✅ Documentation updated

**Merge blockers:**
- ❌ Visual regression failures (unless baselines updated with approval)
- ❌ Accessibility violations (Axe errors)
- ❌ Lint or type errors
- ❌ Missing required approvals

## Testing Requirements

### Unit Tests

- Use Vitest for unit tests
- Place tests in `tests/unit/` mirroring source structure
- Test business logic, utilities, and hooks
- Aim for >80% coverage on new code

```bash
npm run test:unit
npm run coverage
```

### E2E Tests

- Use Playwright for end-to-end tests
- Place tests in `tests/e2e/`
- Test critical user flows
- Use API mocks where appropriate (`E2E_API_MOCKS=1`)

```bash
npm run test:e2e
npm run test:e2e:a11y
```

### Visual Tests

- Test admin components at multiple breakpoints
- Place tests in `tests/visual-regression/`
- Update baselines when making intentional visual changes

```bash
npm run test:visual
npm run test:visual:update
```

## Code Style

### TypeScript

- Use strict TypeScript (no `any`)
- Define explicit types for props and return values
- Use `interface` for public APIs, `type` for unions/intersections

### React

- Functional components with hooks
- Use `React.forwardRef` for components that need refs
- Extract complex logic to custom hooks
- Use `"use client"` directive for client components (Next.js App Router)

### CSS & Styling

- Use Tailwind utility classes
- Use design tokens via `var(--token-name)`
- Avoid inline styles except for dynamic values
- Use `cn()` utility for conditional classes

### File Organization

```
src/
├── components/
│   ├── admin/           # Admin-specific components
│   │   ├── ui/          # Reusable UI primitives
│   │   │   ├── AdminButton.tsx
│   │   │   └── __stories__/
│   │   ├── dashboard/   # Feature-specific components
│   │   └── layout/      # Layout primitives
│   └── ...
├── lib/                 # Utilities and helpers
└── ...
```

### Naming Conventions

- Components: `PascalCase.tsx`
- Utilities: `camelCase.ts`
- Constants: `UPPER_SNAKE_CASE`
- CSS classes: `kebab-case` (Tailwind)
- Test files: `*.spec.ts` or `*.test.ts`

## Getting Help

- 📖 **Documentation:** [`docs/admin-design-system.md`](docs/admin-design-system.md)
- 💬 **Slack:** #admin-design-system, #platform-team
- 🐛 **Issues:** Open an issue with `[Question]` prefix
- 👥 **Code Review:** Tag `@platform-team` or `@design-team`

## Resources

- [Admin Design System Documentation](docs/admin-design-system.md)
- [Repository README](README.md)
- [Storybook (local)](http://localhost:6006)
- [W3C ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [Playwright Documentation](https://playwright.dev/)

---

**Thank you for contributing!** 🎉
