# Full-Stack Refactor Report — Supabase & Admin Integration

## Overview
This iteration delivers the plan captured in `plans/FULLSTACK_REFACTOR_PLAN.md`,
focusing on three areas:

1. **Supabase edge functions** now share a common configuration and HTTP surface.
2. **Admin services** consume a cache-aware Supabase service client with graceful
   fallbacks for non-configured environments.
3. **Documentation** was extended with both the plan and this execution report.

## Supabase Functions
- Added `supabase/functions/_shared/{env,client,http}.ts` to centralise
  configuration, service-role instantiation, and JSON/method guards.
- Refactored every function to use `getServiceRoleClient`, `requireMethod`, and
  `parseJsonBody` instead of ad-hoc helpers.
- Hardened OpenAI/Realtime/SMS token handling with `requireEnv` to provide clear
  misconfiguration feedback.

## Admin Platform
- Introduced `src/services/admin/service-client.ts`, exposing
  `getAdminServiceClient`, `withAdminServiceClient`, and
  `AdminServiceClientUnavailableError`.
- Updated dashboard, translations, and feature-flag services to rely on the new
  helper, reducing cross-layer imports from API internals and consolidating
  fallback behaviour.
- Swapped the legacy `app/api/admin/_lib/db.ts` implementation for a thin
  re-export of the shared helper, keeping API routes backwards compatible.
- Updated admin app APIs (SMS reconciliation candidates and shop promotions)
  to use `withAdminServiceClient`, ensuring consistent Supabase fallbacks and
  caching across server entrypoints.
- Continued migrating admin routes—covering content library/publish flows,
  community moderation and rate limits, match management, user directory
  search/merge, and report scheduling—to the shared service client with a
  reusable "Supabase not configured" response helper.
- Extended the Next.js admin API surface (shop/ticket orders, match operations,
  manual SMS reconciliation, and Supabase auth) to `withAdminServiceClient`,
  ensuring the same cached client and fallback semantics across both App Router
  and admin dashboard endpoints.
- Replaced the legacy Supabase bootstrapper used by remaining admin APIs with
  a thin wrapper around the shared service client, preventing future drift
  even before every route is migrated.
- Normalised the typed Supabase schema to include admin RBAC tables and
  metadata (permissions, role links, timestamps), unblocking type-safe usage of
  the shared service client in the migrated routes.

## Follow-Ups
- Expand unit coverage around the new helpers (e.g. mock Supabase env states).
- Consider migrating other server-side utilities to `withAdminServiceClient` to
  avoid future divergence.
- Evaluate logging/metrics integration inside `supabase/functions/_shared/http.ts`
  (e.g. capture request IDs for analytics).

## Verification
- `npm run lint` (Next.js/ESLint) — ✅
- `npm run type-check` — ⚠️ (fails on pre-existing Supabase typing gaps in admin APIs)
