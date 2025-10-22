# Vercel Deployment Checklist (Retired)

The project no longer targets Vercel. Historical requirements are preserved below for reference but should not be used for new deployments. Supabase-managed hosting and the GitHub Actions preview workflow now cover build parity.

- Framework preset: Next.js 14 (App Router).
- Build command: `npm run build` (legacy entry). Secrets are now managed manually via `docs/supabase/vault-secret-map.md`.
- Output directory: default `.next/`.
- Node version: 20.x.
- Legacy `npm run vercel:env:sync` script has been removed; follow the vault map for secret propagation.
- Capacitor export workflow should remain separate from web deployments.
- `NEXT_TELEMETRY_DISABLED=1` may still be set in CI as needed.
