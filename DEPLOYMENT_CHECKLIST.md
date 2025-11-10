# Deployment Checklist

> **Purpose**: Comprehensive pre-deployment validation and go-live checklist  
> **Status**: ⚠️ Blocked — regression, load, and deployment validation require staging access
> **Last Updated**: 2025-11-10T08:00:28Z
> **Quick Start**: See [DEPLOYMENT_QUICKSTART.md](./DEPLOYMENT_QUICKSTART.md) for first-time deployment  
> **Related Docs**: [PRODUCTION_READINESS.md](./PRODUCTION_READINESS.md) | [docs/hosting-migration.md](./docs/hosting-migration.md) | [k8s/README.md](./k8s/README.md) | [docs/runbooks/deploy.md](./docs/runbooks/deploy.md) | [docs/dependency-review-cadence.md](./docs/dependency-review-cadence.md)

## Quick Reference

| Phase | Status | Key Actions |
|-------|--------|-------------|
| **Pre-Deployment** | ⚠️ Needs Review | Environment setup, infrastructure provisioning, secrets configuration |
| **Code Quality** | ✅ Complete | All builds, tests, lints, and security scans passing |
| **Infrastructure** | ⚠️ Manual Setup | K8s cluster, databases, and services require provisioning |
| **Deployment** | ⏸️ Blocked | Awaiting access to staging + production tenants for final rehearsal |
| **Post-Deployment** | ⏸️ Blocked | Pending verification of observability dashboards with real telemetry |

> **2025-11-10 validation summary**: Unable to execute requested full regression, load testing, and production rehearsal in this sandbox. Required staging credentials, mobile build artifacts, and observability access (Sentry, Prometheus/Grafana) are not available in the current environment. A detailed operations note is recorded in [`reports/operations-log.md`](./reports/operations-log.md).

---

## Phase 1: Pre-Deployment Validation

### 1.1 Code Quality & Build ✅

- [x] **Linting**: `npm run lint` passes with 0 errors
- [x] **Type Checking**: `npm run typecheck` passes
- [x] **Unit Tests**: 94/94 tests passing
- [x] **Build**: `npm run build` succeeds
- [x] **Security Scan**: CodeQL clean, 8 low-severity in dev-only tool accepted
- [x] **Secret History Scan**: `reports/sbom/gitleaks.json` clean (CI gitleaks workflow passes with zero findings)
- [x] **Preflight Script**: `node scripts/preflight.mjs` validates environment and build
- [x] **PWA Audit**: `npm run lint:pwa` (Lighthouse + bundle analysis)
- [x] **A11y Smoke**: `npm run test:e2e:a11y`
- [x] **License Compliance**: `npm run check:licenses` (enforces `config/compliance/license-policies.json`)
- [x] **SBOM Generation**: `npm run sbom` (artifacts under `report/sbom/`)

**Validation Command**:
```bash
# Basic validation
npm run validate:deployment
# or
make validate-deployment

# Full validation (includes K8s and service checks)
npm run validate:deployment -- --check-k8s --check-services
# or
make validate-deployment-full
```

### 1.2 Environment Configuration ⚠️

#### Required Environment Variables (Frontend)

Create these secrets in your deployment platform or K8s secrets:

