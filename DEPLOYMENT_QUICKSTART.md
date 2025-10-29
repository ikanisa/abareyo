# Quick Start: Deploying Abareyo to Production

> **Time estimate**: 2-3 hours for first deployment  
> **Prerequisites**: Docker, kubectl, domain name, cloud accounts (Supabase, database hosting)

This guide walks you through deploying Abareyo to production for the first time. For detailed information, see [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md).

## Before You Begin

1. **Read the full checklist**: [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)
2. **Ensure production readiness**: Review [PRODUCTION_READINESS.md](./PRODUCTION_READINESS.md)
3. **Have these ready**:
   - Kubernetes cluster (1.24+) with kubectl configured
   - Domain name with DNS access
   - PostgreSQL database (v14+)
   - Redis instance (v6+)
   - Supabase project
   - GitHub account with repository access

---

## Step 1: Validate Your Local Setup (5 minutes)

```bash
# Clone repository (if not already done)
git clone https://github.com/ikanisa/abareyo.git
cd abareyo

# Install dependencies
npm ci

# Run deployment readiness check
npm run validate:deployment

# Expected output: All checks passed or warnings only
```

If validation fails, fix any errors before proceeding.

---

## Step 2: Provision Infrastructure (30-60 minutes)

### 2.1 PostgreSQL Database

Using your preferred provider (AWS RDS, Google Cloud SQL, etc.):

```bash
# Create database
# Example connection string format:
# postgresql://username:password@host:5432/rayon

# Test connection
psql "postgresql://username:password@host:5432/rayon" -c "SELECT version();"
```

Save the `DATABASE_URL` for later.

### 2.2 Redis

Using your preferred provider (AWS ElastiCache, Redis Cloud, etc.):

```bash
# Example connection string format:
# redis://username:password@host:6379/0

# Test connection
redis-cli -u "redis://username:password@host:6379" PING
# Expected: PONG
```

Save the `REDIS_URL` for later.

### 2.3 Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note these values from Settings → API:
   - Project URL (e.g., `https://xxxxx.supabase.co`)
   - Anon/public key
   - Service role key (keep secret!)

### 2.4 Kubernetes Cluster

Ensure you have a K8s cluster running with:
- Nginx Ingress Controller installed
- cert-manager for TLS (or manual TLS certs)

```bash
# Verify cluster access
kubectl cluster-info

# Check ingress controller
kubectl get ingressclass

# Check cert-manager (if using)
kubectl get pods -n cert-manager
```

---

## Step 3: Configure Secrets (15 minutes)

### 3.1 Generate Session Secrets

```bash
# Generate secure random strings (32+ characters)
ADMIN_SESSION_SECRET=$(openssl rand -hex 32)
FAN_SESSION_SECRET=$(openssl rand -hex 32)
METRICS_TOKEN=$(openssl rand -hex 32)

echo "ADMIN_SESSION_SECRET=${ADMIN_SESSION_SECRET}"
echo "FAN_SESSION_SECRET=${FAN_SESSION_SECRET}"
echo "METRICS_TOKEN=${METRICS_TOKEN}"

# Save these values!
```

### 3.2 Create Kubernetes Secrets

Create a file `k8s-secrets.sh` (add to .gitignore):

```bash
#!/bin/bash
# k8s-secrets.sh - DO NOT COMMIT THIS FILE

# Apply namespace
kubectl apply -f k8s/namespace.yaml

# Frontend secrets
kubectl -n rayon create secret generic frontend-secrets \
  --from-literal=NEXT_PUBLIC_BACKEND_URL=https://api.yourdomain.com \
  --from-literal=NEXT_PUBLIC_ENVIRONMENT_LABEL=production \
  --from-literal=NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co \
  --from-literal=NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key \
  --from-literal=SUPABASE_SERVICE_ROLE_KEY=your-service-role-key \
  --from-literal=SITE_SUPABASE_URL=https://xxx.supabase.co \
  --from-literal=SITE_SUPABASE_SECRET_KEY=your-service-role-key \
  --from-literal=NEXT_PUBLIC_ONBOARDING_PUBLIC_TOKEN=your-token \
  --from-literal=ONBOARDING_API_TOKEN=your-api-token \
  --from-literal=OPENAI_API_KEY=your-openai-key \
  --from-literal=NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn \
  --from-literal=SENTRY_DSN=your-sentry-dsn \
  --dry-run=client -o yaml | kubectl apply -f -

# Backend secrets
kubectl -n rayon create secret generic backend-secrets \
  --from-literal=DATABASE_URL=postgresql://user:pass@host:5432/rayon \
  --from-literal=REDIS_URL=redis://host:6379 \
  --from-literal=ADMIN_SESSION_SECRET=${ADMIN_SESSION_SECRET} \
  --from-literal=FAN_SESSION_SECRET=${FAN_SESSION_SECRET} \
  --from-literal=METRICS_TOKEN=${METRICS_TOKEN} \
  --from-literal=CORS_ORIGIN=https://yourdomain.com \
  --dry-run=client -o yaml | kubectl apply -f -

# Image pull secret (GitHub Container Registry)
kubectl -n rayon create secret docker-registry ghcr \
  --docker-server=ghcr.io \
  --docker-username=YOUR_GITHUB_USERNAME \
  --docker-password=YOUR_GITHUB_PAT \
  --dry-run=client -o yaml | kubectl apply -f -

echo "Secrets created successfully!"
```

