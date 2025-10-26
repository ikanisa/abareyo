# Phase 5 – CI/CD & Environment Hardening (Status: Oct 18 2025)

## CI status
- `.github/workflows/ci.yml` already runs lint, type-check, unit tests, and Playwright smokes on push/PR.
- `.github/workflows/supabase-deploy.yml` pushes DB migrations and deploys all edge functions on `main` using `supabase link` and `supabase db push`.
- `.github/workflows/deploy.yml` builds Docker images, runs Prisma migrations, and applies Kubernetes manifests (env-driven).

## Gaps to close
1. **Dry-run migrations** – `supabase db push --dry-run` fails without the Supabase database password. In CI, supply `SUPABASE_DB_PASSWORD` (or prepend `--db-url`) so dry-run validation runs before real deploys.
2. **Edge function deploy gating** – Supabase CLI requires elevated API token. Ensure `SUPABASE_ACCESS_TOKEN` has deploy scope and rotate from vault map.
3. **Staged approvals** – Current workflows deploy on push to `main`. Add manual approvals or environment protection for staging → production, and ensure migrations run on staging before production.
4. **Environment alignment** – Update hosting platform envs (`NEXT_PUBLIC_BACKEND_URL`, Supabase keys) to reflect `paysnhuxngsvzdpwlosv`. Confirm Production/Preview/Development match the vault map.
5. **Rollback procedure** – Document how to revert to previous Docker tags (`kubectl rollout undo`) and restore Supabase backups.

## Action items
- Add `SUPABASE_DB_PASSWORD` secret to GitHub → `supabase db push --dry-run --db-url ...` in CI.
- Require manual review/approval in GitHub environments for production deployments.
- Update runbooks with staged deployment flow and rollback steps.
- Verify hosting platform envs (NEXT_PUBLIC_SUPABASE_URL, publishable key, backend URL) match production project.
- Coordinate with Supabase to confirm `SUPABASE_ACCESS_TOKEN` has necessary scopes for edge deploy.
