# Vercel Deployment Checklist

- [ ] Framework preset: Next.js 14 (App Router).
- [x] Build command: `npm run build` (socket env guard satisfied via `npm run vercel:env:sync`).【F:src/config/client.ts†L23-L78】【F:scripts/vercel-generate-secrets.sh†L1-L163】
- [ ] Output directory: default `.next/` (no custom export).
- [ ] Node version: 20.x (update project settings; confirm runtime logs).
- [x] Environment variables: provisioned via `npm run vercel:env:sync` (pushes backend, Supabase, telemetry, socket defaults to Vercel).【F:scripts/vercel-generate-secrets.sh†L1-L163】
- [ ] Remove capacitor `next export` workflow for Vercel builds (use separate job for native bundles).【F:package.json†L7-L23】
- [ ] Configure `NEXT_TELEMETRY_DISABLED=1` in CI as needed.
