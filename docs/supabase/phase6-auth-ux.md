# Phase 6 – Authentication & User Experience (Status: Oct 18 2025)

## Current state
- Admin login flow uses Supabase email/password auth with server-issued session cookies (see `runbooks/admin-supabase-email-login.md`).
- No social or OTP providers enabled.
- Password reset emails rely on Supabase default templates; no custom branding.
- Anonymous sessions are not fully exercised; Playwright e2e uses mocked API.

## Enhancements to implement
1. **Optional providers (Google/Apple/OTP)**
   - Configure in Supabase Dashboard → Authentication → Providers.
   - Update frontend to show provider buttons (Next.js admin login).
   - Add public callback routes under `app/(auth)/` handling provider redirects.
2. **Auth emails & branding**
   - Customize verification/reset templates via Supabase Dashboard → Authentication → Email Templates.
   - Add brand assets and localized messaging.
3. **Post-signup hooks**
   - Create Supabase Edge Function or `afterInsert` trigger on `auth.users` to seed user profiles (`public.users`).
   - Optionally call external onboarding flows (e.g., CRM).
4. **Admin dashboards for sessions/roles**
   - Extend admin UI to list active admin sessions (`admin_sessions`), revoke tokens, and manage roles.
5. **Password reset UX**
   - Add `/auth/reset-password` route with Supabase `updateUser` flow.
   - Document process in runbook (Supabase Dashboard manual reset fallback).
6. **Anonymous session testing**
   - Add Playwright tests covering guest flows (ticket browse, cart) using Supabase `signInAnonymously` if enabled.
7. **Realtime security**
   - Secure WebSocket connections with signed tokens (see `docs/fullstack-ux-audit.md` recommendations).

## Outstanding checklist
- Enable chosen social/OTP providers and test end-to-end.
- Implement custom email templates and send test emails.
- Add automated tests for password reset and anonymous session flows.
- Update training material/runbooks with new auth UX (password reset instructions, provider login steps).
