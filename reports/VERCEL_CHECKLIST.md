# Vercel Deployment Checklist

- [ ] Framework preset: Next.js 14 (App Router).
- [ ] Build command: `npm run build` (fails today due to socket env guard).【F:src/config/client.ts†L23-L78】【f5c711†L1-L122】
- [ ] Output directory: default `.next/` (no custom export).
- [ ] Node version: 20.x (update project settings; confirm runtime logs).
- [ ] Environment variables: provide defaults for `NEXT_PUBLIC_SOCKET_PATH`, `NEXT_PUBLIC_BACKEND_URL`, `NEXT_PUBLIC_TELEMETRY_URL` in Vercel dashboard with non-secret placeholders.【F:src/config/client.ts†L23-L78】
- [ ] Remove capacitor `next export` workflow for Vercel builds (use separate job for native bundles).【F:package.json†L7-L23】
- [ ] Configure `NEXT_TELEMETRY_DISABLED=1` in CI as needed.
