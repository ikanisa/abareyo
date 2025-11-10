# Kubernetes Deployment Guide

## Prerequisites

1. **Kubernetes cluster** (1.24+) with kubectl configured
2. **Container registry access** (GHCR credentials for pulling images)
3. **Nginx Ingress Controller** installed
4. **Cert-Manager** (optional, for TLS certificates)

## Required Secrets

Secrets are provided as manifests so they can be managed via GitOps or your preferred secrets controller. Update placeholder
values before applying:

- `k8s/secrets.yaml` – application credentials (`frontend-secrets`, `backend-secrets`, `supabase-secrets`, `sentry-secrets`,
  and `metrics-basic-auth`).
- `k8s/postgres.yaml` – database StatefulSet and the `postgres-credentials` secret.
- `k8s/redis.yaml` – Redis StatefulSet and the `redis-credentials` secret.

Apply them with `kubectl apply -f <file> --namespace=rayon`. For the GHCR image pull credentials, create the `ghcr` secret via:

```bash
kubectl create secret docker-registry ghcr \
  --namespace=rayon \
  --docker-server=ghcr.io \
  --docker-username=<github-username> \
  --docker-password=<github-token>
```

## Deployment Steps

1. **Create namespace:**
   ```bash
   kubectl apply -f k8s/namespace.yaml
   ```

2. **Apply stateful services:**
   ```bash
   kubectl apply -f k8s/postgres.yaml
   kubectl apply -f k8s/redis.yaml
   ```

3. **Apply deployments:**
   ```bash
   kubectl apply -f k8s/backend-deployment.yaml
   kubectl apply -f k8s/frontend-deployment.yaml
   ```

4. **Configure ingress:**
   ```bash
   kubectl apply -f k8s/ingress.yaml
   ```

5. **Install cert-manager (if needed):**
   ```bash
   kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.15.1/cert-manager.yaml
   ```

6. **Apply cluster issuer (update email first):**
   ```bash
   # Edit cert-issuer.yaml and replace __LETSENCRYPT_EMAIL__ with your email
   kubectl apply -f k8s/cert-issuer.yaml
   ```

7. **Run Prisma migrations:**
   ```bash
   kubectl apply -f k8s/backend-migrate-job.yaml
   ```
   The job is idempotent; delete it after a successful run to avoid re-executions on subsequent syncs.

## Validating manifests locally

Before committing or applying, run a dry-run validation to catch schema errors:

```bash
kubectl apply --dry-run=client -f k8s/postgres.yaml
kubectl apply --dry-run=client -f k8s/redis.yaml
kubectl apply --dry-run=client -f k8s/secrets.yaml
kubectl apply --dry-run=client -f k8s/backend-deployment.yaml
kubectl apply --dry-run=client -f k8s/frontend-deployment.yaml
kubectl apply --dry-run=client -f k8s/backend-migrate-job.yaml
kubectl apply --dry-run=client -f k8s/ingress.yaml
```

Any failures indicate malformed YAML or missing fields that must be corrected before deployment.

## Health Checks

Verify deployments are healthy:

```bash
# Check pod status
kubectl get pods -n rayon

# Check frontend logs
kubectl logs -n rayon deployment/frontend --tail=50

# Check backend logs
kubectl logs -n rayon deployment/backend --tail=50

# Test backend health endpoint
kubectl run -n rayon curl --image=curlimages/curl:8.8.0 -i --rm --restart=Never -- \
  curl -fsS http://backend:5000/api/health

# Test frontend
kubectl run -n rayon curl --image=curlimages/curl:8.8.0 -i --rm --restart=Never -- \
  curl -fsS http://frontend:80
```

## Scaling

Adjust replicas as needed:

```bash
kubectl scale deployment frontend --replicas=3 -n rayon
kubectl scale deployment backend --replicas=3 -n rayon
```

## Monitoring

View resource usage:

```bash
kubectl top pods -n rayon
kubectl describe deployment frontend -n rayon
kubectl describe deployment backend -n rayon
```

## Troubleshooting

**Pods not starting:**
```bash
kubectl describe pod <pod-name> -n rayon
kubectl logs <pod-name> -n rayon --previous
```

**Image pull errors:**
- Verify GHCR credentials are correct
- Check imagePullSecrets are configured
- Ensure images exist in registry

**Connection issues:**
- Verify services are running: `kubectl get svc -n rayon`
- Check ingress configuration: `kubectl describe ingress -n rayon`
- Test internal connectivity from a pod

## Security Considerations

1. **Never commit secrets** to version control
2. **Rotate secrets regularly** (session secrets, API tokens)
3. **Use strong passwords** for databases and Redis
4. **Enable CSP** in production (`APP_ENABLE_CSP=1`)
5. **Review CORS_ORIGIN** - avoid wildcards in production
6. **Monitor metrics endpoint** - should require authentication
7. **Keep images updated** for security patches
8. **Use NetworkPolicies** to restrict pod-to-pod traffic (optional)

## Resource Limits

Current settings:

- **Frontend**: 256Mi-512Mi memory, 250m-500m CPU
- **Backend**: 512Mi-1Gi memory, 500m-1000m CPU

Adjust based on actual usage patterns observed in production.