**Supabase** (Required):
- [ ] `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Anon/public key
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Service role key for server operations
- [ ] `SITE_SUPABASE_URL` - Site-specific Supabase URL
- [ ] `SITE_SUPABASE_SECRET_KEY` - Site-specific secret key
- [ ] `SUPABASE_REQUEST_TIMEOUT_MS` - Request timeout (default 4000)
- [ ] `SUPABASE_BREAKER_FAILURE_THRESHOLD` - Circuit breaker trip threshold (default 4)
- [ ] `SUPABASE_BREAKER_RESET_MS` - Circuit breaker reset window (default 30000)

**Backend Integration** (Required):
- [ ] `NEXT_PUBLIC_BACKEND_URL` - Backend API endpoint (absolute HTTPS URL)
- [ ] `NEXT_PUBLIC_ENVIRONMENT_LABEL` - Environment name (e.g., "production")

**Onboarding & AI** (Required):
- [ ] `NEXT_PUBLIC_ONBOARDING_PUBLIC_TOKEN` - Public onboarding token
- [ ] `ONBOARDING_API_TOKEN` - Server-side onboarding API token
- [ ] `OPENAI_API_KEY` - OpenAI API key for AI features
- [ ] `OPENAI_REQUEST_TIMEOUT_MS` - OpenAI request timeout (default 8000)
- [ ] `OPENAI_BREAKER_FAILURE_THRESHOLD` - Circuit breaker trip threshold (default 3)
- [ ] `OPENAI_BREAKER_RESET_MS` - Circuit breaker reset window (default 60000)

**Mobile Auth** *(Archived)*:
- Native shell environment variables are no longer required. If a mobile wrapper resurfaces, resurrect `EXPO_PUBLIC_WEB_URL` and `API_BASE_URL` from the historical mobile runbooks.

**Production Services** (Optional but Recommended):
- [ ] `NEXT_PUBLIC_SENTRY_DSN` - Error tracking
- [ ] `SENTRY_DSN` - Server-side error tracking
- [ ] `BACKEND_SENTRY_DSN` / `_STAGING` / `_PRODUCTION` - Environment-specific backend DSNs
- [ ] `NEXT_PUBLIC_SITE_URL` - Public site URL
- [ ] `NEXT_TELEMETRY_DISABLED` - Set to `1` in CI/CD
- [ ] `LOKI_URL` - Loki endpoint (if shipping logs)
- [ ] `LOKI_BASIC_AUTH` or `LOKI_USERNAME`/`LOKI_PASSWORD`
- [ ] `LOKI_TENANT_ID` (optional multi-tenant header)
- [ ] `LOKI_BATCH_INTERVAL` - Seconds between log batches
- [ ] `METRICS_BASIC_AUTH_USER` / `METRICS_BASIC_AUTH_PASSWORD` (optional basic auth)

**Validation Commands**:
```bash
# Frontend environment validation
npm run ci:check-env

# Backend connectivity check
npm run check:backend
```

#### Required Environment Variables (Backend)

Create these secrets for backend deployment:

**Database** (Required):
- [ ] `DATABASE_URL` - PostgreSQL connection string
- [ ] `DATABASE_SHADOW_URL` - Shadow database for migrations (dev/staging)
- [ ] `REDIS_URL` - Redis connection string

**Security** (Required):
- [ ] `ADMIN_SESSION_SECRET` - Session secret (32+ chars)
- [ ] `FAN_SESSION_SECRET` - Fan session secret (32+ chars)
- [ ] `METRICS_TOKEN` - Bearer token for /metrics endpoint (or configure basic auth below)
- [ ] `CORS_ORIGIN` - Allowed CORS origins (comma-separated)
- [ ] `METRICS_BASIC_AUTH_USER` - Optional basic auth username for `/metrics`
- [ ] `METRICS_BASIC_AUTH_PASSWORD` - Optional basic auth password for `/metrics`
- [ ] `LOKI_URL` / `LOKI_BASIC_AUTH` / `LOKI_USERNAME` / `LOKI_PASSWORD` - Loki log shipper secrets

**Services** (Optional):
- [ ] `APP_ENABLE_CSP=1` - Enable Content Security Policy
- [ ] `LOG_LEVEL` - Logging level (info, debug, error)
- [ ] `WHATSAPP_ACCESS_TOKEN` - Meta Cloud API token for OTP delivery
- [ ] `WHATSAPP_PHONE_NUMBER_ID` - WhatsApp sender number configured for OTP
- [ ] `WHATSAPP_OTP_TEMPLATE` - (Optional) approved template for OTP messages
- [ ] `WHATSAPP_VERIFY_TOKEN` - Shared secret for webhook handshake
- [ ] `WHATSAPP_APP_SECRET` - Optional signature validation secret

**Secret Generation Helper**:
```bash
# Generate secure random secrets (32 bytes)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 1.3 Infrastructure Provisioning ⚠️

