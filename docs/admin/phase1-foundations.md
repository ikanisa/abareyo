# Phase 1 — Foundations & RBAC

Date: 2025-10-18  
Owner: Platform Engineering

## Highlights

- **Feature flag hardening** – Module toggles now cover every sidebar section with Supabase seeds for defaults (`admin.module.*`) and a new kill-switch (`admin.shell.enabled`). The feature flag snapshot loader pulls these keys and the shell refuses to render when the master flag is off.
- **Typed RBAC catalogue** – Introduced `src/config/admin-rbac.ts`, enumerating canonical permission codes, module → permission requirements, and role presets (SYSTEM_ADMIN, MATCH_OPERATIONS, PAYMENTS, CONTENT, SUPPORT). Exposed helpers for permission checks and module access.
- **Admin access hook** – `useAdminAccess` centralises client-side permission checks; the admin shell nav renders disabled states when a feature flag is off or the user lacks access.
- **Server-side enforcement** – Added `requireAdminPermissions` and `requireAdminModuleAccess` helpers so App Router handlers guard Supabase mutations with typed permissions. Key routes (`tickets`, `shop`, `sms`, `content`, `admin`) now enforce the correct codes before touching the database or writing audit logs.
- **Supabase seeding** – Migration `20251118_admin_rbac_seed.sql` seeds the complete permission set, system roles, and module feature flags without mutating existing `enabled` values. SYSTEM_ADMIN is linked to every seeded permission.

## Follow-up

- Continue migrating remaining admin routes off legacy module codes and ensure edge functions emit audit entries with the new utility.
- Expand role presets for granular operations (insurance underwriters, SACCO clerks) ahead of Phase 2.
- Document how customer success can toggle `admin.shell.enabled` during incidents.
