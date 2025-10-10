Kubernetes Manifests (example)

Files
- k8s/namespace.yaml
- k8s/backend-deployment.yaml
- k8s/frontend-deployment.yaml

Usage
1. Create namespace:

   kubectl apply -f k8s/namespace.yaml

2. Create secrets (example):

   kubectl -n rayon create secret generic backend-secrets \
     --from-literal=DATABASE_URL=postgres://... \
     --from-literal=REDIS_URL=redis://... \
     --from-literal=CORS_ORIGIN=https://app.example.com \
     --from-literal=METRICS_TOKEN=... \
     --from-literal=ADMIN_SESSION_SECRET=... \
     --from-literal=FAN_SESSION_SECRET=...

3. Deploy backend and frontend:

   kubectl apply -f k8s/backend-deployment.yaml
   kubectl apply -f k8s/frontend-deployment.yaml

4. Expose via Ingress (not included): configure your Ingress controller with TLS and point to `frontend` Service.

Notes
- Images point to `ghcr.io/ikanisa/abareyo-*` (updated).
- Health endpoints: backend `/api/health`, frontend `/`.