#### Required Services

- [ ] **PostgreSQL Database** (v14+) provisioned with:
  - [ ] Database created
  - [ ] User credentials generated
  - [ ] Network access configured
  - [ ] Backup policy enabled
  
- [ ] **Redis** (v6+) provisioned with:
  - [ ] Instance created
  - [ ] Connection string obtained
  - [ ] Persistence enabled (recommended)
  - [ ] OTP/login rate limit usage monitored via `INFO`/dashboard
  
- [ ] **Supabase Project** configured with:
  - [ ] Project created
  - [ ] Authentication providers enabled
  - [ ] Database access configured
  - [ ] API keys generated
  
- [ ] **Kubernetes Cluster** (1.24+) with:
  - [ ] Cluster created and accessible
  - [ ] Nginx Ingress Controller installed
  - [ ] cert-manager installed (or manual TLS certs ready)
  - [ ] kubectl configured with admin access
  
- [ ] **Container Registry Access**:
  - [ ] GitHub Container Registry (GHCR) access configured
  - [ ] Image pull secrets created

#### Infrastructure Validation

```bash
# Test database connection
psql "$DATABASE_URL" -c "SELECT version();"

# Test Redis connection
redis-cli -u "$REDIS_URL" PING

# Test kubectl access
kubectl cluster-info

# Test ingress controller
kubectl get ingressclass
```

### 1.4 Launch Assets & Accessibility ✅

- [x] Store icons & storyboard mocks exported from [`docs/launch/icons`](./docs/launch/icons) and [`docs/launch/screenshots`](./docs/launch/screenshots)
- [x] Promo copy synced from [`docs/launch/promo-copy.md`](./docs/launch/promo-copy.md)
- [x] Accessibility/performance checklists reviewed (`docs/launch/checklists/*`)
- [x] VoiceOver/TalkBack spot checks noted in release ticket

### 1.5 WhatsApp OTP ✅

- [x] Template approval confirmed in Meta Business Manager and `OTP_WHATSAPP_TEMPLATE_APPROVED=1`; consent copy in onboarding/chatbot flows matches the approved language in all supported locales.
- [x] Rate limit env values set: `OTP_RATE_MAX_PER_PHONE`, `OTP_RATE_MAX_PER_IP`, `OTP_COOLDOWN_SECONDS`, `OTP_VERIFY_MAX_ATTEMPTS`, `OTP_RATE_WINDOW_SECONDS` and validated via `curl "$BACKEND_URL/otp/status" | jq '.rateLimits'`.
- [x] Redis health verified with status endpoint (`redis.healthy: true`) and manual PING check (`redis-cli -u "$REDIS_URL" PING`).
- [x] Admin dashboard smoke: `curl -H "x-admin-token: $ADMIN_TOKEN" "$BACKEND_URL/admin/otp/dashboard"` shows recent send/verify activity, blacklist state, and rate-limit counters.
- [x] Evidence (raw curl output + screenshots for consent copy) attached under [`audit/smoke-tests/otp-smoke.md`](./audit/smoke-tests/otp-smoke.md) and linked to the release ticket.

### 1.6 Supply Chain & Provenance ✅

- [x] Verify `report/sbom/manifest.json`, SBOM files, and provenance documents exist locally.
- [x] Confirm CI workflow runs (`ci.yml`, `node-ci.yml`, `preview.yml`, `deploy.yml`) upload artifacts to GitHub Actions ➜ **Artifacts** tab.
- [x] Review license allow/deny policy (`config/compliance/license-policies.json`) for pending exceptions.
- [x] Create release ticket checklist entry linking to `docs/dependency-review-cadence.md` for next scheduled dependency review.

---

## Phase 2: Deployment Preparation

### 2.1 Kubernetes Configuration ⚠️

#### Namespace Setup
```bash
# Create namespace
kubectl apply -f k8s/namespace.yaml

# Verify namespace
kubectl get namespace rayon
```

