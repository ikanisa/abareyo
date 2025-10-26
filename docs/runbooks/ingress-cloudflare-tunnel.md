# Cloudflare Tunnel Production Ingress

This runbook documents how the Rayon Sports platform exposes the Next.js runtime through Cloudflare Zero Trust. The tunnel sits in front of the cluster and keeps the app private by default while still benefiting from Cloudflare-managed TLS and HTTP/3.

## Overview

- **Zero trust** – Access policies live in the Cloudflare Zero Trust dashboard. The tunnel only accepts authenticated traffic (Rayon email groups and service accounts) and therefore the Kubernetes cluster never receives unauthenticated requests.
- **TLS** – Cloudflare terminates TLS for the public hostname. Traffic inside the tunnel stays HTTP and is scoped to the cluster-internal services.
- **Routing** – Cloudflared forwards `/api` to the Supabase-compatible backend service and everything else to the Next.js frontend pods.

## Prerequisites

1. Cloudflare account with Zero Trust enabled for the production zone.
2. A long-lived tunnel configured in the Cloudflare dashboard. Record the tunnel UUID and name.
3. A `cloudflared-credentials` secret in the `rayon` namespace that contains the downloaded `credentials.json` from **Zero Trust > Access > Tunnels > <tunnel name> > `Download connector credentials`**. (You may also keep the token in the same secret for CLI usage, but the Deployment only requires the JSON file.)
4. Kubernetes manifests rendered with the production hostname (for example `app.rayonsports.rw`).

Create or update the secret by running:

```bash
kubectl -n rayon create secret generic cloudflared-credentials \
  --from-file=credentials.json=/path/to/<TUNNEL_UUID>.json \
  --dry-run=client -o yaml | kubectl apply -f -
```

## Kubernetes Deployment

`k8s/cloudflared-deployment.yaml` ships a high-availability `cloudflared` Deployment and ConfigMap. Update the placeholders before applying:

- `__CLOUDFLARE_TUNNEL_NAME__` – human-friendly tunnel name from the dashboard
- `__PUBLIC_HOSTNAME__` – production hostname served through the tunnel (e.g., `app.rayonsports.rw`)

Apply manifests:

```bash
kubectl apply -f k8s/cloudflared-deployment.yaml
kubectl apply -f k8s/ingress.yaml
```

`k8s/ingress.yaml` keeps NGINX path routing but disables TLS redirection because HTTPS is already provided by Cloudflare.

## Access Policies

1. Navigate to **Zero Trust > Access > Applications**.
2. Create an application for the tunnel hostname and choose a policy (email domain, Azure AD group, service token, etc.).
3. Enable the **Service Auth** policy for CI/CD automations that need to reach health probes.

The Access rules protect every request before it reaches Kubernetes. If you need a public endpoint (for example, the health probe), scope that path using a separate policy.

## Maintenance

- Rotate the tunnel connector credentials quarterly and re-run the secret creation command.
- Bump the `cloudflare/cloudflared` image when upstream releases security fixes.
- Monitor the Deployment via `kubectl logs deploy/cloudflared -n rayon` and Cloudflare analytics to ensure connectors stay connected.

## Local Verification

You can still run a developer tunnel from your laptop by pointing to the same hostname with an alternate policy:

```bash
cloudflared tunnel --config infra/cloudflared/config.yml.example run rayon-dev
```

Restrict the developer tunnel in Cloudflare Access to avoid bypassing the production zero-trust guardrails.
