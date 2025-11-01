# Scheduling playbook

Report automation is now backed by Supabase. Report schedules created through
the admin UI are stored in the `report_schedules` table and consumed by the
`scripts/reports/report-schedule-worker.ts` runner, which:

- polls for rows whose `next_run_at` is due,
- generates the requested CSV export from Supabase data,
- uploads the file to the `report-exports` storage bucket, and
- updates delivery metadata (`last_delivery_status`, `delivery_metadata`) for
  operators to inspect in the admin console.

## Running the worker locally

```bash
REPORT_WORKER_INTERVAL_MS=60000 \
REPORTS_STORAGE_BUCKET=report-exports \
SUPABASE_URL=... \
SUPABASE_SERVICE_ROLE_KEY=... \
npm run reports:worker
```

Environment variables:

- `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` (or the `SITE_` variants) – service
  role credentials with access to `report_schedules`, `fund_donations`, and
  storage buckets.
- `REPORT_WORKER_INTERVAL_MS` – poll cadence in milliseconds (defaults to
  60&nbsp;s).
- `REPORTS_STORAGE_BUCKET` – storage bucket used for CSV artifacts (defaults to
  `report-exports`).
- `REPORT_SIGNED_URL_TTL` – optional signed URL lifetime in seconds (defaults to
  24 hours).

The worker logs each delivery attempt (`report.schedule.delivered` or
`report.schedule.failed`). Failed runs retain the error in
`report_schedules.last_delivery_error` so operations can investigate. For
additional platform guidance (including cron migration notes), see the
[Hosting Migration Playbook](../docs/hosting-migration.md).

## Manual execution

- To backfill or validate a single schedule, set its `dispatch` flag via the
  admin UI when saving (this enqueues an immediate run) or update
  `next_run_at` manually in Supabase and let the worker pick it up.
- You can also invoke the worker once with `REPORT_WORKER_INTERVAL_MS=0` to run
  due jobs and exit.

## Production deployment

- Host the worker as a separate Node.js process (Fly.io, Railway, or a
  lightweight container) so it is not tied to platform-specific cron limits.
- Provide the same environment variables listed above plus networking access to
  Supabase.
- Monitor logs for `report.worker.poll_failed` to catch Supabase outages or
  misconfigured credentials.

> Tip: When targeting webhooks as the report destination, ensure the receiving
> endpoint returns a `2xx` status. The worker records non-success responses as
> failures and will include the message in `last_delivery_error`.