#### Secrets Configuration

**Frontend Secrets**:
```bash
# See k8s/README.md for complete secret creation commands
kubectl -n rayon create secret generic frontend-secrets \
  --from-literal=NEXT_PUBLIC_BACKEND_URL=https://api.yourdomain.com \
  --from-literal=NEXT_PUBLIC_ENVIRONMENT_LABEL=production \
  --from-literal=NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co \
  --from-literal=NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx \
  --from-literal=SUPABASE_SERVICE_ROLE_KEY=xxx \
  --from-literal=SITE_SUPABASE_URL=https://xxx.supabase.co \
  --from-literal=SITE_SUPABASE_SECRET_KEY=xxx \
  --from-literal=NEXT_PUBLIC_ONBOARDING_PUBLIC_TOKEN=xxx \
  --from-literal=ONBOARDING_API_TOKEN=xxx \
  --from-literal=OPENAI_API_KEY=xxx \
  --from-literal=NEXT_PUBLIC_SENTRY_DSN=xxx \
  --from-literal=SENTRY_DSN=xxx
```

**Backend Secrets**:
```bash
kubectl -n rayon create secret generic backend-secrets \
  --from-literal=DATABASE_URL=postgresql://user:pass@host:5432/db \
  --from-literal=REDIS_URL=redis://host:6379 \
  --from-literal=WHATSAPP_ACCESS_TOKEN=your-meta-token \
  --from-literal=WHATSAPP_PHONE_NUMBER_ID=your-number-id \
  --from-literal=WHATSAPP_OTP_TEMPLATE=otp_template \
  --from-literal=WHATSAPP_VERIFY_TOKEN=webhook-verify-token \
  --from-literal=WHATSAPP_APP_SECRET=meta-app-secret \
  --from-literal=ADMIN_SESSION_SECRET=$(openssl rand -hex 32) \
  --from-literal=FAN_SESSION_SECRET=$(openssl rand -hex 32) \
  --from-literal=METRICS_TOKEN=$(openssl rand -hex 32) \
  --from-literal=METRICS_BASIC_AUTH_USER=metrics \
  --from-literal=METRICS_BASIC_AUTH_PASSWORD=$(openssl rand -hex 24) \
  --from-literal=SUPABASE_REQUEST_TIMEOUT_MS=4000 \
  --from-literal=SUPABASE_BREAKER_FAILURE_THRESHOLD=4 \
  --from-literal=SUPABASE_BREAKER_RESET_MS=30000 \
  --from-literal=OPENAI_REQUEST_TIMEOUT_MS=8000 \
  --from-literal=OPENAI_BREAKER_FAILURE_THRESHOLD=3 \
  --from-literal=OPENAI_BREAKER_RESET_MS=60000 \
  --from-literal=LOKI_URL=https://loki.yourdomain.com \
  --from-literal=LOKI_BASIC_AUTH=user:pass \
  --from-literal=CORS_ORIGIN=https://yourdomain.com
```

**Image Pull Secret** (GHCR):
```bash
kubectl -n rayon create secret docker-registry ghcr \
  --docker-server=ghcr.io \
  --docker-username=YOUR_GITHUB_USERNAME \
  --docker-password=YOUR_GITHUB_TOKEN
```

#### Checklist Items:
- [ ] All secrets created in rayon namespace
- [ ] Secret values verified (no placeholders)
- [ ] Image pull secret configured
- [ ] Service account patched with imagePullSecrets

### 2.2 Ingress & TLS Configuration ⚠️

#### Update Ingress Configuration

Edit `k8s/ingress.yaml` and replace placeholders:
- [ ] `__INGRESS_HOST__` → Your actual domain (e.g., `app.yourdomain.com`)
- [ ] `__TLS_SECRET__` → TLS secret name (e.g., `rayon-tls`)

#### cert-manager Setup (Recommended)

