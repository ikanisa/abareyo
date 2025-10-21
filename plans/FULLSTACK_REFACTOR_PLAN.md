# Full-Stack Refactor Plan — Supabase, API Layer, and Admin Surfaces

## Goals
- Establish a single source of truth for Supabase configuration across edge functions, Next.js API routes, and admin/server utilities.
- Introduce reusable HTTP helpers for Supabase edge functions to reduce drift and improve observability.
- Provide a typed, cache-aware service client factory for admin services and API routes with graceful fallbacks when credentials are missing.
- Document the work and leave guidance for future iterations.

## Scope & Sequencing

### 1. Supabase Edge Functions Foundation
- Create shared helpers under `supabase/functions/_shared/` for:
  - Reading environment variables with consistent fallbacks and actionable error messages.
  - Bootstrapping the service-role Supabase client with caching and predictable auth settings.
  - Common HTTP utilities (`requireMethod`, `parseJsonBody`, `json`, `jsonError`).
- Refactor existing functions (`award_points`, `handle_momo_webhook`, `issue_ticket_perk`, `issue-policy`, `match-payment`, `moderate`, `ops-digest`, `parse-sms`, `qr-token`, `realtime-ping`, `sms-webhook`) to consume the shared helpers.
- Update `_shared/README.md` to describe the new structure and expectations for future functions.

### 2. Admin & API Service Client Consolidation
- Introduce `src/services/admin/service-client.ts` with:
  - A cache-aware getter for the Supabase service client.
  - A `withAdminServiceClient` helper that provides optional fallbacks for unauthenticated environments.
  - A custom error type for clearer failure handling.
- Refactor existing admin services (`dashboard`, `translations`, `feature-flags`) to use the new helper instead of importing from API internals.
- Update `app/api/admin/_lib/db.ts` to re-export the shared helper, preserving backwards compatibility for API route handlers.

### 3. Reporting & Verification
- Add a report summarising the refactor outcomes and follow-up opportunities.
- Run linting/type checks to ensure the refactor keeps CI green.

## Acceptance
- Supabase functions compile under Deno with shared helpers.
- Admin services and API routes share the same service-client factory without circular dependencies.
- Documentation added for both the plan and the executed refactor.
- Lint/type-check commands succeed locally.
