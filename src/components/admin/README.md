# Admin surface inventory & patterns

This directory contains the reusable admin shell, feature-specific modules, and UI primitives used across dashboards, commerce, rewards, and reporting. The inventory below captures the current module groupings followed by the canonical presentation patterns that should be used when adding or extending admin experiences.

## Directory inventory

| Area | Key components | Notes |
| --- | --- | --- |
| Shell | `AdminShell.tsx`, `AdminOfflineNotice.tsx`, `DataTable.tsx` | Layout chrome, navigation, and shared data grid wrapper |
| Dashboard | `dashboard/AdminDashboardClient.tsx` | KPI snapshot tiles, operational alerts |
| Rewards | `rewards/AdminRewardsDashboard.tsx` | Retro issue flow, recent event feed |
| Services | `services/AdminServicesDashboard.tsx` | Insurance quotes, SACCO deposit reconciliation |
| Shop | `shop/ShopActions.tsx`, `shop/ShopOrdersManageTable.tsx` | Fulfillment workflows, back-office order management |
| Orders | `orders/ShopOrdersTable.tsx`, `orders/TicketOrdersTable.tsx`, `orders/DonationsTable.tsx` | Ticketing & ecommerce order review |
| Fundraising | `fundraising/FundraisingActions.tsx`, `fundraising/FundraisingDonationsTable.tsx` | Donation queue triage |
| Membership | `membership/MembersTable.tsx`, `membership/MembershipActions.tsx` | Member lifecycle operations |
| Settings & reports | `settings`, `reports`, `translations`, `users` | Feature flags, exports, localization |
| UI primitives | `ui/` | Shared surfaces, drawers, toasts, confirm prompts |

## Canonical UI patterns

### Cards & stat tiles

Use `<AdminStatCard>` for analytics tiles, highlight cards, and list items that present numerical context. The component standardizes typography, spacing, and trend treatments while leaning on the admin theme tokens for hover, focus, and motion states. Supply:

- `title` plus optional `description`
- Primary `value` with a `valueLabel` when needed
- Optional `stats` array for secondary metrics and `trend` metadata for directional status
- Arbitrary `children` for custom body layouts (lists, paragraphs, etc.)

### Filter bars

Use `<AdminFilterBar>` for contextual filters that sit above data tables or list feeds. Group each control in a `segments` entry and pass `actions` when an explicit submit/reset is required. The bar automatically renders loading motion when `isLoading` is `true`, providing consistent spinner, surface, and focus styles.

### Action toolbars & forms

Use `<AdminActionToolbar>` to present actionable forms or per-record operations. Render each workflow within `<AdminActionToolbar.Section>` with a `title`, optional `description`, and `footer` for primary buttons. Sections inherit the shared admin surface, focus rings, and spacing so that single or multi-column layouts remain consistent. Apply the `className` prop (e.g., `md:col-span-2`) to span wider grids when needed.

### Modals & overlays

For confirmation prompts, editing panels, and drawer-based flows, continue to use the existing primitives from `ui/`:

- `<AdminConfirmDialog>` for irreversible actions
- `<AdminEditDrawer>` for forms that require additional context
- `<AdminBottomSheet>` when presenting mobile-first sheets

These components already consume the shared admin theme tokens and pair with toasts (`<AdminToast>`) for asynchronous feedback.

## Theme tokens

The admin theme centralizes radii, surface treatments, text color ramps, and motion primitives via `ui/theme.ts`. All primitives import from this module to ensure consistent blur, border, and focus behavior that aligns with the Phase 1 design token package (`@rayon/design-tokens`). Extend the theme when introducing new semantic surfaces instead of inlining Tailwind classes.
