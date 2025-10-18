# GIKUNDIRO Admin Runbook

This document captures day-to-day operator tasks introduced with the new admin panel modules. All flows rely on Supabase via the
admin APIs and write immutable audit logs automatically.

## Reconcile Mobile Money SMS
1. Open **Admin → USSD / SMS** and review the inbound SMS feed.
2. Use the **Parser Playground** to adjust parsing prompts when success rates dip. Save changes under feature flag `admin.module.ussd_sms`.
3. For each unmatched payment, open **Tickets → Orders** and click **Attach SMS**. Paste the SMS text or select a candidate from the
   reconciliation finder. Confirm to mark the entity as paid.

## Issue Insurance Policies
1. Navigate to **Services → Insurance**. Quotes with status `paid` appear at the top.
2. Select a quote, review ticket perk eligibility, and press **Issue policy**. The edge function allocates policy numbers and
   ticket perks, logging to `rewards_events`.
3. Update quote metadata in the edit drawer if premium or perk flags require corrections.

## Create Shop Promotions
1. Open **Shop → Promotions**.
2. Fill in the composer with title, discount %, targeted product IDs, and scheduling window.
3. Click **Publish promotion**. The promotion propagates instantly to the fan shop.
4. Use the inline **Edit** / **Delete** controls for adjustments. All changes are audited.

## Export Reports
1. Go to **Reports**.
2. Fill in the schedule form with a name, cron expression, destination (email or webhook), and optional payload JSON.
3. Press **Save schedule**. The new entry appears in the list and is executed by the Supabase job runner.

## Manage Feature Flags & RBAC
1. Visit **Admin → Admin** to view admin users, roles, and permissions.
2. Assign roles via the RBAC form. Feature flags for modules live in the same view and can be toggled individually to stage
   rollouts.

## Merge Duplicate Users
1. Open **Users** and search by name or phone number.
2. Identify duplicates, then enter the primary and secondary IDs in the merge form.
3. Press **Merge users**. The secondary account is archived and the action is recorded in `audit_logs`.

All modules enforce USSD-only payments. The CI guard `npm run ci:guard-payments` blocks introductions of card or wallet SDKs.
