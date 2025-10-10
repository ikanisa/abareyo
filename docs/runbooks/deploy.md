Deploy Runbook (Containers + Migrations)

Images

- CI builds and pushes images to GHCR:
  - Frontend: ghcr.io/<org>/<repo>-frontend:latest and :<SHA>
  - Backend: ghcr.io/<org>/<repo>-backend:latest and :<SHA>

Database migrations

1. Ensure DATABASE_URL and REDIS_URL are set in the runtime environment.
2. Run migrate deploy before switching traffic:

   cd backend
   npm ci
   npx prisma generate
   npm run prisma:migrate

Kubernetes (example)

- Files under k8s/ provide a starting point for deployments and services.
- Replace image tags with your desired version (e.g., :<SHA>), set envs via ConfigMap/Secrets.

Health

- Backend: /api/health should return 200.
- Metrics: /metrics requires Authorization: Bearer <METRICS_TOKEN> in production.

Rollback

1. Revert to previous image tags in the Deployment.
2. If the DB migration is incompatible, follow docs/runbooks/rollback.md to restore the database.