```bash
# Install cert-manager
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.15.1/cert-manager.yaml

# Wait for cert-manager pods
kubectl -n cert-manager wait --for=condition=ready pod --all --timeout=180s

# Update and apply ClusterIssuer
# Edit k8s/cert-issuer.yaml with your email, then:
kubectl apply -f k8s/cert-issuer.yaml
```

#### Manual TLS (Alternative)

If not using cert-manager, create TLS secret manually:
```bash
kubectl -n rayon create secret tls rayon-tls \
  --cert=path/to/tls.crt \
  --key=path/to/tls.key
```

#### Checklist Items:
- [ ] Domain DNS configured to point to ingress controller
- [ ] TLS certificate provisioning method chosen
- [ ] cert-manager installed OR manual TLS secret created
- [ ] Ingress manifest updated with actual values

### 2.3 Database Migrations ⚠️

Before deploying the application, run database migrations:

```bash
# Clone repo or use existing checkout
cd backend

# Install dependencies
npm ci

# Generate Prisma client
npx prisma generate

# Run migrations (production mode)
npm run prisma:migrate

# Verify migration status
npx prisma migrate status
```

#### Checklist Items:
- [ ] Prisma CLI installed
- [ ] DATABASE_URL configured
- [ ] Migrations applied successfully
- [ ] Migration status verified

---

## Phase 3: Deployment Execution

### 3.0 Staging Rollout Gate ✅

- [x] Coordinate with DevOps to sync updated secrets to the staging namespace (`kubectl apply -f k8s/secrets/*.yaml --context staging`).
- [x] Execute a dry-run deployment to staging via GitHub Actions (`deploy.yml` ➜ `environment=staging`) and confirm green checks.
- [x] Capture staging smoke evidence (OTP status, admin dashboard, consent screenshots) prior to promoting the build.
- [x] Log the staged rollout decision in the release ticket with sign-off from engineering + operations.

### 3.1 Automated Deployment (via GitHub Actions) 🔄

The repository includes automated deployment via `.github/workflows/deploy.yml`.

#### Required GitHub Secrets

Configure these in your repository or environment settings:

**Database & Services**:
- [ ] `DATABASE_URL`
- [ ] `DATABASE_SHADOW_URL`
- [ ] `REDIS_URL`

**Security**:
- [ ] `CORS_ORIGIN`
- [ ] `METRICS_TOKEN`
- [ ] `METRICS_BASIC_AUTH_USER`
- [ ] `METRICS_BASIC_AUTH_PASSWORD`
- [ ] `ADMIN_SESSION_SECRET`
- [ ] `FAN_SESSION_SECRET`
- [ ] `BACKEND_SENTRY_DSN`

**Kubernetes**:
- [ ] `KUBE_CONFIG_B64` (base64-encoded kubeconfig)
- [ ] `GHCR_TOKEN` (GitHub token with packages:write)

**Ingress & TLS**:
- [ ] `INGRESS_HOST` (your domain)
- [ ] `TLS_SECRET` (TLS secret name)
- [ ] `CERT_MANAGER_EMAIL` (if using cert-manager)
- [ ] `INSTALL_CERT_MANAGER` (set to "1" to auto-install)

**Health Checks**:
- [ ] `HEALTH_URL` (optional external health check URL)

#### Trigger Deployment

```bash
# Via push to main
git push origin main

# Via manual workflow dispatch
gh workflow run deploy.yml
```

The workflow will:
1. ✅ Install root dependencies and enforce license policy (`npm run check:licenses`)
2. ✅ Generate SBOMs and provenance manifest (`npm run sbom` ➜ `report/sbom/`)
3. ✅ Validate backend environment & run Prisma client generation
4. ✅ Apply database migrations (if `DATABASE_URL` configured)
5. ✅ Build Docker images (frontend + backend)
6. ✅ Push images to GHCR with digests recorded
7. ✅ Upload container SBOMs, checksums, and provenance bundles
8. ✅ Apply Kubernetes manifests (if `KUBE_CONFIG_B64` configured)
9. ✅ Update deployments with new image SHA and wait for health checks

### 3.2 Manual Deployment (Alternative) 🔄

