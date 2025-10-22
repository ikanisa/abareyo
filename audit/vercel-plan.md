# Vercel Deployment Plan (Archived)

The project no longer targets Vercel for hosting. This document is retained for historical context only; follow Supabase/GitHub Actions deployment guidance for current releases. Key artefacts referenced here now live in `docs/supabase/vault-secret-map.md`, `.github/workflows/preview.yml`, and `DEPLOYMENT_READINESS_REPORT.md`.

## Historical Defaults
- **Framework**: Next.js 14 App Router
- **Node**: 20.x (matches `package.json` engines)
- **Install Command**: `npm ci`
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Environment Variables**: Supabase URL/keys, backend URL, onboarding/OpenAI tokens, Sentry DSNs

## Notes for Future Reference
- Backend (`backend/`) was never deployed to Vercel; it remains on separate infrastructure (NestJS + Prisma).
- `vercel.json` has been removed; Next.js builds rely on the default configuration.
- Legacy secret sync (`npm run vercel:env:sync`) and preview workflows have been retired in favour of Supabase Vault + GitHub Actions.
- Use the updated readiness report for active deployment steps.
