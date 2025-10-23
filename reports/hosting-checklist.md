# Self-Hosted Deployment Checklist

> Use this checklist when preparing a new environment (Docker host,
> Kubernetes namespace, or Supabase-hosted function pairing). It mirrors
> our CI automation and replaces the legacy managed-host workflow.

- [ ] Framework preset: Next.js 14 (App Router) with Node 20 runtime.
- [x] Build command: `pnpm build` (guards Supabase env completeness via `config/validated-env.mjs`).
- [ ] Output directory: `.next/` (copy `.next/standalone`, `.next/static`, and `public/`).
- [ ] Environment variables: sync via `scripts/env-sync-template.sh` or your secret manager.
- [ ] Capacitor bundles are built separately via `pnpm build:capacitor` (keep web deploy lean).
- [ ] Configure `NEXT_TELEMETRY_DISABLED=1` in CI as needed.
