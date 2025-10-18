# Supabase & Platform Secret Rotation Plan (Phase 0)

Purpose: outline how we move production secrets out of the repository and prepare for Phase 1 rotations. Owners: Platform Engineering & Ops.

## Inventory

- `.env` → Local dev: contains publishable Supabase key and placeholders for sensitive tokens.
- `.env.production` → Template only (no secrets); real values live in Vercel/Supabase Vault.
- `.vercel/.env.development.local` → Dev preview tokens (onboarding agent).
- `backend/.env.example` → Sample backend secrets (MoMo pay codes etc.).

## Rotation & Migration Steps

1. **Create secure storage**
   - Vercel Project → Environment Variables (Production, Preview, Development).
   - Supabase Vault → store server-side secrets for Edge Functions (`supabase secrets set`).
   - (Optional) 1Password/HashiCorp Vault entry for long-term backup.
   - ✅ `.env.production` stripped of real secrets; use `.env.production.example` for local scaffolding.
   - Reference [`docs/supabase/vault-secret-map.md`](vault-secret-map.md) for the latest secret-to-store mapping.

2. **Generate new Supabase keys**
   - Project Settings → API → Generate new publishable + service-role keys.
   - Update `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` in Vercel & Supabase Vault.
   - Redeploy frontend/backend; confirm clients use the new keys.

3. **Rotate JWT signing keys**
   - Authentication → Settings → JWT → generate new secret.
   - Update `JWT_SECRET` in all runtimes (Vercel, Edge Functions, backend).
   - Invalidate refresh tokens to force re-auth.

4. **Third-party services**
   - Twilio, Stripe, MoMo, Slack → collect API keys, account SIDs.
   - Store in Supabase Vault (`TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `STRIPE_SECRET_KEY`, `MOMO_API_KEY`, `SLACK_WEBHOOK_URL`, …).
   - Reference them from Edge Functions via `supabase secrets set`.

5. **Repository cleanup**
   - Once new secrets propagate, purge old values from `.env.production`.
   - Replace with pointers (e.g., `# see docs/supabase/secret-rotation-plan.md`) or remove the file entirely if no longer needed.
   - Ensure `.gitignore` protects future `.env.production`.

6. **Communication & auditing**
   - Notify Ops before rotation; schedule maintenance window if needed.
   - Capture results in change log / incident log.
   - Set recurring reminders (quarterly) for rotations.

## Verification Checklist

- [ ] Supabase CLI `supabase secrets list` shows new keys only.
- [ ] Vercel env dashboard matches latest secret values.
- [ ] Edge Functions redeployed with `supabase functions deploy --no-verify-jwt`.
- [ ] Application smoke tests pass with rotated credentials.
- [ ] Old secrets revoked/deleted at provider level.
