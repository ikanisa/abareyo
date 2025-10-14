Kubernetes Manifests (example)

Files
- k8s/namespace.yaml
- k8s/backend-deployment.yaml
- k8s/frontend-deployment.yaml
- k8s/ingress.yaml (Ingress + TLS)
- k8s/cert-issuer.yaml (ClusterIssuer for Let's Encrypt)

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

Ingress & TLS (optional)
- Install cert-manager in your cluster (Helm or static manifests).
- Apply ClusterIssuer with your email:

  sed "s/__LETSENCRYPT_EMAIL__/you@example.com/g" k8s/cert-issuer.yaml | kubectl apply -f -

- Apply Ingress for a host (routes / to frontend and /api to backend):

  sed -e "s/__INGRESS_HOST__/app.example.com/g" -e "s/__TLS_SECRET__/app-example-com-tls/g" k8s/ingress.yaml | kubectl apply -f -

Notes
- Images point to `ghcr.io/ikanisa/gikundiro-*` (updated).
- Health endpoints: backend `/api/health`, frontend `/`.
- Frontend is configured for same-origin API calls (`NEXT_PUBLIC_BACKEND_URL=/api`). Set `CORS_ORIGIN` to your public origin(s).
