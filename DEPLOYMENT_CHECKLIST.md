# Deployment Checklist

> **Purpose**: Comprehensive pre-deployment validation and go-live checklist  
> **Status**: Production-Ready - All critical issues resolved  
> **Last Updated**: 2025-10-29  
> **Quick Start**: See [DEPLOYMENT_QUICKSTART.md](./DEPLOYMENT_QUICKSTART.md) for first-time deployment  
> **Related Docs**: [PRODUCTION_READINESS.md](./PRODUCTION_READINESS.md) | [docs/hosting-migration.md](./docs/hosting-migration.md) | [k8s/README.md](./k8s/README.md) | [docs/runbooks/deploy.md](./docs/runbooks/deploy.md)

## Quick Reference

| Phase | Status | Key Actions |
|-------|--------|-------------|
| **Pre-Deployment** | ⚠️ Needs Review | Environment setup, infrastructure provisioning, secrets configuration |
| **Code Quality** | ✅ Complete | All builds, tests, lints, and security scans passing |
| **Infrastructure** | ⚠️ Manual Setup | K8s cluster, databases, and services require provisioning |
| **Deployment** | 🔄 Ready | Automated workflow configured, manual steps documented |
| **Post-Deployment** | 📋 Prepared | Monitoring, validation, and rollback procedures ready |

---

## Phase 1: Pre-Deployment Validation

### 1.1 Code Quality & Build ✅

- [x] **Linting**: `npm run lint` passes with 0 errors
- [x] **Type Checking**: `npm run typecheck` passes
- [x] **Unit Tests**: 94/94 tests passing
- [x] **Build**: `npm run build` succeeds
- [x] **Security Scan**: CodeQL clean, 8 low-severity in dev-only tool accepted
- [x] **Preflight Script**: `node scripts/preflight.mjs` validates environment and build
- [x] **PWA Audit**: `npm run lint:pwa` (Lighthouse + bundle analysis)
- [x] **A11y Smoke**: `npm run test:e2e:a11y`

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

**Backend Integration** (Required):
- [ ] `NEXT_PUBLIC_BACKEND_URL` - Backend API endpoint (absolute HTTPS URL)
- [ ] `NEXT_PUBLIC_ENVIRONMENT_LABEL` - Environment name (e.g., "production")

**Onboarding & AI** (Required):
- [ ] `NEXT_PUBLIC_ONBOARDING_PUBLIC_TOKEN` - Public onboarding token
- [ ] `ONBOARDING_API_TOKEN` - Server-side onboarding API token
- [ ] `OPENAI_API_KEY` - OpenAI API key for AI features

**Mobile Auth (Required for OTP flows)**:
- [ ] `EXPO_PUBLIC_WEB_URL` - Expo mobile API base (falls back to `NEXT_PUBLIC_SITE_URL`)
- [ ] `API_BASE_URL` - Native mobile API base for Compose/SwiftUI builds

**Production Services** (Optional but Recommended):
- [ ] `NEXT_PUBLIC_SENTRY_DSN` - Error tracking
- [ ] `SENTRY_DSN` - Server-side error tracking
- [ ] `NEXT_PUBLIC_SITE_URL` - Public site URL
- [ ] `NEXT_TELEMETRY_DISABLED` - Set to `1` in CI/CD

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
- [ ] `METRICS_TOKEN` - Bearer token for /metrics endpoint
- [ ] `CORS_ORIGIN` - Allowed CORS origins (comma-separated)

**Services** (Optional):
- [ ] `APP_ENABLE_CSP=1` - Enable Content Security Policy
- [ ] `LOG_LEVEL` - Logging level (info, debug, error)

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
  --from-literal=ADMIN_SESSION_SECRET=$(openssl rand -hex 32) \
  --from-literal=FAN_SESSION_SECRET=$(openssl rand -hex 32) \
  --from-literal=METRICS_TOKEN=$(openssl rand -hex 32) \
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
- [ ] `ADMIN_SESSION_SECRET`
- [ ] `FAN_SESSION_SECRET`

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
1. ✅ Install dependencies
2. ✅ Validate environment
3. ✅ Generate Prisma client
4. ✅ Run database migrations
5. ✅ Build Docker images (frontend + backend)
6. ✅ Push images to GHCR
7. ✅ Apply Kubernetes manifests (if KUBE_CONFIG_B64 configured)
8. ✅ Update deployments with new image SHA
9. ✅ Run health checks

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

# Import Grafana dashboards from docs/grafana/
```

#### Sentry Error Tracking
- [ ] Sentry DSN configured in frontend and backend
- [ ] Alert rules configured for critical errors
- [ ] Team notifications enabled

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

### 6.2 Compliance Requirements ⚠️

Review compliance checklist: `docs/runbooks/compliance.md`

- [ ] Data privacy requirements met (GDPR, etc.)
- [ ] Audit logging enabled
- [ ] Data retention policies configured
- [ ] User consent mechanisms in place

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
