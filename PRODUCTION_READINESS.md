# Production Readiness Checklist

This document consolidates production readiness requirements and provides step-by-step Kubernetes deployment instructions for the Rayon Sports Super App.

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Kubernetes Deployment Guide](#kubernetes-deployment-guide)
3. [Health Check Verification](#health-check-verification)
4. [Post-Deployment Validation](#post-deployment-validation)
5. [Rollback Procedures](#rollback-procedures)

---

## Pre-Deployment Checklist

### 1. Code Health & Build Stability

- [ ] **CI Pipeline Green**: All lint, type-check, unit, and e2e tests passing
- [ ] **Production Build Success**: `npm run build` completes without errors
- [ ] **TypeScript Strict Mode**: Address type errors before enabling strict mode
- [ ] **ESLint Clean**: No lint violations in production code paths
- [ ] **Environment Variables**: All required variables defined (see [DEPLOYMENT_READINESS_REPORT.md](./DEPLOYMENT_READINESS_REPORT.md))

**Critical Issues** (from [PROD_READINESS_AUDIT.md](./reports/PROD_READINESS_AUDIT.md)):
- [ ] `NEXT_PUBLIC_SOCKET_PATH` has safe defaults for builds
- [ ] Null guard on `inputRef.current` in onboarding modal
- [ ] TypeScript target set to `es2020` or higher
- [ ] Next.js lint/type checks re-enabled in `next.config.mjs`

### 2. Security & Compliance

- [ ] **HTTP Headers**: CSP, Referrer-Policy, X-Frame-Options configured
- [ ] **Secrets Rotation**: All secrets rotated within last 90 days
- [ ] **Cookie Security**: `Secure; HttpOnly; SameSite=Lax` flags verified
- [ ] **E2E Mocks Disabled**: `E2E_API_MOCKS` unset in production
- [ ] **CORS Configuration**: `CORS_ORIGIN` set to specific allowed domains (no wildcards)

### 3. Backend Configuration

Follow [docs/backend-config-checklist.md](./docs/backend-config-checklist.md) for:
- [ ] Payment service credentials (`PAYMENT_API_KEY`, `PAYMENT_WEBHOOK_SECRET`)
- [ ] Realtime infrastructure (`REALTIME_SERVICE_API_KEY`, `REALTIME_REDIS_URL`)
- [ ] Metrics & observability (`METRICS_EXPORTER_API_KEY`, `LOG_DRAIN_URL`)
- [ ] Database migrations applied to production schema

### 4. Observability

- [ ] **Monitoring Setup**: Prometheus scraping `/metrics` endpoint
- [ ] **Dashboards Configured**: Grafana dashboards imported (see `docs/grafana/`)
- [ ] **Alert Rules Applied**: `docs/observability/prometheus-rules.yml`
- [ ] **Error Tracking**: Sentry DSN configured for frontend and backend
- [ ] **Logging Pipeline**: Centralized logging (Loki/Logflare) receiving logs

### 5. Operations & Runbooks

- [ ] **Deployment Runbook**: `docs/runbooks/deploy.md` reviewed
- [ ] **Rollback Runbook**: `docs/runbooks/rollback.md` tested in staging
- [ ] **Incident Response**: `docs/runbooks/incident-response.md` accessible
- [ ] **On-Call Schedule**: Team members aware of launch window
- [ ] **Support Notified**: Customer support team briefed on new features

---

## Kubernetes Deployment Guide

This section follows the [k8s/README.md](./docs/k8s/README.md) step-by-step guide.

### Prerequisites

- Kubernetes cluster (v1.19+) with `kubectl` configured
- Container images published to `ghcr.io/ikanisa/abareyo-backend:latest` and `ghcr.io/ikanisa/abareyo-frontend:latest`
- cert-manager installed (optional, for TLS)
- NGINX Ingress Controller installed (for ingress)

### Step 1: Create Namespace

```bash
kubectl apply -f k8s/namespace.yaml
```

**Verify:**
```bash
kubectl get namespace rayon
```

Expected output: `rayon   Active   <age>`

### Step 2: Create Required Secrets

#### Backend Secrets

Create the `backend-secrets` secret with all required environment variables:

```bash
kubectl -n rayon create secret generic backend-secrets \
  --from-literal=DATABASE_URL='postgres://user:password@host:5432/dbname' \
  --from-literal=REDIS_URL='redis://host:6379' \
  --from-literal=CORS_ORIGIN='https://your-domain.com' \
  --from-literal=METRICS_TOKEN='your-metrics-token' \
  --from-literal=ADMIN_SESSION_SECRET='your-admin-secret' \
  --from-literal=FAN_SESSION_SECRET='your-fan-secret' \
  --from-literal=OPENAI_API_KEY='your-openai-key'
```

**Replace placeholders:**
- `DATABASE_URL`: Full PostgreSQL connection string
- `REDIS_URL`: Redis connection string (if using realtime features)
- `CORS_ORIGIN`: Comma-separated list of allowed origins (e.g., `https://app.example.com,https://www.example.com`)
- `METRICS_TOKEN`: Secure random token for metrics endpoint authentication
- `ADMIN_SESSION_SECRET`: Secure random string (32+ characters)
- `FAN_SESSION_SECRET`: Secure random string (32+ characters, different from admin)
- `OPENAI_API_KEY`: OpenAI API key for AI-powered features

**Generate secure secrets:**
```bash
# Generate random secrets (32 characters)
openssl rand -base64 32
```

**Verify secret creation:**
```bash
kubectl -n rayon get secret backend-secrets
kubectl -n rayon describe secret backend-secrets
```

### Step 3: Apply Backend Deployment

```bash
kubectl apply -f k8s/backend-deployment.yaml
```

**Verify deployment:**
```bash
kubectl -n rayon get deployment backend
kubectl -n rayon get pods -l app=backend
kubectl -n rayon logs -l app=backend --tail=50
```

**Check backend service:**
```bash
kubectl -n rayon get service backend
```

### Step 4: Apply Frontend Deployment

```bash
kubectl apply -f k8s/frontend-deployment.yaml
```

**Verify deployment:**
```bash
kubectl -n rayon get deployment frontend
kubectl -n rayon get pods -l app=frontend
kubectl -n rayon logs -l app=frontend --tail=50
```

**Check frontend service:**
```bash
kubectl -n rayon get service frontend
```

### Step 5: Configure Ingress (Optional)

#### Option A: With TLS (Let's Encrypt)

1. **Apply ClusterIssuer** (replace email):
   ```bash
   sed "s/__LETSENCRYPT_EMAIL__/your-email@example.com/g" k8s/cert-issuer.yaml | kubectl apply -f -
   ```

2. **Apply Ingress** (replace hostname and TLS secret name):
   ```bash
   sed -e "s/__PUBLIC_HOSTNAME__/app.example.com/g" k8s/ingress.yaml | kubectl apply -f -
   ```

#### Option B: Without TLS (Development/Testing)

```bash
sed -e "s/__PUBLIC_HOSTNAME__/app.example.com/g" k8s/ingress.yaml | kubectl apply -f -
```

**Verify ingress:**
```bash
kubectl -n rayon get ingress web
kubectl -n rayon describe ingress web
```

### Step 6: Wait for Deployments to be Ready

```bash
# Watch backend deployment
kubectl -n rayon rollout status deployment/backend

# Watch frontend deployment
kubectl -n rayon rollout status deployment/frontend
```

---

## Health Check Verification

### Backend Health Check

```bash
# Port-forward to backend (if ingress not configured)
kubectl -n rayon port-forward svc/backend 5000:5000 &

# Test health endpoint
curl http://localhost:5000/api/health
```

**Expected response:** `200 OK` with JSON health status

**Via Ingress:**
```bash
curl https://your-domain.com/api/health
```

### Frontend Health Check

```bash
# Port-forward to frontend (if ingress not configured)
kubectl -n rayon port-forward svc/frontend 3000:80 &

# Test homepage
curl http://localhost:3000/
```

**Expected response:** `200 OK` with HTML content

**Via Ingress:**
```bash
curl https://your-domain.com/
```

### Kubernetes Liveness and Readiness Probes

The manifests include built-in health checks:

**Backend:**
- Liveness: `GET /api/health` every 15s (starts after 10s)
- Readiness: `GET /api/health` every 10s (starts after 5s)

**Frontend:**
- Liveness: `GET /` every 15s (starts after 10s)
- Readiness: `GET /` every 10s (starts after 5s)

**Check probe status:**
```bash
kubectl -n rayon get pods
kubectl -n rayon describe pod <pod-name>
```

Look for `Liveness` and `Readiness` probe results in the events section.

---

## Post-Deployment Validation

### 1. Functional Testing

- [ ] **Homepage Loads**: Navigate to `https://your-domain.com`
- [ ] **Backend API Accessible**: Test `https://your-domain.com/api/health`
- [ ] **Authentication Flow**: Login as admin and fan user
- [ ] **Core Features**: Test tickets, community, shop, and wallet features
- [ ] **Mobile Responsiveness**: Test on mobile viewport

### 2. Performance Monitoring

- [ ] **Response Times**: Check `/metrics` endpoint shows acceptable latencies
- [ ] **Resource Usage**: Monitor pod CPU/memory via `kubectl top pods -n rayon`
- [ ] **Database Connections**: Verify connection pool is healthy
- [ ] **Cache Hit Rates**: Check Redis metrics if applicable

### 3. Security Validation

- [ ] **TLS Certificate**: Verify HTTPS is working and certificate is valid
- [ ] **CORS Headers**: Test cross-origin requests return correct headers
- [ ] **Metrics Endpoint**: Verify `/metrics` requires authentication token
- [ ] **Error Pages**: Confirm no sensitive information leaked in error responses

### 4. Observability Checks

```bash
# Check metrics endpoint (replace with actual token)
curl -H "Authorization: Bearer YOUR_METRICS_TOKEN" https://your-domain.com/metrics

# View recent logs
kubectl -n rayon logs -l app=backend --tail=100
kubectl -n rayon logs -l app=frontend --tail=100

# Check resource usage
kubectl top pods -n rayon
kubectl top nodes
```

### 5. Smoke Tests

Run automated smoke tests if available:
```bash
# E2E tests against production (use with caution)
E2E_BASE_URL=https://your-domain.com npm run test:e2e
```

---

## Rollback Procedures

### Quick Rollback (Kubernetes)

If issues are detected post-deployment:

```bash
# Rollback backend
kubectl -n rayon rollout undo deployment/backend

# Rollback frontend
kubectl -n rayon rollout undo deployment/frontend

# Check rollback status
kubectl -n rayon rollout status deployment/backend
kubectl -n rayon rollout status deployment/frontend
```

### Rollback to Specific Revision

```bash
# View deployment history
kubectl -n rayon rollout history deployment/backend

# Rollback to specific revision
kubectl -n rayon rollout undo deployment/backend --to-revision=<revision-number>
```

### Database Rollback

Follow database migration rollback procedures in `docs/migrations.md`.

### Full Incident Response

For critical issues, follow `docs/runbooks/incident-response.md` and `docs/runbooks/rollback.md`.

---

## Additional Resources

- **Deployment Readiness**: [DEPLOYMENT_READINESS_REPORT.md](./DEPLOYMENT_READINESS_REPORT.md)
- **Production Audit**: [reports/PROD_READINESS_AUDIT.md](./reports/PROD_READINESS_AUDIT.md)
- **K8s Manifests**: [k8s/](./k8s/)
- **Backend Config**: [docs/backend-config-checklist.md](./docs/backend-config-checklist.md)
- **Launch Readiness**: [docs/launch-readiness.md](./docs/launch-readiness.md)
- **Operations Runbooks**: [docs/runbooks/](./docs/runbooks/)
- **Observability**: [docs/observability.md](./docs/observability.md)

---

## Deployment Sign-off

Before proceeding to production, ensure the following sign-offs:

- [ ] **Backend Lead**: Code and configuration reviewed
- [ ] **Frontend Lead**: UI and integration tested
- [ ] **DevOps/SRE**: Infrastructure and monitoring configured
- [ ] **Security**: Security checklist completed
- [ ] **Product Owner**: Feature completeness validated
- [ ] **Support Team**: Prepared for launch and aware of new features

**Deployment Date**: _______________  
**Deployed By**: _______________  
**Approved By**: _______________  

---

**Last Updated**: 2025-10-28  
**Document Owner**: DevOps Team
