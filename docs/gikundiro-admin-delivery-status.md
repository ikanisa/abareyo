# GIKUNDIRO Admin Panel — Delivery Status & Implementation Plan

## Executive Summary
- The current codebase covers authentication scaffolding, an admin shell, and several rich client views that expect fully built backend APIs, but the foundational database schema, service-layer APIs, RBAC, and audit logging mandated by the blueprint are not yet in place.
- Most data reads and all mutations are stubbed against an assumed external backend (`NEXT_PUBLIC_BACKEND_URL`), so the Supabase-first architecture and audit guarantees remain unimplemented.
- Delivering the production-ready panel will require focused backend, database, and observability work before the existing UI can be wired to live data.

## What Exists Today
- **Login flow against Supabase** – The admin login page signs in with Supabase credentials, forwards the access token to a backend session endpoint, and redirects on success.【F:app/admin/(auth)/login/page.tsx†L14-L144】
- **Admin shell & navigation** – The dashboard layout loads session context from the backend, wraps children in an `AdminShell`, and renders the multi-section navigation, environment badge, and logout flow.【F:app/admin/(dashboard)/layout.tsx†L1-L66】【F:src/components/admin/AdminShell.tsx†L13-L176】
- **Client-side feature consoles** – Views such as match operations, orders, and SMS management are present with optimistic UI logic but depend on REST endpoints (`/admin/...`) that do not yet exist in this repository.【F:src/views/AdminMatchOpsView.tsx†L1-L200】【F:src/components/admin/orders/TicketOrdersTable.tsx†L1-L200】【F:src/views/AdminSmsView.tsx†L1-L200】
- **Supabase edge automations (partial)** – The `sms-webhook` and `issue-policy` edge functions reconcile payments and issue insurance perks, yet they still rely on legacy tables (`tickets`, `transactions`) and omit audit logging or RBAC context.【F:supabase/functions/sms-webhook/index.ts†L1-L102】【F:supabase/functions/issue-policy/index.ts†L1-L200】

## Outstanding Gaps
1. **Database schema alignment**
   - The latest migration stops at core commerce tables and omits the admin-facing tables (admin_users, roles, permissions), audit_logs, feature_flags, translations, and trigger-based rewards pipeline described in the plan.【F:supabase/migrations/20251013_mvp_schema.sql†L1-L124】
   - Legacy tables (`tickets`, `wallets`, `transactions`) conflict with the newer `ticket_orders`/`ticket_passes` design referenced throughout the UI and edge functions, creating schema drift.【F:supabase/migrations/20251013_mvp_schema.sql†L13-L76】【F:supabase/functions/sms-webhook/index.ts†L21-L83】

2. **Backend admin APIs & RBAC**
   - There are no route handlers under `app/admin/api`, and all data fetching libraries call an external `NEXT_PUBLIC_BACKEND_URL`, leaving the App Router without the mandated Supabase-backed admin APIs.【54539f†L1-L3】【F:src/lib/api/admin/match.ts†L24-L77】【F:src/lib/api/admin/orders.ts†L1-L158】
   - No server-side permission checks or audit writes exist for mutations; the UI only displays access-denied toasts based on query params.【F:src/components/admin/AdminShell.tsx†L73-L175】

3. **Audit logging & observability**
   - Audit entries are not captured anywhere—neither the edge functions nor the client code write to `audit_logs`, and there is no helper similar to the proposed `writeAudit` utility.【F:supabase/functions/sms-webhook/index.ts†L21-L102】【F:supabase/functions/issue-policy/index.ts†L133-L200】
   - Metrics, alerting, and parser latency reporting outlined in the blueprint are absent from both backend and UI layers (the overview dashboard still renders placeholder KPI cards).【F:app/admin/(dashboard)/page.tsx†L1-L26】

4. **USSD/SMS reconciliation pipeline**
   - The SMS administration view assumes numerous manual review endpoints (queue stats, parser prompts, attachment flows) that have not been built, so the reconciliation loop cannot function end-to-end.【F:src/views/AdminSmsView.tsx†L54-L200】

5. **Testing & deployment readiness**
   - There is no verified CI workflow covering the admin features, and the existing tests do not target the new modules or Supabase functions.
   - Environment variable wiring (service role keys, webhook tokens) is not documented for Vercel, risking deployment failures.

## Phased Implementation Plan
### Phase 1 — Database & Supabase Foundations (1 sprint)
- Create comprehensive migrations that introduce the admin tables, audit_logs, feature_flags, translations, and rewards triggers; migrate legacy ticket data into the `ticket_orders`/`ticket_passes` structure and remove obsolete tables.【F:supabase/migrations/20251013_mvp_schema.sql†L1-L124】
- Define RLS policies aligned with admin vs. fan access, ensuring all admin access flows through the service role.
- Update edge functions (`sms-webhook`, `issue-policy`) to target the unified schema, record audit metadata, and respect idempotency.【F:supabase/functions/sms-webhook/index.ts†L21-L102】【F:supabase/functions/issue-policy/index.ts†L133-L200】

### Phase 2 — Admin Auth, RBAC, and Audit Services (1 sprint)
- Implement `/admin/api/auth/*` routes to manage sessions, tying Supabase admin users to signed cookies and embedding role/permission checks.
- Build a reusable audit logger that captures before/after payloads for every mutation and invoke it across all admin APIs.
- Seed canonical roles (System Admin, Match Ops, Payments, Content) and expose permission checks to the frontend via the existing session provider.【F:app/admin/(dashboard)/layout.tsx†L1-L66】【F:src/components/admin/AdminShell.tsx†L73-L175】

### Phase 3 — Domain APIs & Integrations (2–3 sprints)
- Implement REST handlers under `app/admin/api` for matches, tickets, shop orders, services, rewards, SMS, admin management, and translations, mirroring the existing client hooks.【F:src/lib/api/admin/match.ts†L24-L104】【F:src/lib/api/admin/orders.ts†L1-L158】【F:src/views/AdminSmsView.tsx†L54-L200】
- Connect these routes to Supabase (via service-role client or RPCs), enforce RBAC, and emit audit logs.
- Wire edge functions and cron jobs (issue-policy, sms-webhook) to enqueue events or webhooks consumed by the admin APIs for real-time updates.

### Phase 4 — UI Wiring, i18n, and Observability (1–2 sprints)
- Replace placeholder KPIs with live metrics sourced from the new APIs and Supabase analytics views.【F:app/admin/(dashboard)/page.tsx†L1-L26】
- Complete bilingual scaffolding by loading `translations` data and instrumenting the UI with RW/EN toggle support.
- Add telemetry dashboards for parser latency, payment confirmation SLAs, and gate throughput; surface alerts in the overview page.

### Phase 5 — QA, CI/CD, and Launch Readiness (1 sprint)
- Expand automated tests (unit, integration, Playwright) to cover authentication, RBAC gatekeeping, SMS reconciliation, and ticket issuance flows.
- Document environment variables and deployment steps for Vercel and Supabase, including rotation procedures for webhook tokens and service keys.
- Run end-to-end rehearsals (seed scripts, supabase migrations, smoke tests) and capture release notes for the go-live cutover.

## Immediate Next Steps
1. Align the Supabase schema and migrate legacy data to prevent further divergence.
2. Stand up the core admin API surface with RBAC and audit logging so existing React views can function.
3. Establish CI gates (`npm run build`, lint, type-check, targeted Playwright suite) to maintain stability ahead of Vercel deployment.
