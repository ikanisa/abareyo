# Kubernetes Deployment Quick Reference

Quick command reference for deploying the Rayon Sports Super App to Kubernetes. For detailed instructions, see [PRODUCTION_READINESS.md](./PRODUCTION_READINESS.md).

## Prerequisites Checklist

- [ ] Kubernetes cluster configured (kubectl connected)
- [ ] Container images built and pushed to registry
- [ ] All secrets prepared (DATABASE_URL, REDIS_URL, API keys, etc.)
- [ ] cert-manager installed (if using TLS)
- [ ] NGINX Ingress Controller installed

## Quick Deployment Steps

### 1. Create Namespace
```bash
kubectl apply -f k8s/namespace.yaml
kubectl get namespace rayon
```

### 2. Create Secrets
```bash
# Generate secure random secrets
openssl rand -base64 32

# Create backend secrets
kubectl -n rayon create secret generic backend-secrets \
  --from-literal=DATABASE_URL='postgres://user:password@host:5432/dbname' \
  --from-literal=REDIS_URL='redis://host:6379' \
  --from-literal=CORS_ORIGIN='https://your-domain.com' \
  --from-literal=METRICS_TOKEN='your-metrics-token' \
  --from-literal=ADMIN_SESSION_SECRET='your-admin-secret' \
  --from-literal=FAN_SESSION_SECRET='your-fan-secret' \
  --from-literal=OPENAI_API_KEY='your-openai-key'

# Verify secret
kubectl -n rayon get secret backend-secrets
```

### 3. Deploy Applications
```bash
# Deploy backend
kubectl apply -f k8s/backend-deployment.yaml
kubectl -n rayon rollout status deployment/backend

# Deploy frontend
kubectl apply -f k8s/frontend-deployment.yaml
kubectl -n rayon rollout status deployment/frontend
```

### 4. Configure Ingress (Optional)
```bash
# With TLS
sed "s/__LETSENCRYPT_EMAIL__/your-email@example.com/g" k8s/cert-issuer.yaml | kubectl apply -f -
sed "s/__PUBLIC_HOSTNAME__/app.example.com/g" k8s/ingress.yaml | kubectl apply -f -

# Verify ingress
kubectl -n rayon get ingress web
```

## Health Checks

```bash
# Backend health
kubectl -n rayon port-forward svc/backend 5000:5000 &
curl http://localhost:5000/api/health

# Frontend health
kubectl -n rayon port-forward svc/frontend 3000:80 &
curl http://localhost:3000/

# Check pod status
kubectl -n rayon get pods
kubectl -n rayon describe pod <pod-name>
```

## Monitoring Commands

```bash
# View logs
kubectl -n rayon logs -l app=backend --tail=50 -f
kubectl -n rayon logs -l app=frontend --tail=50 -f

# Check resource usage
kubectl top pods -n rayon
kubectl top nodes

# View events
kubectl -n rayon get events --sort-by='.lastTimestamp'

# Check deployments
kubectl -n rayon get deployments
kubectl -n rayon get services
kubectl -n rayon get ingress
```

## Troubleshooting

```bash
# Pod not starting
kubectl -n rayon describe pod <pod-name>
kubectl -n rayon logs <pod-name> --previous

# Service not accessible
kubectl -n rayon get endpoints
kubectl -n rayon describe service <service-name>

# Ingress issues
kubectl -n rayon describe ingress web
kubectl get ingressclass

# Secret issues
kubectl -n rayon get secrets
kubectl -n rayon describe secret backend-secrets
```

## Rollback

```bash
# Quick rollback
kubectl -n rayon rollout undo deployment/backend
kubectl -n rayon rollout undo deployment/frontend

# Rollback to specific revision
kubectl -n rayon rollout history deployment/backend
kubectl -n rayon rollout undo deployment/backend --to-revision=<N>

# Check rollout status
kubectl -n rayon rollout status deployment/backend
kubectl -n rayon rollout status deployment/frontend
```

## Update Deployment

```bash
# Update image
kubectl -n rayon set image deployment/backend backend=ghcr.io/ikanisa/abareyo-backend:v1.2.3
kubectl -n rayon set image deployment/frontend frontend=ghcr.io/ikanisa/abareyo-frontend:v1.2.3

# Watch rollout
kubectl -n rayon rollout status deployment/backend --watch

# Restart deployment
kubectl -n rayon rollout restart deployment/backend
kubectl -n rayon rollout restart deployment/frontend
```

## Scaling

```bash
# Scale replicas
kubectl -n rayon scale deployment/backend --replicas=3
kubectl -n rayon scale deployment/frontend --replicas=3

# Auto-scaling (requires metrics-server)
kubectl -n rayon autoscale deployment backend --cpu-percent=80 --min=2 --max=10
```

## Cleanup

```bash
# Delete specific resources
kubectl delete -f k8s/backend-deployment.yaml
kubectl delete -f k8s/frontend-deployment.yaml
kubectl delete -f k8s/ingress.yaml

# Delete entire namespace (CAUTION)
kubectl delete namespace rayon
```

## Environment-Specific Placeholders

Replace these placeholders in your deployment:

| Placeholder | Description | Example |
|-------------|-------------|---------|
| `__PUBLIC_HOSTNAME__` | Your public domain | `app.example.com` |
| `__LETSENCRYPT_EMAIL__` | Email for Let's Encrypt | `admin@example.com` |
| `DATABASE_URL` | PostgreSQL connection string | `postgres://user:pass@host:5432/db` |
| `REDIS_URL` | Redis connection string | `redis://host:6379` |
| `CORS_ORIGIN` | Allowed origins | `https://app.example.com` |
| `METRICS_TOKEN` | Metrics endpoint auth token | Generated via `openssl rand -base64 32` |
| `ADMIN_SESSION_SECRET` | Admin session secret | Generated via `openssl rand -base64 32` |
| `FAN_SESSION_SECRET` | Fan session secret | Generated via `openssl rand -base64 32` |
| `OPENAI_API_KEY` | OpenAI API key | From OpenAI dashboard |

## Resources

- **Full Guide**: [PRODUCTION_READINESS.md](./PRODUCTION_READINESS.md)
- **K8s Manifests**: [k8s/](./k8s/)
- **K8s README**: [docs/k8s/README.md](./docs/k8s/README.md)
- **Backend Config**: [docs/backend-config-checklist.md](./docs/backend-config-checklist.md)
- **Runbooks**: [docs/runbooks/](./docs/runbooks/)

---

**Last Updated**: 2025-10-28
