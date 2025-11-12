# Admin Copy Inventory

This inventory tracks user-facing strings across the admin surfaces that now participate in localization via the admin locale provider. Keys are grouped by context so writers and engineers can pinpoint the copy that powers navigation, toast feedback, and form helpers.

## Navigation Labels

| Module | Key | English (en) | Notes |
| --- | --- | --- | --- |
| Global nav | `admin.nav.overview` | Overview | Primary dashboard landing. |
| Global nav | `admin.nav.match_ops` | Match Ops | Match day operations. |
| Global nav | `admin.nav.tickets` | Tickets | Ticketing console. |
| Global nav | `admin.nav.shop` | Shop | Merch and orders. |
| Global nav | `admin.nav.services` | Services | Partner services management. |
| Global nav | `admin.nav.rewards` | Rewards | Loyalty tooling. |
| Global nav | `admin.nav.community` | Community | Fan community moderation. |
| Global nav | `admin.nav.content` | Content | Editorial tooling. |
| Global nav | `admin.nav.ussd_sms` | USSD / SMS | Messaging & parser surfaces. |
| Global nav | `admin.nav.users` | Users | Directory of fan accounts. |
| Global nav | `admin.nav.admin` | Admin | RBAC and audit controls. |
| Global nav | `admin.nav.reports` | Reports | Analytics automation hub. |
| Shell utilities | `admin.shell.nav.disabled` | Off | Badge when a module flag is disabled. |
| Shell utilities | `admin.shell.menu.label` | Menu | Mobile menu trigger text. |
| Shell utilities | `admin.shell.menu.sheetTitle` | Navigation | Drawer title on mobile. |
| Shell utilities | `admin.shell.menu.aria` | Toggle navigation | Accessibility label for the menu button. |
| Shell utilities | `admin.shell.search.placeholder` | Search ops… | Global search placeholder. |
| Shell utilities | `admin.shell.language.toggleLabel` | Lang | Language toggle badge. |
| Shell utilities | `admin.shell.quickActions` | Quick actions | Quick action menu label. |
| Shell utilities | `admin.shell.signOut` | Sign out | Sign-out button copy. |

## Toast Messages

### Permissions & Session State

| Key | English (en) | Context |
| --- | --- | --- |
| `admin.toast.denied.title` | Access denied | Shared title for permission failures. |
| `admin.toast.denied.generic` | You do not have permission to access that section. | Fallback description when no scoped message matches. |
| `admin.toast.denied.orders` | You lack permission to view order management. Contact an admin to request access. | Orders module gate. |
| `admin.toast.denied.matchOps` | Match operations require the match:update permission. | Match operations gate. |
| `admin.toast.denied.translations` | Translations console requires the translation:view permission. | Translations console gate. |
| `admin.toast.denied.membership` | Membership console requires the membership:member:view permission. | Membership module gate. |
| `admin.toast.denied.fundraising` | Fundraising console requires the fundraising:donation:view permission. | Fundraising module gate. |
| `admin.toast.denied.reports` | Reports require the reports:view permission. | Reports module gate. |

### Shop Operations

| Key | English (en) | Context |
| --- | --- | --- |
| `admin.toast.shop.orders.loadFailed` | Failed to load shop orders | Fetch failure on the orders table. |
| `admin.toast.shop.orders.updated` | Order updated | Success after single order status change. |
| `admin.toast.shop.orders.updateFailed` | Failed to update order | Error while updating order state. |
| `admin.toast.shop.orders.noteAdded` | Note added | Success after adding fulfillment note. |
| `admin.toast.shop.orders.noteFailed` | Failed to add note | Error while adding note. |
| `admin.toast.shop.orders.trackingUpdated` | Tracking updated | Success after updating tracking details. |
| `admin.toast.shop.orders.trackingFailed` | Failed to update tracking | Error while saving tracking. |
| `admin.toast.shop.orders.statusChanged` | Status changed successfully. | Secondary message for status updates. |
| `admin.toast.shop.orders.noteRecorded` | Fulfillment note recorded. | Secondary message for note creation. |
| `admin.toast.shop.orders.trackingSet` | Tracking number set. | Secondary message for tracking updates. |
| `admin.toast.shop.orders.batchUpdated` | Batch updated | Success after batch status run. |
| `admin.toast.shop.orders.batchUpdatedCount` | {{count}} orders updated. | Interpolated batch success detail. |
| `admin.toast.shop.orders.batchFailed` | Batch failed | Batch status failure title. |

