# Admin Design System

Comprehensive design system documentation for Rayon admin components, consolidating layout, typography, component patterns, and accessibility standards.

**Last updated:** 2025-11-12  
**Maintained by:** Platform Team  
**Review required:** For any PR touching `app/admin/**` or `src/components/admin/**`

---

## Table of Contents

- [Design Tokens](#design-tokens)
- [Layout System](#layout-system)
- [Typography](#typography)
- [Component Library](#component-library)
- [Accessibility Standards](#accessibility-standards)
- [Visual Regression Testing](#visual-regression-testing)
- [Review Checkpoints](#review-checkpoints)

---

## Design Tokens

### Theme Configuration

Admin components use a centralized theme system defined in [`src/components/admin/ui/theme.ts`](../src/components/admin/ui/theme.ts).

#### Border Radii
```typescript
radii: {
  sm: "rounded-xl",      // 0.75rem - Small controls, badges
  md: "rounded-2xl",     // 1rem - Cards, panels
  lg: "rounded-[1.75rem]", // 1.75rem - Modals, major surfaces
  pill: "rounded-full"   // Full - Pills, status indicators
}
```

#### Surface Styles
```typescript
surfaces: {
  base: "border border-white/10 bg-slate-950/60 backdrop-blur",   // Primary cards
  muted: "border border-white/5 bg-slate-950/40 backdrop-blur",    // Secondary containers
  inset: "border border-white/5 bg-slate-950/30"                   // Input backgrounds
}
```

#### Color Semantic Tokens
```typescript
text: {
  primary: "text-slate-100",      // Headings, primary content
  secondary: "text-slate-400",    // Body text, descriptions
  muted: "text-slate-500",        // Tertiary text, metadata
  subtle: "text-slate-500/80",    // Disabled or inactive states
  accent: "text-sky-300",         // Interactive elements
  positive: "text-emerald-400",   // Success states
  negative: "text-rose-400",      // Error states  
  caution: "text-amber-300"       // Warning states
}
```

### Spacing Scale

Spacing tokens are defined in CSS custom properties via `src/styles/tokens.css`:

```css
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 3rem;     /* 48px */
--space-12: 3.5rem;   /* 56px */
--space-14: 4rem;     /* 64px */
```

**Usage:** `gap-[var(--space-4)]`, `padding: var(--space-6)`

### Motion & Interaction

```typescript
motion: {
  duration: {
    fast: "150ms",
    base: "200ms", 
    slow: "300ms"
  },
  easing: {
    default: "cubic-bezier(0.4, 0, 0.2, 1)",
    in: "cubic-bezier(0.4, 0, 1, 1)",
    out: "cubic-bezier(0, 0, 0.2, 1)"
  }
},
states: {
  interactive: "transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/60"
}
```

---

## Layout System

### Responsive Breakpoints

Following Tailwind defaults with admin-specific container clamps:

| Breakpoint | Viewport | Usage Pattern |
|------------|----------|---------------|
| `sm` | 640px | Stack filters vertically, expand inputs to 100% |
| `md` | 768px | Multi-column forms: `md:grid-cols-2` |
| `lg` | 1024px | Promote sidebars, use `lg:px-10` padding |
| `xl` | 1280px | Clamp content: `max-w-[min(90rem,calc(100vw-3rem))]` |
| `2xl` | 1536px | Expand to `max-w-[min(100rem,calc(100vw-6rem))]` |

**Reference:** [`docs/design-system/responsive-guidelines.md`](design-system/responsive-guidelines.md)

### Layout Primitives

#### AdminPageShell
**Location:** `src/components/admin/layout/AdminPageShell.tsx`

Establishes the core admin layout with gradient backgrounds, sidebar, and header slots.

```tsx
<AdminPageShell 
  sidebar={<Sidebar />} 
  header={<Header />}
  contentWidth="xl"  // lg | xl | 2xl | full
>
  {children}
</AdminPageShell>
```

**Features:**
- CSS Grid layout with fixed sidebar (`--admin-sidebar-width: 18rem`)
- Gradient background with radial glow overlay
- Responsive padding and backdrop blur
- Normalized header height (`--admin-header-height: 4rem`)

#### AdminSection
**Location:** `src/components/admin/layout/AdminSection.tsx`

Wraps page sections with consistent spacing and max-widths.

```tsx
<AdminSection
  variant="plain"  // plain | surface | soft
  padded={true}
  maxWidth="2xl"
  bleed={false}
>
  <h1>Section content</h1>
</AdminSection>
```

**Variants:**
- `plain`: No additional styling (for grid containers)
- `surface`: Elevated panel with border and backdrop blur
- `soft`: Low-contrast grouping without elevation

### Content Width Guidelines

- **Dashboard cards:** Use `2xl` (88rem) for wide metrics grids
- **Forms:** Use `xl` (72rem) for optimal line length
- **Tables:** Use `full` with horizontal scroll guards
- **Detail views:** Use `lg` (60rem) for focused reading

**Reference:** [`docs/design-system/admin-layout.mdx`](design-system/admin-layout.mdx)

---

## Typography

### Font Stack

```css
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, 
             "Helvetica Neue", Arial, sans-serif;
```

### Type Scale

| Element | Class | Size | Weight | Usage |
|---------|-------|------|--------|-------|
| H1 | `text-2xl font-semibold` | 1.5rem | 600 | Page titles |
| H2 | `text-xl font-semibold` | 1.25rem | 600 | Section headers |
| H3 | `text-lg font-semibold` | 1.125rem | 600 | Card headers |
| Body | `text-sm` | 0.875rem | 400 | Body text, descriptions |
| Caption | `text-xs` | 0.75rem | 400 | Metadata, timestamps |
| Label | `text-sm font-medium` | 0.875rem | 500 | Form labels |

### Line Height

- **Headings:** `leading-tight` (1.25)
- **Body text:** `leading-relaxed` (1.625)
- **Compact UI:** `leading-normal` (1.5)

### Letter Spacing

- **Uppercase labels:** `tracking-wide` (0.025em) or `tracking-[0.3em]` for group headers
- **Normal text:** Default tracking
- **Tight headings:** `tracking-tight` (-0.025em)

---

## Component Library

All admin components live in `src/components/admin/`. UI primitives are in `src/components/admin/ui/`.

### Core Primitives

#### AdminButton
**Location:** [`src/components/admin/ui/AdminButton.tsx`](../src/components/admin/ui/AdminButton.tsx)  
**Story:** [`src/components/admin/ui/__stories__/AdminButton.stories.tsx`](../src/components/admin/ui/__stories__/AdminButton.stories.tsx)

```tsx
<AdminButton 
  variant="primary"    // primary | secondary | subtle | ghost | destructive | outline
  size="md"           // sm | md | lg | pill
  fullWidth={false}
  isLoading={false}
  startIcon={<Icon />}
  endIcon={<Icon />}
>
  Button Text
</AdminButton>
```

**Variants:**
- `primary`: High-emphasis actions (save, submit, publish)
- `secondary`: Medium-emphasis (cancel, filter)
- `subtle`: Low-emphasis (view details)
- `ghost`: Minimal (inline actions)
- `destructive`: Delete, remove, irreversible actions
- `outline`: Transparent with border (secondary CTAs)

**Accessibility:**
- Focus ring with 2px sky-400/60
- Disabled state with 60% opacity
- Loading state with spinner and `aria-busy`

#### AdminCard
**Location:** [`src/components/admin/ui/AdminCard.tsx`](../src/components/admin/ui/AdminCard.tsx)  
**Story:** [`src/components/admin/ui/__stories__/AdminCard.stories.tsx`](../src/components/admin/ui/__stories__/AdminCard.stories.tsx)

```tsx
<AdminCard
  tone="base"         // base | muted | success | warning | danger | info
  padding="md"        // none | sm | md | lg
  interactive={false}
  elevated={false}
>
  Card content
</AdminCard>
```

**Tone Usage:**
- `base`: Default cards with glass effect
- `muted`: Secondary containers, less prominent
- `success`: Success confirmations, completed states
- `warning`: Attention required, pending actions
- `danger`: Error states, critical alerts
- `info`: Informational callouts

**Accessibility:**
- WCAG 2.1 AA contrast on all tone variants (4.5:1 minimum)
- Glass surface opacities: light 0.82, dark 0.68 (updated for contrast)
- Focus ring when `interactive={true}`

#### AdminStatCard
**Location:** [`src/components/admin/ui/AdminStatCard.tsx`](../src/components/admin/ui/AdminStatCard.tsx)  
**Story:** [`src/components/admin/ui/__stories__/AdminStatCard.stories.tsx`](../src/components/admin/ui/__stories__/AdminStatCard.stories.tsx)

KPI card for dashboard metrics.

```tsx
<AdminStatCard
  label="Total Revenue"
  value="$24,580"
  change="+12.5%"
  trend="up"          // up | down | neutral
  icon={<DollarSign />}
/>
```

#### AdminInlineMessage
**Location:** [`src/components/admin/ui/AdminInlineMessage.tsx`](../src/components/admin/ui/AdminInlineMessage.tsx)  
**Story:** [`src/components/admin/ui/__stories__/AdminInlineMessage.stories.tsx`](../src/components/admin/ui/__stories__/AdminInlineMessage.stories.tsx)

Contextual inline notifications and status banners.

```tsx
<AdminInlineMessage
  variant="info"      // info | success | warning | error
  title="System notice"
  dismissible={true}
  action={{ label: "View details", onClick: () => {} }}
>
  Message content
</AdminInlineMessage>
```

#### AdminToast
**Location:** [`src/components/admin/ui/AdminToast.tsx`](../src/components/admin/ui/AdminToast.tsx)  
**Story:** [`src/components/admin/ui/__stories__/AdminToast.stories.tsx`](../src/components/admin/ui/__stories__/AdminToast.stories.tsx)

Toast notifications for async feedback.

```tsx
import { toast } from 'sonner';

toast.success('Order updated successfully');
toast.error('Failed to save changes');
toast.info('Sync in progress...');
```

#### AdminInput
**Location:** [`src/components/admin/ui/AdminInput.tsx`](../src/components/admin/ui/AdminInput.tsx)  
**Story:** [`src/components/admin/ui/__stories__/AdminInput.stories.tsx`](../src/components/admin/ui/__stories__/AdminInput.stories.tsx)

Form input with admin theming.

#### AdminFilterBar
**Location:** [`src/components/admin/ui/AdminFilterBar.tsx`](../src/components/admin/ui/AdminFilterBar.tsx)  
**Story:** [`src/components/admin/ui/__stories__/AdminFilterBar.stories.tsx`](../src/components/admin/ui/__stories__/AdminFilterBar.stories.tsx)

Collapsible filter panel for tables and lists.

#### AdminActionToolbar
**Location:** [`src/components/admin/ui/AdminActionToolbar.tsx`](../src/components/admin/ui/AdminActionToolbar.tsx)  
**Story:** [`src/components/admin/ui/__stories__/AdminActionToolbar.stories.tsx`](../src/components/admin/ui/__stories__/AdminActionToolbar.stories.tsx)

Sticky action bar for batch operations.

### Complex Components

#### Data Tables
**Reference:** [`docs/design-system/admin-component-audit.md`](design-system/admin-component-audit.md#tables)

Core table components:
- `DataTable` - [`src/components/admin/DataTable.tsx`](../src/components/admin/DataTable.tsx)
- `MembersTable` - [`src/components/admin/membership/MembersTable.tsx`](../src/components/admin/membership/MembersTable.tsx)
- `TicketOrdersTable` - [`src/components/admin/orders/TicketOrdersTable.tsx`](../src/components/admin/orders/TicketOrdersTable.tsx)
- `ShopOrdersTable` - [`src/components/admin/orders/ShopOrdersTable.tsx`](../src/components/admin/orders/ShopOrdersTable.tsx)

**Best Practices:**
- Wrap in `overflow-x-auto` container
- Set `min-w-[680px]` or component-specific minimum
- Use `break-words` on TableCell for text overflow
- Implement keyboard navigation (arrow keys, Home/End)
- Expose bulk action checkboxes with `aria-label`

#### Dashboards
**Reference:** [`docs/design-system/admin-component-audit.md`](design-system/admin-component-audit.md#cards--dashboards)

Dashboard components:
- `AdminDashboardClient` - [`src/components/admin/dashboard/AdminDashboardClient.tsx`](../src/components/admin/dashboard/AdminDashboardClient.tsx)
- `AdminReportsDashboard` - [`src/components/admin/reports/AdminReportsDashboard.tsx`](../src/components/admin/reports/AdminReportsDashboard.tsx)
- `AdminServicesDashboard` - [`src/components/admin/services/AdminServicesDashboard.tsx`](../src/components/admin/services/AdminServicesDashboard.tsx)

**Layout Pattern:**
```tsx
<div className="grid gap-[var(--space-6)] md:grid-cols-2 xl:grid-cols-3">
  <AdminStatCard {...} />
  <AdminStatCard {...} />
  <AdminStatCard {...} />
</div>
```

#### Forms & Actions
**Reference:** [`docs/design-system/admin-component-audit.md`](design-system/admin-component-audit.md#forms--action-surfaces)

Key form components:
- `MembershipActions` - [`src/components/admin/membership/MembershipActions.tsx`](../src/components/admin/membership/MembershipActions.tsx)
- `AdminEditDrawer` - [`src/components/admin/ui/AdminEditDrawer.tsx`](../src/components/admin/ui/AdminEditDrawer.tsx)
- `AdminBottomSheet` - [`src/components/admin/ui/AdminBottomSheet.tsx`](../src/components/admin/ui/AdminBottomSheet.tsx)
- `AdminConfirmDialog` - [`src/components/admin/ui/AdminConfirmDialog.tsx`](../src/components/admin/ui/AdminConfirmDialog.tsx)

**Form Validation:**
- Use `react-hook-form` with `zod` for validation
- Show errors inline with `text-rose-400` styling
- Disable submit button during validation
- Preserve form state on navigation with confirmation dialog

---

## Accessibility Standards

### WCAG 2.1 Level AA Compliance

All admin components must meet WCAG 2.1 AA standards.

#### Contrast Requirements

**Minimum contrast ratios:**
- Normal text (< 18pt): **4.5:1**
- Large text (≥ 18pt or ≥ 14pt bold): **3:1**
- UI components & graphical objects: **3:1**

**Glass Surface Validation:**
- Light theme `--glass-bg`: opacity 0.82 (ensures 4.5:1)
- Dark theme `--glass-bg`: opacity 0.68 (ensures 4.5:1)
- Validated with Axe DevTools and Chrome DevTools contrast checker

**Testing:**
```bash
npm run lint:a11y  # ESLint jsx-a11y rules, max-warnings=0
```

#### Keyboard Navigation

**Required patterns:**
- All interactive elements reachable via `Tab`
- Focus indicators visible (2px ring, sky-400/60)
- Modal traps focus with `Esc` to close
- Tables support arrow key navigation
- Dropdown menus: `↓`/`↑` to navigate, `Enter` to select, `Esc` to close

**Focus Management:**
```tsx
// Return focus after modal close
const triggerRef = useRef<HTMLButtonElement>(null);
onClose={() => triggerRef.current?.focus()}
```

#### Screen Reader Support

**ARIA patterns:**
```tsx
// Live regions for dynamic updates
<div aria-live="polite" aria-atomic="true">
  {statusMessage}
</div>

// Labels for icon-only buttons
<button aria-label="Close dialog">
  <X className="h-4 w-4" />
</button>

// Required fields
<input aria-required="true" required />

// Error messages
<input aria-invalid="true" aria-describedby="error-msg" />
<span id="error-msg" role="alert">{error}</span>

// Loading states
<button aria-busy="true">
  <Loader2 className="animate-spin" />
  Loading...
</button>
```

#### Color & Vision Deficiencies

**Do not rely solely on color:**
- Add icons or text labels to status indicators
- Use patterns/textures in charts
- Provide text alternatives for color-coded data

**Testing tools:**
- Chrome DevTools → Rendering → "Emulate vision deficiencies"
- Validate with protanopia, deuteranopia, tritanopia simulations

#### Motion & Animations

**Respect `prefers-reduced-motion`:**
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

**Guidelines:**
- Animations duration ≤ 300ms for non-essential motion
- Provide static alternatives for critical info in animations
- No auto-playing video/audio without user control

### Accessibility Testing Checklist

Before submitting PR touching admin components:

- [ ] Run `npm run lint:a11y` with 0 warnings
- [ ] Validate with Axe DevTools browser extension
- [ ] Test keyboard navigation (no mouse)
- [ ] Verify screen reader compatibility (NVDA/VoiceOver)
- [ ] Check contrast ratios for all text on colored backgrounds
- [ ] Test with vision deficiency simulations
- [ ] Verify focus indicators visible on all interactive elements
- [ ] Confirm `aria-label`, `aria-describedby`, `role` attributes present

**Reference:** [W3C ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/)

---

## Visual Regression Testing

### Storybook

Admin components have Storybook stories for visual documentation and testing.

**Start Storybook:**
```bash
npm run storybook  # Opens http://localhost:6006
```

**Build Storybook:**
```bash
npm run build-storybook  # Outputs to storybook-static/
```

**Storybook Configuration:**
- Main config: [`.storybook/main.ts`](../.storybook/main.ts)
- Preview config: [`.storybook/preview.ts`](../.storybook/preview.ts)
- Stories glob: `src/**/*.stories.@(js|jsx|ts|tsx)`

**Addons:**
- `@storybook/addon-essentials`: Controls, docs, actions
- `@storybook/addon-a11y`: Accessibility panel with Axe integration
- `@storybook/addon-interactions`: Interaction testing

### CI Integration

Admin component stories are built and tested in CI pipeline.

**Workflow:** `.github/workflows/ci.yml`

**Steps added:**
1. Build Storybook static files
2. Run accessibility audits on stories
3. Compare screenshots for visual regressions

See [Visual Regression Testing](#visual-regression-testing-in-ci) section below.

### Screenshot Testing

**Local testing:**
```bash
# Install Playwright browsers
npx playwright install

# Run visual regression tests
npm run test:visual  # Configured in package.json
```

**How it works:**
1. Stories rendered in headless browser
2. Screenshots captured at multiple viewports (1280px, 1440px, 1920px)
3. Compared against baseline images in `tests/visual-regression/baselines/`
4. Diffs highlighted in test report

**Updating baselines:**
```bash
npm run test:visual -- --update-snapshots
```

### Visual Regression Testing in CI

**CI Workflow Integration:**

The CI pipeline (`.github/workflows/ci.yml`) includes:

```yaml
- name: Build Storybook
  run: npm run build-storybook

- name: Run Storybook accessibility tests
  run: npx test-storybook --maxWorkers=2

- name: Run visual regression tests
  run: npm run test:visual

- name: Upload visual diffs on failure
  if: failure()
  uses: actions/upload-artifact@v4
  with:
    name: visual-regression-diffs
    path: tests/visual-regression/diffs/
```

**Accessibility Audits:**
- Storybook test-runner executes Axe on all stories
- Fails build if violations found (configurable severity)
- Reports accessibility tree and violations in CI logs

**Review Process:**
1. PR opened → CI runs visual & a11y tests
2. If diffs detected → Review screenshots in CI artifacts
3. Intentional changes → Update baselines, push to PR
4. Regressions → Fix component, re-run CI

---

## Review Checkpoints

### Design Sign-off Requirements

For PRs touching `app/admin/**` or `src/components/admin/**`:

#### 1. Design Review
**Required when:**
- Adding new admin components
- Modifying visual appearance of existing components
- Changing layout, spacing, or typography

**Review criteria:**
- [ ] Follows design tokens (colors, spacing, radii)
- [ ] Matches Figma specifications (if available)
- [ ] Consistent with existing admin components
- [ ] Responsive at 1280px, 1440px, 1920px breakpoints
- [ ] Glass surface opacities meet contrast requirements

**Reviewer:** @design-team (assign in GitHub)

#### 2. Accessibility Audit
**Required when:**
- Adding interactive elements
- Modifying forms or data tables
- Changing color schemes or contrast

**Review criteria:**
- [ ] `npm run lint:a11y` passes with 0 warnings
- [ ] Keyboard navigation works without mouse
- [ ] Screen reader announces states correctly
- [ ] Focus indicators visible on all interactive elements
- [ ] Contrast ratios ≥ 4.5:1 for text, ≥ 3:1 for UI components
- [ ] ARIA attributes correct and complete
- [ ] Tested with Axe DevTools (0 violations)

**Reviewer:** @a11y-champions (assign in GitHub)

#### 3. Visual Regression Check
**Required for:**
- All admin component changes

**Review criteria:**
- [ ] Storybook stories updated for new variants/props
- [ ] Visual regression tests pass in CI
- [ ] If intentional changes, baselines updated and approved
- [ ] Screenshots reviewed at multiple breakpoints

**Automated:** CI pipeline + manual review of diffs

#### 4. Code Quality
**Required for:**
- All admin code changes

**Review criteria:**
- [ ] TypeScript types defined (no `any`)
- [ ] Props documented with JSDoc comments
- [ ] Error states handled
- [ ] Loading states implemented
- [ ] Component follows existing patterns
- [ ] No console errors/warnings
- [ ] Unit tests added for logic (if applicable)

**Reviewer:** @platform-team

### CODEOWNERS Integration

Admin component ownership defined in `.github/CODEOWNERS`:

```
# Admin Design System
/app/admin/**                        @platform-team @design-team
/src/components/admin/**             @platform-team @design-team
/docs/design-system/**               @design-team
/docs/admin-design-system.md         @design-team

# Admin UI Primitives (require accessibility review)
/src/components/admin/ui/**          @platform-team @design-team @a11y-champions

# Admin Storybook (require visual review)
/src/components/admin/**/*.stories.tsx   @design-team

# CI workflows (require DevOps approval)
/.github/workflows/ci.yml            @platform-team @devops-team
```

**Auto-assignment:** GitHub automatically requests reviews from CODEOWNERS on PRs.

### PR Template Checklist

Add to `.github/PULL_REQUEST_TEMPLATE.md`:

```markdown
## Admin Component Changes

If this PR touches `app/admin/**` or `src/components/admin/**`:

### Design Review
- [ ] Design tokens used consistently
- [ ] Responsive at 1280px / 1440px / 1920px
- [ ] Figma specs followed (link: ___)
- [ ] Screenshots attached

### Accessibility Audit  
- [ ] `npm run lint:a11y` passes
- [ ] Keyboard navigation tested
- [ ] Screen reader tested (NVDA/VoiceOver)
- [ ] Axe DevTools 0 violations
- [ ] Contrast ratios validated

### Visual Regression
- [ ] Storybook story added/updated
- [ ] Visual tests pass in CI
- [ ] Baselines updated (if intentional change)

### Documentation
- [ ] Component documented in `docs/admin-design-system.md`
- [ ] Props documented with JSDoc
- [ ] Examples added to Storybook

---
**Design sign-off:** @design-reviewer-name  
**Accessibility sign-off:** @a11y-reviewer-name
```

### Merge Criteria

Admin component PRs **require**:
1. ✅ All CI checks pass (lint, type-check, test, visual regression, a11y)
2. ✅ Design team approval (if visual changes)
3. ✅ Accessibility champion approval (if interactive changes)
4. ✅ Platform team approval (code quality)
5. ✅ No unresolved review comments
6. ✅ Documentation updated

**Merge blockers:**
- ❌ Visual regression failures (unless baselines updated with approval)
- ❌ Accessibility violations (Axe errors)
- ❌ Lint/type errors
- ❌ Missing design or a11y sign-off

---

## Voice & Tone Guidelines

Admin copy must enable rapid decision-making with clarity, accountability, and empathy.

**Reference:** [`docs/ux/admin-copy.md`](ux/admin-copy.md)

### Key Principles

1. **Operational Clarity** – Lead with outcome, provide context
2. **Respect for Time** – Short sentences, front-load key facts
3. **Calm Authority** – Acknowledge issues without alarm
4. **Inclusive Accessibility** – Support EN/RW, screen-reader friendly

### Microcopy Patterns

| Scenario | Pattern | Example |
|----------|---------|---------|
| Success | `Outcome + key detail` | "Order #4821 updated successfully" |
| Error | `Failure + cause + next step` | "Save failed. Network error. Retry in 10s." |
| Action required | `Imperative + condition + safety net` | "Approve payment. Review totals before confirming." |
| Status | `State + impact + recovery action` | "Sync paused. Queue growing. Resume sync?" |

### Copy Linting

```bash
npm run lint:admin-copy  # Detects untranslated JSX text
```

---

## Contributing

### Adding New Components

1. **Create component** in `src/components/admin/ui/YourComponent.tsx`
2. **Add Storybook story** in `src/components/admin/ui/__stories__/YourComponent.stories.tsx`
3. **Document in this file** under Component Library section
4. **Add to component audit** in `docs/design-system/admin-component-audit.md`
5. **Write tests** (unit tests for logic, visual tests via Storybook)
6. **Submit PR** with design & a11y reviewers assigned

### Updating Design Tokens

1. **Propose changes** in `src/components/admin/ui/theme.ts`
2. **Update all affected components** to use new tokens
3. **Verify visual regression tests** pass (or update baselines)
4. **Document changes** in this file under Design Tokens
5. **Get design team approval** before merging

### Reporting Issues

- **Component bugs:** Open issue with `[Admin UI]` prefix
- **Design inconsistencies:** Tag `@design-team` in issue
- **Accessibility violations:** Tag `@a11y-champions`, label `accessibility`
- **Documentation gaps:** PRs welcome! Edit this file directly.

---

## Related Documentation

- [Admin Component Audit](design-system/admin-component-audit.md) – Full component inventory
- [Admin Layout Primitives](design-system/admin-layout.mdx) – Layout system deep-dive
- [Responsive Guidelines](design-system/responsive-guidelines.md) – Breakpoint handling
- [Admin Voice & Tone](ux/admin-copy.md) – Microcopy standards
- [Repository README](../README.md) – Build & test setup

---

## Changelog

- **2025-11-12** – Initial consolidated documentation created
- **2025-03-05** – Responsive guidelines updated for admin shell
- **2025-02** – Glass surface opacity adjusted for WCAG AA contrast
- **2025-01** – Admin voice & tone guide published

---

**Questions?** Contact @platform-team or open a discussion in #admin-design-system Slack channel.