Update the values in the script, then run:

```bash
chmod +x k8s-secrets.sh
./k8s-secrets.sh
```

---

## Step 4: Configure Ingress (10 minutes)

### 4.1 Update DNS

Point your domain to your Kubernetes ingress controller's external IP:

```bash
# Get ingress controller IP
kubectl get svc -n ingress-nginx

# Create DNS A record:
# app.yourdomain.com -> <EXTERNAL-IP>
```

### 4.2 Update Ingress Manifest

Edit `k8s/ingress.yaml`:

```yaml
# Replace:
__INGRESS_HOST__ → app.yourdomain.com
__TLS_SECRET__ → rayon-tls
```

### 4.3 Setup TLS (cert-manager)

If using cert-manager:

```bash
# Install cert-manager (if not installed)
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.15.1/cert-manager.yaml

# Wait for cert-manager to be ready
kubectl -n cert-manager wait --for=condition=ready pod --all --timeout=180s

# Update cert-issuer.yaml with your email
sed -i 's/__LETSENCRYPT_EMAIL__/youremail@example.com/g' k8s/cert-issuer.yaml

# Apply cert issuer
kubectl apply -f k8s/cert-issuer.yaml
```

---

## Step 5: Run Database Migrations (10 minutes)

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm ci

# Generate Prisma client
npx prisma generate

# Set DATABASE_URL (from Step 2.1)
export DATABASE_URL="postgresql://username:password@host:5432/rayon"

# Run migrations
npm run prisma:migrate

# Verify migration status
npx prisma migrate status

# (Optional) Seed initial data
npm run seed
```

---

## Step 6: Deploy Application (20 minutes)

### Option A: Automated Deployment (GitHub Actions)

1. Configure GitHub Secrets in your repository settings:

   **Required secrets**:
   - `DATABASE_URL`
   - `DATABASE_SHADOW_URL`
   - `REDIS_URL`
   - `CORS_ORIGIN`
   - `METRICS_TOKEN`
   - `ADMIN_SESSION_SECRET`
   - `FAN_SESSION_SECRET`
   - `KUBE_CONFIG_B64` (base64-encoded kubeconfig)
   - `GHCR_TOKEN` (GitHub PAT with packages:write)
   - `INGRESS_HOST` (your domain)
   - `TLS_SECRET` (e.g., "rayon-tls")
   - `CERT_MANAGER_EMAIL` (your email)

2. Encode your kubeconfig:
   ```bash
   cat ~/.kube/config | base64 -w 0
   # Copy output to KUBE_CONFIG_B64 secret
   ```

3. Trigger deployment:
   ```bash
   git push origin main
   # or
   gh workflow run deploy.yml
   ```

4. Monitor deployment:
   ```bash
   gh run watch
   # or check Actions tab on GitHub
   ```

### Option B: Manual Deployment

```bash
# Build and push images
docker build -t ghcr.io/ikanisa/abareyo-frontend:latest .
docker build -t ghcr.io/ikanisa/abareyo-backend:latest -f backend/Dockerfile .

docker push ghcr.io/ikanisa/abareyo-frontend:latest
docker push ghcr.io/ikanisa/abareyo-backend:latest

# Apply Kubernetes manifests
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/ingress.yaml

# Watch deployment progress
kubectl -n rayon get pods -w
```

---

## Step 7: Verify Deployment (10 minutes)

### 7.1 Check Pod Status

```bash
# All pods should be Running with 1/1 Ready
kubectl -n rayon get pods -o wide