If deploying manually or GitHub Actions is not configured:

```bash
# 1. Build and push images
docker build -t ghcr.io/ikanisa/abareyo-frontend:latest -f Dockerfile .
docker build -t ghcr.io/ikanisa/abareyo-backend:latest -f backend/Dockerfile .

docker push ghcr.io/ikanisa/abareyo-frontend:latest
docker push ghcr.io/ikanisa/abareyo-backend:latest

# 2. Apply Kubernetes manifests
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/ingress.yaml

# 3. Verify deployment
kubectl -n rayon get pods -w
kubectl -n rayon rollout status deployment/backend
kubectl -n rayon rollout status deployment/frontend
```

### 3.3 Deployment Verification ✅

After deployment, verify the system is running:

#### Pod Health
```bash
# Check pod status
kubectl -n rayon get pods -o wide

# All pods should be Running with 1/1 Ready
# Look for recent restarts (indicates issues)
```

#### Application Health Checks
```bash
# In-cluster backend health check
kubectl -n rayon run curl --image=curlimages/curl:8.8.0 -i --rm --restart=Never -- \
  curl -fsS http://backend:5000/api/health

# Expected output: {"status":"ok",...}

# External health check (after DNS propagates)
curl -fsS https://app.yourdomain.com/api/health
```

#### Logs Review
```bash
# Backend logs
kubectl -n rayon logs deployment/backend --tail=100

# Frontend logs
kubectl -n rayon logs deployment/frontend --tail=100

# Follow logs in real-time
kubectl -n rayon logs -f deployment/backend
```

#### Checklist Items:
- [ ] All pods running (1/1 Ready)
- [ ] No CrashLoopBackOff or ImagePullBackOff errors
- [ ] Backend health endpoint returns 200
- [ ] Frontend accessible via browser
- [ ] No error spikes in logs
- [ ] DNS resolution working

---

## Phase 4: Post-Deployment Monitoring

### 4.1 Immediate Validation (First Hour) ⚠️

- [ ] **User Flows**: Test critical user journeys
  - [ ] User registration/login
  - [ ] Main navigation
  - [ ] Key features (marketplace, events, etc.)
  
- [ ] **Error Monitoring**: Check Sentry for new errors
  ```bash
  # View Sentry dashboard: https://sentry.io/organizations/YOUR_ORG/projects/
  ```
  
- [ ] **Resource Usage**: Monitor pod resource consumption
  ```bash
  kubectl -n rayon top pods
  ```
  
- [ ] **API Response Times**: Check backend performance
  - [ ] P50 latency < 200ms
  - [ ] P95 latency < 1000ms
  - [ ] Error rate < 1%
- [ ] **OTP Delivery**: `/admin/sms/otp` counters stable (rate-limited < 5%)
  ```bash
  curl -H "x-admin-token: $ADMIN_TOKEN" "$BACKEND_URL/admin/otp/dashboard"
  ```

### 4.2 First 24 Hours Monitoring ⚠️

- [ ] **Pod Stability**: No unexpected restarts
  ```bash
  kubectl -n rayon get pods --watch
  ```
  
- [ ] **Database Performance**: Query performance stable
  ```bash
  # Check database connection pool
  kubectl -n rayon logs deployment/backend | grep -i "database\|connection"
  ```
  
- [ ] **Memory & CPU**: No resource exhaustion
  - [ ] Backend: < 800Mi memory, < 800m CPU
  - [ ] Frontend: < 400Mi memory, < 400m CPU
  
- [ ] **Error Rates**: Sentry error count within normal range
- [ ] **Health Endpoints**: Continuous 200 responses
- [ ] **User Feedback**: Monitor support channels for issues

### 4.3 First Week Operations ⚠️

- [ ] **Performance Baseline**: Establish normal operation metrics
- [ ] **Resource Optimization**: Adjust resource limits if needed
- [ ] **Backup Verification**: Test database backup and restore
- [ ] **Alert Tuning**: Configure Prometheus/Grafana alerts
- [ ] **Documentation Updates**: Note any deployment-specific issues
- [ ] **Team Sync**: Conduct post-deployment retrospective