### Reporting Automation

| Key | English (en) | Context |
| --- | --- | --- |
| `admin.toast.reports.scheduleCreated` | Schedule created | Success after creating an automation. |
| `admin.toast.reports.scheduleSaved` | Report schedule saved successfully. | Detail copy on schedule creation. |
| `admin.toast.reports.scheduleFailed` | Failed to create schedule | Error during automation creation. |

### Rewards Retro-Issuance

| Key | English (en) | Context |
| --- | --- | --- |
| `admin.toast.rewards.queued` | Reward queued | Success after issuing a retro reward. |
| `admin.toast.rewards.issued` | Retro reward issued successfully. | Detail copy on success. |
| `admin.toast.rewards.failed` | Failed to issue reward | Error while issuing a reward. |

### Partner Services

| Key | English (en) | Context |
| --- | --- | --- |
| `admin.toast.services.policyIssued` | Policy issued | Success after issuing insurance policy. |
| `admin.toast.services.policyIssuedDescription` | The policy has been issued successfully. | Detail copy on issuance. |
| `admin.toast.services.policyFailed` | Failed to issue policy | Error while issuing policy. |
| `admin.toast.services.depositUpdated` | Deposit updated | Success after updating SACCO deposit status. |
| `admin.toast.services.depositStatus` | Status set to {{status}}. | Interpolated deposit status detail. |
| `admin.toast.services.depositFailed` | Failed to update deposit | Error while updating deposit. |
| `admin.toast.services.quoteUpdated` | Quote updated | Success after editing quote metadata. |
| `admin.toast.services.quoteSaved` | Changes applied successfully. | Detail copy on quote save. |
| `admin.toast.services.quoteFailed` | Failed to update quote | Error while saving quote changes. |

### Content Operations

| Key | English (en) | Context |
| --- | --- | --- |
| `admin.toast.content.saved` | Content saved | Success after saving a draft. |
| `admin.toast.content.draftCreated` | Draft created successfully. | Detail copy on draft creation. |
| `admin.toast.content.saveFailed` | Failed to save content | Error while creating a draft. |

## Form Helpers & Field Labels

### Shop Orders & Actions

| Key | English (en) | Usage |
| --- | --- | --- |
| `admin.shop.orders.search.placeholder` | Search order id/email | Data table search placeholder. |
| `admin.shop.orders.filters.status.label` | Status | Status filter label. |
| `admin.shop.orders.filters.status.placeholder` | Status | Status filter placeholder. |
| `admin.shop.orders.status.all` | All | Filter option label. |
| `admin.shop.orders.status.pending` | Pending | Filter option label. |
| `admin.shop.orders.status.ready` | Ready | Filter option label. |
| `admin.shop.orders.status.fulfilled` | Fulfilled | Filter option label. |
| `admin.shop.orders.status.cancelled` | Cancelled | Filter option label. |
| `admin.form.shop.orders.note.placeholder` | Note | Inline note input placeholder. |
| `admin.form.shop.orders.tracking.placeholder` | Tracking # | Tracking input placeholder. |
| `admin.shop.orders.actions.addNote` | Add Note | Inline note button copy. |
| `admin.shop.orders.actions.saveTracking` | Save | Tracking save button copy. |
| `admin.shop.actions.sections.updateStatus` | Update Order Status | Form section heading. |
| `admin.shop.actions.fields.orderId` | Order ID | Field label. |
| `admin.shop.actions.fields.status` | Status | Field label. |
| `admin.shop.actions.fields.note` | Note (optional) | Field label. |
| `admin.shop.actions.buttons.updateStatus` | Update Status | Action button. |
| `admin.shop.actions.buttons.addNote` | Add Note | Action button. |
| `admin.shop.actions.sections.updateTracking` | Update Tracking | Form section heading. |
| `admin.shop.actions.fields.trackingNumber` | Tracking number | Field label. |
| `admin.shop.actions.buttons.saveTracking` | Save Tracking | Action button. |
| `admin.shop.actions.sections.batchUpdate` | Batch Update Status | Form section heading. |
| `admin.shop.actions.fields.batchIds` | Order IDs (comma separated) | Field label. |
| `admin.form.shop.orders.batchIds.placeholder` | id1, id2, id3 | Batch IDs placeholder. |
| `admin.form.shop.orders.batchStatus.placeholder` | fulfilled | Batch status placeholder. |
| `admin.shop.actions.buttons.runBatch` | Run Batch Update | Action button. |
| `admin.form.shop.orders.status.placeholder` | pending | ready | fulfilled | cancelled | Status guidance placeholder. |

