# Cron & Scheduling Notes

The project previously relied on Vercel for scheduled tasks, but no Vercel cron jobs were defined in `vercel.json` or GitHub workflows. To keep scheduled automation platform-agnostic, use one of the following approaches:

## 1. Supabase pg_cron

Supabase Pro plans expose `pg_cron`, which can run SQL or call HTTP endpoints on a schedule. Recommended for database maintenance, digests, and periodic clean-up jobs referenced in the Supabase runbooks under `docs/supabase/`.

## 2. Supabase Edge Functions Scheduler

If you upgrade Supabase, the Scheduler UI can invoke edge functions (e.g., `sms-webhook`, `issue-policy`) on cron expressions. Configure schedules via the Supabase dashboard or CLI and store secrets with `supabase secrets set`.

## 3. GitHub Actions

For jobs that only need repo access (report generation, cache pruning), create a workflow with `on:
  schedule:`. Reuse the pnpm setup blocks from `.github/workflows/node-ci.yml` to share dependencies and run scripts like `pnpm build` or custom `tsx` commands.

## 4. Self-Hosted Alternatives

Teams operating outside Supabase Pro can run cron containers (e.g., Kubernetes CronJobs defined under `k8s/`) or systemd timers on edge nodes. Point them at the same API routes or supabase functions previously targeted by Vercel.

Document new schedules in this file or the relevant runbook (`docs/runbooks/operations.md`) to keep operational visibility now that Vercel automation has been removed.