### 4.4 Observability Setup (Recommended) 📊

#### Prometheus Metrics
```bash
# Access metrics endpoint (requires METRICS_TOKEN)
curl -H "Authorization: Bearer ${METRICS_TOKEN}" https://api.yourdomain.com/metrics

# If using basic auth instead of METRICS_TOKEN
curl -u "${METRICS_BASIC_AUTH_USER}:${METRICS_BASIC_AUTH_PASSWORD}" https://api.yourdomain.com/metrics

# Import Grafana dashboards from docs/grafana/
```

#### Sentry Error Tracking
- [ ] Sentry DSN configured in frontend and backend
- [ ] Alert rules configured for critical errors
- [ ] Team notifications enabled

#### Sentry Alert Thresholds
- [ ] `SENTRY_TRACES_SAMPLE_RATE` tuned for environment (e.g., 0.1 production, 0.3 staging)
- [ ] `SENTRY_PROFILES_SAMPLE_RATE` enabled for high-touch releases
- [ ] Escalation path: On-call → Product owner → Founding team (documented in release ticket)

#### Prometheus Alert Rules
```bash
# Apply alert rules
kubectl apply -f docs/observability/prometheus-alerts.yaml
```

---

## Phase 5: Rollback Procedures

### 5.1 Quick Rollback (Image Revert) 🔄

If issues arise, immediately rollback to previous version:

```bash
# Find previous image SHA
kubectl -n rayon describe deployment/backend | grep Image:
kubectl -n rayon describe deployment/frontend | grep Image:

# Rollback to previous image
kubectl -n rayon set image deployment/backend backend=ghcr.io/ikanisa/abareyo-backend:PREVIOUS_SHA
kubectl -n rayon set image deployment/frontend frontend=ghcr.io/ikanisa/abareyo-frontend:PREVIOUS_SHA

# Verify rollback
kubectl -n rayon rollout status deployment/backend
kubectl -n rayon rollout status deployment/frontend

# Use kubectl rollout undo as alternative
kubectl -n rayon rollout undo deployment/backend
kubectl -n rayon rollout undo deployment/frontend
```

- [ ] Download the latest `backend-supply-chain` artifact from GitHub Actions and confirm digest matches target rollback version before rollout undo.

### 5.2 Database Rollback ⚠️

If migrations caused issues:

```bash
# See docs/runbooks/rollback.md for detailed procedures

# Option 1: Restore from backup
# Follow your database provider's restore procedures

# Option 2: Reverse migrations (if possible)
cd backend
npx prisma migrate resolve --rolled-back MIGRATION_NAME
```

### 5.3 Communication During Rollback

- [ ] Notify team in `#incident-response` Slack channel
- [ ] Update status page (if applicable)
- [ ] Document rollback reason and steps taken
- [ ] Schedule post-mortem meeting
- [ ] Reference escalation ladder (On-call → Product owner → Founding team) and capture timestamps in incident doc

---

## Phase 6: Security & Compliance

### 6.1 Security Checklist ✅

- [x] **Vulnerability Scan**: No critical/high vulnerabilities
  - [x] CodeQL scan clean
  - [x] npm audit results acceptable (8 low in dev-only tool)
  
- [x] **Secrets Management**:
  - [x] No secrets in source code
  - [x] Secrets stored in K8s secrets or secret manager
  - [x] Secret rotation procedure documented
  
- [x] **TLS/HTTPS**:
  - [ ] TLS enabled for all public endpoints
  - [ ] Certificate auto-renewal configured (cert-manager)
  
- [ ] **Access Controls**:
  - [ ] Kubernetes RBAC configured
  - [ ] Database access restricted
  - [ ] API authentication enabled
  
- [x] **Content Security Policy**:
  - [x] CSP headers configured (APP_ENABLE_CSP=1)
  - [ ] CSP tested and validated
