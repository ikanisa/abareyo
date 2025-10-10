Rollback Runbook (Staging → Prod)

Database

1. Confirm automated backups exist for the target database (e.g., RDS snapshot). Note the snapshot identifier.
2. For schema-only changes: prefer `prisma migrate resolve --rolled-back` on the last migration and re-deploy.
3. For data-impacting changes: restore from snapshot to a new instance, then swap connection strings.

Application

1. Identify the previous healthy image/tag (from CI/CD history).
2. Roll back deployment to the previous image.
3. Verify `/metrics` and health endpoints. Watch error rate and p95.

Dry-run (staging)

1. Trigger this runbook end-to-end in staging.
2. Validate app and DB state within 15 minutes.
3. Record any manual steps or missing automation, then fix in CI/CD.

