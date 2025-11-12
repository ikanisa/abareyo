## Summary
- [ ] Provide a concise summary of the change
- [ ] Link to any related issues, docs, or context

## Checklist
- [ ] I have run `npm install` (or `pnpm install`) to ensure the lockfile is up to date
- [ ] I have run `npm run lint` and fixed any lint errors
- [ ] I have run `npm run type-check` to verify TypeScript passes
- [ ] I have run `npm test` (or the relevant targeted suites) and they pass locally
- [ ] I have run `npm run build` to confirm the production bundle compiles

---

## Admin Component Changes

**Complete this section if your PR touches `app/admin/**` or `src/components/admin/**`**

### Design Review
- [ ] Design tokens used consistently (colors, spacing, radii from `src/components/admin/ui/theme.ts`)
- [ ] Responsive at 1280px / 1440px / 1920px breakpoints
- [ ] Follows Figma specifications (link: ___)
- [ ] Consistent with existing admin components
- [ ] Screenshots attached below (for visual changes)

### Accessibility Audit
- [ ] `npm run lint:a11y` passes with 0 warnings
- [ ] Keyboard navigation tested (no mouse required)
- [ ] Screen reader tested (NVDA/VoiceOver/other)
- [ ] Axe DevTools shows 0 violations
- [ ] Contrast ratios validated (≥4.5:1 for text, ≥3:1 for UI components)
- [ ] Focus indicators visible on all interactive elements
- [ ] ARIA attributes correct (`aria-label`, `aria-describedby`, `role`, etc.)

### Visual Regression
- [ ] Storybook story added or updated in `src/components/admin/ui/__stories__/`
- [ ] Visual regression tests pass in CI
- [ ] If visual changes are intentional, baselines updated with `npm run test:visual -- --update-snapshots`
- [ ] Tested at multiple breakpoints (1280px, 1440px, 1920px)

### Documentation
- [ ] Component documented in `docs/admin-design-system.md`
- [ ] Props documented with JSDoc comments
- [ ] Examples added to Storybook with common use cases
- [ ] Updated `docs/design-system/admin-component-audit.md` if adding new component

### Code Quality
- [ ] TypeScript types defined (no `any` types)
- [ ] Error states handled gracefully
- [ ] Loading states implemented where applicable
- [ ] Component follows existing admin patterns
- [ ] No console errors or warnings
- [ ] Unit tests added for business logic (if applicable)

---

**Design sign-off:** (Tag reviewer: @design-team-member)  
**Accessibility sign-off:** (Tag reviewer: @a11y-champion)

**Screenshots:**
<!-- Attach screenshots here for visual changes at different breakpoints -->

**Related Documentation:**
<!-- Link to Figma, design specs, or related docs -->