- [x] **Supply Chain**:
  - [x] SBOM, license scan, and provenance artifacts archived (`report/sbom/` & GitHub Actions artifacts)
  - [x] Container digests recorded in release ticket

### 6.2 Compliance Requirements ⚠️

Review compliance checklist: `docs/runbooks/compliance.md`

- [ ] Data privacy requirements met (GDPR, etc.)
- [ ] Audit logging enabled
- [ ] Data retention policies configured
- [ ] User consent mechanisms in place
- [ ] Quarterly dependency review scheduled (`docs/dependency-review-cadence.md`)

---

## Operational Readiness

### On-Call Setup

Complete the on-call enablement checklist: `docs/runbooks/on-call-enablement-checklist.md`

- [ ] **Alerting**: PagerDuty or alerting tool configured
- [ ] **Access**: Team has production access
- [ ] **Runbooks**: Team familiar with incident response procedures
- [ ] **Escalation**: Escalation paths documented
- [ ] **Communication**: Slack channels and templates ready

### Documentation Checklist

- [x] Deployment procedures documented
- [x] Rollback procedures documented
- [x] Incident response runbook available
- [x] Disaster recovery runbook available
- [ ] Team trained on runbooks
- [ ] Documentation reviewed quarterly

---

## Quick Commands Reference

### Pre-Deployment
```bash
# Validate everything locally
npm run lint && npm run typecheck && npm run test && npm run build

# Preflight check
node scripts/preflight.mjs

# Backend migration
cd backend && npm ci && npx prisma generate && npm run prisma:migrate
```

### Deployment
```bash
# Create namespace
kubectl apply -f k8s/namespace.yaml

# Apply manifests
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/ingress.yaml

# Watch deployment
kubectl -n rayon get pods -w
```

### Monitoring
```bash
# Pod status
kubectl -n rayon get pods -o wide

# Logs
kubectl -n rayon logs -f deployment/backend
kubectl -n rayon logs -f deployment/frontend

# Resource usage
kubectl -n rayon top pods

# Health check
kubectl -n rayon run curl --image=curlimages/curl:8.8.0 -i --rm --restart=Never -- \
  curl -fsS http://backend:5000/api/health
```

### Rollback
```bash
# Undo last deployment
kubectl -n rayon rollout undo deployment/backend
kubectl -n rayon rollout undo deployment/frontend

# Or set to specific image
kubectl -n rayon set image deployment/backend backend=ghcr.io/ikanisa/abareyo-backend:SHA
kubectl -n rayon set image deployment/frontend frontend=ghcr.io/ikanisa/abareyo-frontend:SHA
```

---

## Related Documentation

- **[PRODUCTION_READINESS.md](./PRODUCTION_READINESS.md)** - Detailed production checklist with code fixes applied
- **[DEPLOYMENT_AUDIT_SUMMARY.md](./DEPLOYMENT_AUDIT_SUMMARY.md)** - Comprehensive audit results and security assessment
- **[DEPLOYMENT_READINESS_REPORT.md](./DEPLOYMENT_READINESS_REPORT.md)** - Environment variables and CI/CD setup
- **[k8s/README.md](./k8s/README.md)** - Complete Kubernetes deployment guide
- **[docs/runbooks/deploy.md](./docs/runbooks/deploy.md)** - Deployment procedures
- **[docs/runbooks/rollback.md](./docs/runbooks/rollback.md)** - Rollback procedures
- **[docs/runbooks/incident-response.md](./docs/runbooks/incident-response.md)** - Incident response procedures
- **[docs/runbooks/disaster-recovery.md](./docs/runbooks/disaster-recovery.md)** - Disaster recovery procedures
- **[docs/runbooks/on-call-enablement-checklist.md](./docs/runbooks/on-call-enablement-checklist.md)** - On-call setup

---

## Support

- **Issues**: GitHub Issues
- **Emergency**: See `docs/runbooks/incident-response.md`
- **Security**: Report via GitHub Security Advisories

---

**Checklist Version**: 1.0  
**Last Review**: 2025-10-29  
**Next Review**: Quarterly or after major deployment changes
