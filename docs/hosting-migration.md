# Hosting Migration Playbook

This guide captures the migration away from Vercel- and Render-specific
positioning to a fully host-agnostic deployment model. Use it as the single
source of truth when auditing future changes or onboarding new platform teams.

## 1. Cleanup Summary

| Area | Action | Notes |
| --- | --- | --- |
| Configuration | ✅ Confirmed there is no `vercel.json`, `render.yaml`, or provider directories checked into the repo. | The `next.config.mjs` file and `middleware.ts` now express all routing logic in a portable way. |
| Dependencies | ✅ Verified that `package.json` does not depend on `@vercel/*` or Render SDKs. | The remaining Sentry packages are framework-agnostic and required by the monitoring stack. |
| Secrets | ✅ Removed all `VERCEL_*` / `RENDER_*` variables from documentation and `.env` samples. | `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_BACKEND_URL`, Supabase keys, `REDIS_URL`, and WhatsApp OTP tokens (`WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_OTP_TEMPLATE`) are the canonical host-independent inputs now tracked in secret managers. |
| Documentation | ✅ Scrubbed provider marketing language from deployment checklists, cron runbooks, and Supabase guides. | Each updated document now links back to this playbook for platform guidance. |
| CI/CD | ✅ Confirmed no workflows target Vercel or Render. | Use Docker/Kubernetes workflows or any generic Node.js host going forward. |

## 2. Replacements & Migrations

### 2.1 Scheduled Workloads

Scheduled jobs previously pitched as "Vercel cron" or "Render cron" are now
handled via host-neutral options:

- **Primary** – `scripts/reports/report-schedule-worker.ts` runs as a long-lived
  process (Kubernetes CronJob, Fly.io app, GitHub Actions schedule, etc.).
- **Database-native** – Supabase `pg_cron` remains available for light SQL
  maintenance tasks.
- **External orchestrators** – When the platform of choice lacks scheduling,
  rely on Cronhub, EasyCron, or similar hosted schedulers that make HTTPS calls
  into the worker.

> **TODO:** When porting any remaining provider-specific cron triggers, capture
> the replacement (GitHub Actions, Supabase `pg_cron`, or containerized worker)
> in the owning runbook and cross-link this document.

### 2.2 Rewrites, Redirects, and Headers

Legacy rewrites from `vercel.json` are represented directly in the framework:

- **Rewrites & Redirects** – Implement in `next.config.mjs` using the
  `rewrites()` / `redirects()` hooks. None are required today, but this is the
  sanctioned location for future changes.
- **Headers** – Global security headers are already centralized in
  `config/security-headers.mjs` and applied through `next.config.mjs`.
- **Dynamic Logic** – Reach for `middleware.ts` when rewrites depend on runtime
  conditions (user agent detection, locale negotiation, etc.).

> **TODO:** Audit historical `vercel.json` snippets (if discovered in earlier PRs)
> and re-implement them with Next.js middleware or the config hooks above. Track
> the outcome in the architecture docs (new ADR or routing note) if a
> non-trivial flow is restored.

### 2.3 Observability & Guards

The `scripts/host_agnostic_guard.ts` script protects against regressions by
failing CI when provider-specific identifiers appear. Run it locally with
`npx tsx scripts/host_agnostic_guard.ts` when reviewing third-party
contributions.

## 3. Future Guidance

1. **Design for containers first.** Build Docker images or Kubernetes manifests
   as the baseline, then adapt to platforms that support them (Fly.io, Railway,
   Render, AWS ECS, etc.).
2. **Document platform choices.** When a team selects a hosting provider,
   capture the decision in an ADR and reference this playbook so future
   migrations remain lightweight.
3. **Keep secrets generic.** Prefer neutral names (`SITE_*`, `NEXT_PUBLIC_*`) so
   environment migrations require only value changes, not code edits.
4. **Automate enforcement.** Extend the guard script allow/deny lists instead of
   relying on manual review for provider drift.
5. **Centralize cron/middleware behavior.** Whenever a new scheduled task or
   rewrite ships, add a short note here with the owning team and runtime to keep
   the inventory current.

## 4. Verification Checklist

- [x] `npm run build`
- [x] `npm run lint`
- [x] `npx tsx scripts/host_agnostic_guard.ts`
- [x] Scheduled worker smoke-tested via `npm run reports:worker`

Re-run the checklist whenever infrastructure decisions change to ensure the
platform stays portable.