# Check for recent restarts (should be 0)
kubectl -n rayon get pods
```

### 7.2 Test Backend Health

```bash
# In-cluster test
kubectl -n rayon run curl --image=curlimages/curl:8.8.0 -i --rm --restart=Never -- \
  curl -fsS http://backend:5000/api/health

# Expected: {"status":"ok",...}
```

### 7.3 Test Frontend Access

```bash
# Wait for DNS to propagate (may take 5-10 minutes)
curl -I https://app.yourdomain.com

# Expected: HTTP/2 200
```

### 7.4 Browser Test

Open https://app.yourdomain.com in your browser:
- [ ] Page loads without errors
- [ ] Login works
- [ ] Main navigation functions
- [ ] No console errors

### 7.5 Check Logs

```bash
# Backend logs
kubectl -n rayon logs deployment/backend --tail=50

# Frontend logs
kubectl -n rayon logs deployment/frontend --tail=50

# Look for errors or warnings
```

---

## Step 8: Post-Deployment Setup (30 minutes)

### 8.1 Setup Monitoring

1. **Sentry** (Error Tracking):
   - Verify errors are being reported
   - Configure alert rules
   - Set up team notifications

2. **Prometheus + Grafana** (Metrics):
   ```bash
   # Apply Prometheus alert rules
   kubectl apply -f docs/observability/prometheus-alerts.yaml
   
   # Import Grafana dashboards from docs/grafana/
   ```

### 8.2 Configure Backups

- Set up automated database backups (daily recommended)
- Test restore procedure
- Document backup locations and access

### 8.3 Team Onboarding

- Share on-call runbook: [docs/runbooks/on-call-enablement-checklist.md](./docs/runbooks/on-call-enablement-checklist.md)
- Set up PagerDuty or alerting system
- Review incident response procedures
- Conduct team walkthrough of deployment

---

## Troubleshooting

### Pods Not Starting

```bash
# Check events
kubectl -n rayon get events --sort-by='.lastTimestamp'

# Check pod details
kubectl -n rayon describe pod <pod-name>

# Common issues:
# - ImagePullBackOff: Check image pull secrets
# - CrashLoopBackOff: Check logs for application errors
# - Pending: Check resource limits and node capacity
```

### Cannot Access Application

```bash
# Check ingress
kubectl -n rayon get ingress
kubectl -n rayon describe ingress rayon-ingress

# Check TLS certificate
kubectl -n rayon get certificate
kubectl -n rayon describe certificate rayon-tls

# Check DNS
dig app.yourdomain.com
nslookup app.yourdomain.com
```

### Database Connection Issues

```bash
# Test from backend pod
kubectl -n rayon exec -it deployment/backend -- sh
# Inside pod:
apk add postgresql-client
psql "$DATABASE_URL" -c "SELECT 1;"
```

### For More Help

- Review [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) for detailed procedures
- Check [docs/runbooks/incident-response.md](./docs/runbooks/incident-response.md) for incident handling
- See [k8s/README.md](./k8s/README.md) for detailed K8s deployment guide

---

## Next Steps

After successful deployment:

1. **Monitor First 24 Hours**:
   - Watch error rates in Sentry
   - Monitor pod restarts
   - Check resource usage
   - Review application logs

2. **Week 1 Tasks**:
   - Test rollback procedure
   - Verify backup restore works
   - Fine-tune resource limits
   - Document any issues encountered

3. **Ongoing**:
   - Set up quarterly disaster recovery drills
   - Review security scans weekly
   - Update dependencies monthly
   - Rotate secrets quarterly

---

## Rollback Procedure

If issues arise:

```bash
# Quick rollback to previous version
kubectl -n rayon rollout undo deployment/backend
kubectl -n rayon rollout undo deployment/frontend

# Verify rollback
kubectl -n rayon rollout status deployment/backend
kubectl -n rayon rollout status deployment/frontend
```

For detailed rollback procedures, see [docs/runbooks/rollback.md](./docs/runbooks/rollback.md).

---

## Success Checklist

- [ ] All pods running (1/1 Ready, 0 restarts)
- [ ] Backend health endpoint returns 200
- [ ] Frontend accessible via browser
- [ ] Login/authentication works
- [ ] Database migrations applied
- [ ] TLS certificate issued and valid
- [ ] No critical errors in logs
- [ ] Monitoring configured (Sentry, Prometheus)
- [ ] Backups configured and tested
- [ ] Team onboarded with runbooks
- [ ] Rollback procedure tested (in staging)

**Congratulations! Your Abareyo deployment is live! 🎉**

For questions or issues, refer to the documentation or open a GitHub issue.
