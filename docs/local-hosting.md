# Local Hosting Runbook

This guide documents how to run the Rayon Sports PWA on a MacBook using the pnpm-based toolchain and Supabase-backed services.

## Prerequisites
- Apple Silicon MacBook with macOS 13+
- [Homebrew](https://brew.sh/) with `corepack` and the Supabase CLI installed:
  ```bash
  brew install corepack supabase/tap/supabase
  corepack enable
  corepack prepare pnpm@9.12.2 --activate
  ```
- Node.js 20.x (install via `nvm`, `asdf`, or `fnm`; `.nvmrc` pins the desired version).
- Supabase CLI authenticated (`supabase login`).

## Environment Files
Create a project-wide `.env` that mirrors the keys listed in the README. For machine-specific overrides, create `.env.local` in the repo root (it is gitignored) and populate values such as:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_PUBLISHABLE_KEY=public-anon-key
SUPABASE_SECRET_KEY=service-role-key
SUPABASE_PROJECT_REF=your-project-ref
SMS_WEBHOOK_TOKEN=dev-token
NEXT_PUBLIC_BACKEND_URL=http://localhost:3000
NEXT_PUBLIC_ENVIRONMENT_LABEL=local
```

`.env.local` overrides `.env` when both exist—use it for staging credentials, experimental webhook tokens, or local Cloudflare Tunnel hostnames.

## Install & Build
Install dependencies and compile the production bundle with pnpm:

```bash
pnpm install
pnpm build
```

The build step runs `next build` and validates that generated assets are ready for hosting.

## Start the App
Launch the production server on port 3000:

```bash
pnpm start
```

For iterative development use `pnpm dev`, which enables Hot Module Reloading and Supabase realtime previews.

## Supabase & Data
1. Start the Supabase stack locally (or target a remote project):
   ```bash
   supabase start
   ```
2. Apply migrations and seed baseline data:
   ```bash
   supabase migration up
   supabase db seed
   ```
3. Serve any required Edge Functions for payment automation:
   ```bash
   supabase functions serve sms-webhook --env-file .env.local
   supabase functions serve issue-policy --env-file .env.local
   ```

`pnpm lint`, `pnpm type-check`, and `pnpm test` mirror CI signals—run them before publishing containers or Supabase function updates.

## Reverse Proxy Roadmap
The app currently binds directly to port 3000. Upcoming infrastructure work will introduce a reverse proxy layer (evaluating [Caddy](https://caddyserver.com/) and [Cloudflare Tunnel](https://www.cloudflare.com/products/tunnel/)) to manage TLS, HTTP/3, and zero-trust ingress. No proxy configuration is required yet, but reserve ports 443/8443 locally to avoid conflicts when the integration ships.
