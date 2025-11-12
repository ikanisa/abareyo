# Admin UI Component Audit

This audit catalogs every admin-specific component under `src/components/admin` and assigns each one to a primary interaction pattern. Use it as a reference when planning refactors, building new screens, or wiring Storybook examples.

## Tables

| Component | Path | Notes |
| --- | --- | --- |
| `DataTable` | `src/components/admin/DataTable.tsx` | Shared paginated table wrapper that powers resource-specific listings. |
| `MembersTable` | `src/components/admin/membership/MembersTable.tsx` | Membership roster grid with status controls, search, and pagination. |
| `FeatureFlagsTable` | `src/components/admin/settings/FeatureFlagsTable.tsx` | Toggleable feature flags with inline switch controls. |
| `AdminAuditLogTable` | `src/components/admin/settings/AdminAuditLogTable.tsx` | Audit log stream with filterable event types. |
| `ShopOrdersTable` | `src/components/admin/orders/ShopOrdersTable.tsx` | Shop order listing with recon and fulfillment status. |
| `ShopOrdersManageTable` | `src/components/admin/shop/ShopOrdersManageTable.tsx` | Operational shop order grid with bulk actions. |
| `TicketOrdersTable` | `src/components/admin/orders/TicketOrdersTable.tsx` | Event ticket purchases grouped by status and fulfillment. |
| `DonationsTable` | `src/components/admin/orders/DonationsTable.tsx` | Donation receipts with settlement status and search. |
| `FundraisingDonationsTable` | `src/components/admin/fundraising/FundraisingDonationsTable.tsx` | Project-scoped donations with inline status updates. |
| `AdminUsersDirectory` | `src/components/admin/users/AdminUsersDirectory.tsx` | Directory-style table of accounts with merge actions. |
| `AdminServicesDashboard` (quotes/deposits tables) | `src/components/admin/services/AdminServicesDashboard.tsx` | Contains multiple data tables for insurance quotes and deposits. |

## Cards & Dashboards

| Component | Path | Notes |
| --- | --- | --- |
| `AdminDashboardClient` | `src/components/admin/dashboard/AdminDashboardClient.tsx` | KPI cards and operational snapshots for the main dashboard. |
| `AdminRewardsDashboard` | `src/components/admin/rewards/AdminRewardsDashboard.tsx` | Reward issuance metrics and queue health cards. |
| `AdminReportsDashboard` | `src/components/admin/reports/AdminReportsDashboard.tsx` | Scheduled report summary cards with empty states. |
| `AdminServicesDashboard` (summary cards) | `src/components/admin/services/AdminServicesDashboard.tsx` | Service health metrics and underwriting summaries. |
| `AdminContentDashboard` | `src/components/admin/content/AdminContentDashboard.tsx` | Content publishing status tiles and schedule cards. |
| `AdminOfflineNotice` | `src/components/admin/AdminOfflineNotice.tsx` | Offline state card guiding operators to recover service. |
| `AdminList` | `src/components/admin/ui/AdminList.tsx` | Filterable list surface that wraps sections in card chrome. |
| `AdminShell` | `src/components/admin/AdminShell.tsx` | Layout shell that composes navigation rails and card-based content areas. |

## Forms & Action Surfaces

| Component | Path | Notes |
| --- | --- | --- |
| `MembershipActions` | `src/components/admin/membership/MembershipActions.tsx` | Two-up form for plan management and membership status changes. |
| `FundraisingActions` | `src/components/admin/fundraising/FundraisingActions.tsx` | Form cluster for fundraising project and donation updates. |
| `ShopActions` | `src/components/admin/shop/ShopActions.tsx` | Inline forms for updating shop order state, notes, and tracking. |
| `AttachSmsModal` | `src/components/admin/orders/AttachSmsModal.tsx` | Modal form to associate inbound SMS confirmations with orders. |
| `AdminEditDrawer` | `src/components/admin/ui/AdminEditDrawer.tsx` | Sliding panel container for edit forms. |
| `AdminBottomSheet` | `src/components/admin/ui/AdminBottomSheet.tsx` | Mobile-first action sheet for bulk updates. |
| `AdminConfirmDialog` | `src/components/admin/ui/AdminConfirmDialog.tsx` | Confirmation dialog primitive used by destructive actions. |

## Status & Notifications

| Component | Path | Notes |
| --- | --- | --- |
| `AdminToastViewport` | `src/components/admin/ui/AdminToast.tsx` | Status toasts for async feedback with admin theming. |
| `AdminInlineMessage` | `src/components/admin/ui/AdminInlineMessage.tsx` | Inline status banner supporting tone variants and action slots. |
| `AdminInlineMessage` usages (e.g., dashboards) | Various | Embedded status callouts across dashboards and settings flows. |
| `AdminBottomSheet` notices | `src/components/admin/ui/AdminBottomSheet.tsx` | Provides contextual status copy when confirming operations. |

## Additional Utilities

These components support layout orchestration or complex workflows and do not squarely fit into a single category above, but they rely on the primitives documented in this audit.

| Component | Path | Notes |
| --- | --- | --- |
| `AdminShell` | `src/components/admin/AdminShell.tsx` | Primary layout wrapper controlling navigation, breadcrumbs, and responsive rails. |
| `AdminToastViewport` provider wiring | `src/components/admin/ui/AdminToast.tsx` | Installs the shared toast provider consumed throughout admin flows. |

Update this audit whenever you introduce a new admin component or significantly rework an existing one so the catalog stays trustworthy.