### Reporting Automation

| Key | English (en) | Usage |
| --- | --- | --- |
| `admin.form.reports.schedule.name.placeholder` | Report name | Input placeholder. |
| `admin.form.reports.schedule.cron.placeholder` | Cron expression | Input placeholder. |
| `admin.form.reports.schedule.destination.placeholder` | Destination | Input placeholder. |
| `admin.form.reports.schedule.payload.placeholder` | Payload JSON (e.g. {"range":"last7"}) | Optional payload helper. |
| `admin.reports.schedule.saveButton` | Save schedule | Submission button. |

### Rewards Retro-Issuance

| Key | English (en) | Usage |
| --- | --- | --- |
| `admin.form.rewards.userId.placeholder` | User id | Input placeholder. |
| `admin.form.rewards.points.placeholder` | Points (optional) | Input placeholder. |
| `admin.form.rewards.matchId.placeholder` | Match id for ticket perk | Input placeholder. |
| `admin.form.rewards.reason.placeholder` | Reason or note | Input placeholder. |
| `admin.rewards.actions.issue` | Issue reward | Submission button. |

### Partner Services

| Key | English (en) | Usage |
| --- | --- | --- |
| `admin.services.insurance.inlineTitle` | Insurance | Section header helper. |
| `admin.services.insurance.inlineDescription` | Review paid quotes, issue policies, and grant perks where applicable. | Helper description. |
| `admin.services.insurance.listTitle` | Quotes | List heading. |
| `admin.services.insurance.listDescription` | Quotes awaiting issuance or follow-up. | List helper. |
| `admin.services.insurance.actions.edit` | Edit | Inline button. |
| `admin.services.insurance.actions.issue` | Issue policy | Inline button. |
| `admin.services.insurance.drawerTitle` | Update quote | Drawer title. |
| `admin.services.insurance.drawerDescription` | Adjust quote metadata or ticket perk eligibility. | Drawer helper. |
| `admin.services.insurance.fields.status` | Status | Drawer label. |
| `admin.services.insurance.fields.ticketPerk` | Ticket perk | Drawer label. |
| `admin.services.deposits.inlineTitle` | SACCO Deposits | Section header helper. |
| `admin.services.deposits.inlineDescription` | Confirm SACCO deposits once reconciled via SMS or ledger uploads. | Helper description. |
| `admin.services.deposits.listTitle` | Deposits | List heading. |
| `admin.services.deposits.listDescription` | Recent SACCO deposits awaiting confirmation. | List helper. |
| `admin.services.deposits.actions.markPending` | Mark pending | Inline action button. |
| `admin.services.deposits.actions.markConfirmed` | Mark confirmed | Inline action button. |
| `admin.services.deposits.confirmTitle` | Confirm deposit | Confirmation title. |
| `admin.services.deposits.confirmDescription` | Are you sure this SACCO deposit is reconciled? | Confirmation helper. |
| `admin.services.deposits.confirmAction` | Confirm deposit | Confirmation action. |
| `admin.shared.cancel` | Cancel | Shared cancel action. |

### Content Operations

| Key | English (en) | Usage |
| --- | --- | --- |
| `admin.content.inline.title` | Content library | Section heading. |
| `admin.content.inline.description` | Manage articles and media scheduled for the fan-facing experience. | Helper description. |
| `admin.content.create.heading` | Create draft | Form heading. |
| `admin.form.content.title.placeholder` | Title | Input placeholder. |
| `admin.form.content.slug.placeholder` | Slug (optional) | Input placeholder. |
| `admin.form.content.body.placeholder` | Body markdown | Textarea placeholder. |
| `admin.content.create.saveButton` | Save draft | Submission button. |
| `admin.content.list.title` | Recent drafts | List heading. |
| `admin.content.list.description` | Draft and published content sorted by last update. | List helper. |

## Reference & Maintenance

All keys listed above are seeded for English (`en`) and Kinyarwanda (`rw`) in `supabase/seed/20251013_seed.sql`. When adding new copy, extend this inventory and seed file so localization remains in sync.
