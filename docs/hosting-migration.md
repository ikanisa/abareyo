# Hosting Migration - Vercel & Render Cleanup

This document records the migration to a host-agnostic architecture, removing all provider-specific code and configuration for Vercel and Render (onrender.com).

## Background

The Rayon Sports Digital Platform was designed to be deployable on multiple hosting platforms. This cleanup ensures the codebase remains truly platform-agnostic and prevents accidental reintroduction of provider-specific dependencies.

## What Changed

### Configuration Files
- ✅ No `vercel.json` or `render.yaml` files were present (already clean)
- ✅ No `.vercel/` or `.render/` directories were present (already clean)

### Dependencies
- ✅ No `@vercel/*` packages in `package.json` (already clean)
- ℹ️ `@sentry/vercel-edge` remains as a transitive dependency of `@sentry/nextjs` (required for Sentry Edge runtime)

### Environment Variables
- ✅ No `VERCEL_*` or `RENDER_*` environment variables in `.env*` files (already clean)
- ✅ Codebase uses host-agnostic env vars: `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_BASE_URL`

### Documentation Updates
- 📝 `scripts/cron.md`: Updated to remove provider-specific references
  - Changed "Vercel cron limits" → "platform-specific cron limits"
  - Removed "Render" from hosting options list

### CI/CD
- ✅ No Vercel or Render deployment workflows were present (already clean)
- ➕ Added `host-agnostic-guard.yml` workflow to prevent future violations
- ➕ Added `scripts/host_agnostic_guard.ts` guard script

## Host-Agnostic Replacements

### Rewrites & Headers
Use Next.js native features instead of provider-specific configs:
- **Rewrites**: Implement in `next.config.mjs` or Next.js middleware
- **Headers**: Use `next.config.mjs` `headers()` function or middleware
- **Redirects**: Use `next.config.mjs` `redirects()` function

### Cron Jobs & Scheduled Tasks
Provider-agnostic options:
- **GitHub Actions**: Use scheduled workflows (`.github/workflows/*.yml`)
- **Supabase Edge Functions**: Use `pg_cron` extension for database-driven scheduling
- **External Cron Service**: Cron-job.org, EasyCron, or similar
- **Application-level**: Report worker (`scripts/reports/report-schedule-worker.ts`)

### Analytics
- ✅ Already using Sentry for error tracking and performance monitoring
- Add additional analytics providers as needed (Google Analytics, Plausible, etc.)

### OG Images
- Use Next.js built-in OG image generation (`next/og`)
- Or implement custom OG image service with ImageResponse API

### Key-Value Storage
- ✅ Primary data: Supabase PostgreSQL
- For KV needs: Use Supabase, Redis, or any KV service

## Payments & USSD

**No changes** - USSD-only payment flows remain unchanged:
- iOS users see "Copy USSD" fallback
- Core payment logic uses USSD exclusively
- Supabase integrations unaffected

## Guard Script

The `scripts/host_agnostic_guard.ts` script runs in CI to prevent reintroduction of:
- `@vercel/*` package imports
- Vercel/Render environment variables (`VERCEL_*`, `RENDER_*`)
- Direct `process.env.VERCEL` / `process.env.RENDER` lookups
- Provider-specific domains (vercel.app, onrender.com, render.com)
- Provider-specific config files

### False Positives
The guard has allowlist patterns for common false positives:
- React rendering concepts ("render prop", "server-side rendering")
- Verbs like "to render", "will render"
- Sentry dependencies (`@sentry/vercel-edge`)

### Running Locally
```bash
npx tsx scripts/host_agnostic_guard.ts
```

## Deployment Options

The platform can now be deployed to any Node.js hosting provider:

### Docker-based
- **Kubernetes**: Use manifests in `k8s/`
- **Docker Compose**: `docker compose up web`
- **Fly.io**: Dockerfile-based deployment
- **Railway**: Dockerfile support
- **DigitalOcean App Platform**: Docker support

### Platform-as-a-Service
- **Netlify**: Next.js support
- **Cloudflare Pages**: Next.js support
- **AWS Amplify**: Next.js support

### Self-hosted
- **VPS**: Any Ubuntu/Debian server with Node.js 20
- **Bare metal**: On-premises deployment

## Required Environment Variables

All platforms need these core variables (see `.env.example`):
```bash
# Required
NEXT_PUBLIC_SITE_URL=https://your-domain.com
NEXT_PUBLIC_BACKEND_URL=https://your-domain.com/api
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Optional
NEXT_PUBLIC_ENVIRONMENT_LABEL=production
SENTRY_DSN=your-sentry-dsn
```

## Rollback Plan

If you need to revert these changes:

1. **Via Git Tag**:
   ```bash
   git checkout pre-vercel-render-cleanup
   ```

2. **Via GitHub**: Revert the PR from the GitHub UI

3. **Restore Quarantined Files**: No files were quarantined (none needed removal)

## Verification

After deployment, verify:
- ✅ Application builds successfully: `npm run build`
- ✅ Tests pass: `npm test`
- ✅ Guard passes: `npx tsx scripts/host_agnostic_guard.ts`
- ✅ USSD flows work correctly
- ✅ Supabase integration functional
- ✅ Admin console accessible

## Support

For deployment assistance:
1. Check deployment docs: `DEPLOYMENT_QUICKSTART.md`
2. Review platform-specific guides in `docs/`
3. Test locally with `npm run dev` before deploying

---

**Status**: ✅ Repository is host-agnostic and ready for deployment on any platform.
