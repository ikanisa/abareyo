# Vercel Deployment Checklist (Archived)

> The project no longer deploys via Vercel. This checklist is retained for
> reference only; replace these steps with the internal GitHub Actions
> deployment pipeline when rolling out new environments.

- [ ] Framework preset: Next.js 14 (App Router). _(Legacy)_
- [x] Build command: `npm run build` (socket env guard satisfied via the former `npm run vercel:env:sync`).【F:src/config/client.ts†L23-L78】【F:scripts/vercel-generate-secrets.sh†L1-L163】
- [ ] Output directory: default `.next/` (no custom export). _(Legacy)_
- [ ] Node version: 20.x (update Vercel project settings; confirm runtime logs). _(Legacy)_
- [x] Environment variables: were provisioned via `npm run vercel:env:sync` (backend, Supabase, telemetry, socket defaults).【F:scripts/vercel-generate-secrets.sh†L1-L163】 _(Legacy workflow)_
- [ ] Remove capacitor `next export` workflow for Vercel builds (use separate job for native bundles).【F:package.json†L7-L23】 _(Legacy)_
- [ ] Configure `NEXT_TELEMETRY_DISABLED=1` in CI as needed. _(Legacy)_
