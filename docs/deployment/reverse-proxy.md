# Reverse Proxy & Secure Deployment Checklist

This project expects to sit behind a TLS-terminating reverse proxy (Caddy, Nginx, or Cloudflare). To keep Supabase service-role
credentials and session cookies scoped to the server runtime:

- Forward `X-Forwarded-Proto`, `X-Forwarded-For`, and `X-Forwarded-Host` headers. The middleware enforces HTTPS when it detects
  a non-`https` `x-forwarded-proto` value.
- Only expose publishable Supabase keys to edge environments. The `/app/api/matches` route automatically falls back to fixture data when
  a publishable key is not configured.
- Store `SITE_SUPABASE_SECRET_KEY` (and legacy fallbacks) exclusively in serverless function environment variables. **Never** inject the
  service-role key into the browser bundle or edge config.
- When terminating TLS upstream, pin the application origins via `NEXT_PUBLIC_SITE_URL` and `CORS_ALLOWED_ORIGINS`. The middleware now
  normalises these origins and automatically includes common local development hosts so that future proxy additions only require updating
  the allow list.
- Ensure cookies forwarded from the proxy retain the `Secure` flag and are not rewritten to a different domain. Admin session cookies are
  validated via backend calls that rely on the original cookie value.

For deployments behind bespoke proxies (e.g. Nginx or Traefik):

1. Configure upstream health checks against `/api/health`.
2. Enable HTTP/2 or HTTP/3 where supported; the telemetry and SSE endpoints benefit from persistent connections.
3. Mirror the CORS allow-list (`CORS_ALLOWED_ORIGINS`) in proxy-level rules if the proxy performs its own CORS validation.
4. Disable request/response body logging for paths that forward Supabase tokens (`/api/wallet`, `/api/tickets/**`, `/api/rewards/**`).

Following the above keeps the service-role key server-side and ensures local tooling (Storybook, Vite previews) continues to work through the
new origin normalisation helpers.
