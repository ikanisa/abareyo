# Kubernetes Deployment Guide

## Prerequisites

1. **Kubernetes cluster** (1.24+) with kubectl configured
2. **Container registry access** (GHCR credentials for pulling images)
3. **Nginx Ingress Controller** installed
4. **Cert-Manager** (optional, for TLS certificates)

## Required Secrets

Before deploying, create the required Kubernetes secrets:

### Frontend Secrets

```bash
kubectl create secret generic frontend-secrets \
  --namespace=rayon \
  --from-literal=NEXT_PUBLIC_SUPABASE_URL='https://your-project.supabase.co' \
  --from-literal=NEXT_PUBLIC_SUPABASE_ANON_KEY='your-anon-key' \
  --from-literal=NEXT_PUBLIC_ONBOARDING_PUBLIC_TOKEN='your-onboarding-token' \
  --from-literal=SUPABASE_SERVICE_ROLE_KEY='your-service-role-key' \
  --from-literal=SITE_SUPABASE_URL='https://your-project.supabase.co' \
  --from-literal=SITE_SUPABASE_SECRET_KEY='your-secret-key' \
  --from-literal=ONBOARDING_API_TOKEN='your-onboarding-api-token' \
  --from-literal=OPENAI_API_KEY='your-openai-key'
```

### Backend Secrets

```bash
kubectl create secret generic backend-secrets \
  --namespace=rayon \
  --from-literal=CORS_ORIGIN='https://your-domain.com' \
  --from-literal=DATABASE_URL='postgresql://user:password@host:5432/database' \
  --from-literal=DATABASE_SHADOW_URL='postgresql://user:password@host:5432/database_shadow' \
  --from-literal=REDIS_URL='redis://host:6379' \
  --from-literal=METRICS_TOKEN='random-secure-token' \
  --from-literal=ADMIN_SESSION_SECRET='random-secure-secret-32-chars-min' \
  --from-literal=FAN_SESSION_SECRET='another-secure-secret-32-chars-min' \
  --from-literal=SUPABASE_URL='https://your-project.supabase.co' \
  --from-literal=SUPABASE_SECRET_KEY='your-secret-key' \
  --from-literal=OPENAI_API_KEY='your-openai-key'
```

### GHCR Image Pull Secret

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

2. **Apply deployments:**
   ```bash
   kubectl apply -f k8s/backend-deployment.yaml
   kubectl apply -f k8s/frontend-deployment.yaml
   ```

3. **Configure ingress (update placeholders first):**
   ```bash
   # Edit ingress.yaml and replace:
   # - __INGRESS_HOST__ with your domain (e.g., app.example.com)
   # - __TLS_SECRET__ with your TLS secret name (e.g., app-tls)
   
   kubectl apply -f k8s/ingress.yaml
   ```

4. **Install cert-manager (if needed):**
   ```bash
   kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.15.1/cert-manager.yaml
   ```

5. **Apply cluster issuer (update email first):**
   ```bash
   # Edit cert-issuer.yaml and replace __LETSENCRYPT_EMAIL__ with your email
   kubectl apply -f k8s/cert-issuer.yaml
   ```

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
