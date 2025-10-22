# Scheduling playbook

The project no longer relies on Vercel cron definitions. Report schedules
created through the admin UI are persisted in Supabase but still require an
execution runner to deliver reports on a cadence.

## Manual execution
- Run an ad-hoc Node.js script (for example `node tools/run-report.js`) that
  queries `report_schedules` and dispatches the necessary exports.
- Suitable for infrequent backfills or while verifying new schedule logic.

## `launchd` on macOS
- Create a `~/Library/LaunchAgents/com.rayon.reports.plist` definition that
  invokes the same Node.js runner on an interval using the `StartInterval`
  setting.
- Keep secrets in `.env.local` and load them via the `EnvironmentVariables`
  stanza to match local development expectations.

## Dedicated Node cron worker
- Deploy a lightweight worker (e.g. `node cron-worker.js`) using `node-cron` or
  a similar scheduler to poll Supabase and enqueue work.
- Host alongside the primary Next.js app (or on a separate process) so it can
  scale independently and avoid tying execution to Vercel's scheduled functions.

Until one of these options is wired up, report schedules remain informational
only. Follow the TODOs in the admin dashboard and API route when implementing a
runner so report creation triggers real jobs.
