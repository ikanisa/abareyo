# Phase 1 RLS Hardening Snapshot (Oct 18 2025)

This note documents the security changes introduced by `supabase/migrations/20251113100000_phase1_rls_policies.sql` and the follow-up tasks required to fully operationalise the new policy model.

## What Changed
- Removed the blanket `authenticated_all` policies from 44 public tables (orders, payments, wallet, admin tables, etc.). Authenticated users now rely on owner-specific or read-only policies.
- Added explicit admin policies (`p_<table>_admin_all`) that grant `auth.jwt()->>'role' = 'admin'` access to manage operational tables (admin accounts, catalog, leaderboards, polls, etc.).
- Added service-role policies for legacy tables (`wallets`, `products_legacy`, `tickets_legacy`, `transactions_legacy`) so server-side jobs retain full access after the blanket policies were removed.

## Operational Requirements
1. **JWT Role Assertions** – Admin sessions must issue tokens with `{"role": "admin"}`. Confirm the admin login flow (Next.js middleware and Supabase Auth) injects this claim; otherwise, create a function or hook to set it.
2. **Service Role Usage** – Edge Functions, backend jobs, and Supabase Studio scripting must use the service-role key. Review existing deployments to ensure no user-facing clients rely on the deprecated blanket policies.
3. **Legacy Table Cleanup** – The `wallets`, `tickets_legacy`, `transactions_legacy`, and `products_legacy` tables are now service-role only. Plan their archival/removal once data exports are verified.
4. **Admin UI Smoke Tests** – Retest admin workflows (shop management, match scheduling, leaderboards, translations) with an admin JWT to confirm the new policies grant expected access.
5. **Monitoring** – Add Postgres log alerts for `insufficient_privilege` to catch any edge cases caused by the tighter policies.
