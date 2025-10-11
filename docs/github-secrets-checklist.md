GitHub Actions Secrets — Checklist

Purpose
- Central list of secrets used by the Deploy workflow and optional Kubernetes automation.
- Add these in: GitHub → Repository → Settings → Secrets and variables → Actions → New repository secret.

Required (CI/CD + Backend)
- DATABASE_URL
  - Your Postgres connection string (use Supabase project URL).
  - Example: postgresql://postgres:<PASSWORD>@db.<ref>.supabase.co:5432/postgres
- REDIS_URL
  - Example: redis://default:<PASSWORD>@redis.example.com:6379/0
- CORS_ORIGIN
  - Comma-separated allowlist of browser origins. No wildcard in prod.
  - Example: https://app.example.com,https://admin.example.com
- METRICS_TOKEN
  - Random token to protect /metrics. Generate:
    - macOS/Linux: openssl rand -hex 32
    - PowerShell: [guid]::NewGuid().ToString("N") + [guid]::NewGuid().ToString("N")
- ADMIN_SESSION_SECRET
  - Random 32+ chars. Same generation as METRICS_TOKEN.
- FAN_SESSION_SECRET
  - Random 32+ chars.
- DATABASE_SHADOW_URL (optional)
  - Shadow DB for Prisma (often only for dev/staging).
- HEALTH_URL (optional)
  - Full URL for CI health probe after deploy. Example: https://app.example.com/api/health

Optional (Kubernetes Apply via CI)
- KUBE_CONFIG_B64
  - Base64-encoded kubeconfig to enable kubectl in CI.
  - macOS: base64 < ~/.kube/config | pbcopy
  - Linux: base64 -w0 < ~/.kube/config | xclip -sel clip
  - Windows PowerShell: [Convert]::ToBase64String([IO.File]::ReadAllBytes("$env:USERPROFILE\.kube\config"))
- GHCR_TOKEN
  - GitHub PAT used to create an in-cluster imagePullSecret for ghcr.io.
  - Minimum scope: read:packages (for pulling images).
- INSTALL_CERT_MANAGER
  - Set to 1 to auto-install cert-manager CRDs (optional).
- CERT_MANAGER_EMAIL
  - Email used by Let’s Encrypt ClusterIssuer.
- INGRESS_HOST
  - Public domain for the app (e.g., app.example.com). Point DNS to your ingress controller’s external IP.
- TLS_SECRET
  - Kubernetes Secret name for TLS cert (e.g., app-example-com-tls). Will be created/managed by cert-manager.

Where secrets are used
- Workflow env injection: .github/workflows/deploy.yml
  - DATABASE_URL, REDIS_URL, CORS_ORIGIN, METRICS_TOKEN, ADMIN_SESSION_SECRET, FAN_SESSION_SECRET, HEALTH_URL
  - Optional K8s: KUBE_CONFIG_B64, GHCR_TOKEN, INSTALL_CERT_MANAGER, CERT_MANAGER_EMAIL, INGRESS_HOST, TLS_SECRET

Verification
- Actions → Deploy run should show:
  - Validate required env: All required env vars present.
  - Run DB migrations (deploy): succeeds.
  - Prisma migrate status (post-deploy): database is up to date (or lists applied/pending).
  - Images built and pushed to ghcr.io/org/repo-frontend and ghcr.io/org/repo-backend.
  - If KUBE_CONFIG_B64 is set: manifests applied, deployments updated to current SHA, rollouts complete.

Notes
- Never commit real secrets to the repository. Use Actions secrets only.
- Backend enforces:
  - CORS allowlist in production (no wildcard).
  - METRICS_TOKEN required to access /metrics in production.
- Frontend is built for same-origin API calls; NEXT_PUBLIC_BACKEND_URL is set to /api at build time.

