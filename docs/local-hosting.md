# Local Hosting Playbook (macOS)

This guide summarises how to run the Rayon Sports platform entirely on a macOS workstation without depending on Vercel-hosted automations.

## 1. Base Tooling

1. Install Xcode Command Line Tools (required for native modules):
   ```bash
   xcode-select --install
   ```
2. Install Homebrew if it is not already present (`/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"`).
3. Install Node.js 20 via Corepack or Volta:
   ```bash
   brew install volta
   volta install node@20
   ```
   Corepack ships with Node ≥16; enable pnpm to match CI:
   ```bash
   corepack enable
   corepack prepare pnpm@10.5.2 --activate
   ```
4. Optional: install the Supabase CLI for local database + edge function workflows:
   ```bash
   brew install supabase/tap/supabase
   supabase --version
   ```

## 2. Dependency Installation

The repository now uses pnpm everywhere (CI, scripts, docs). After cloning:

```bash
pnpm install
```

pnpm writes a deterministic `pnpm-lock.yaml`; the GitHub Actions jobs run `pnpm install --frozen-lockfile` to guarantee parity with local builds.

## 3. Environment Files

Next.js loads secrets from `.env.local` before falling back to `.env`. Keep machine-specific values (tokens, test credentials) in `.env.local` so they are ignored by git. Recommended pattern:

```bash
cp .env.example .env.local
# edit values for your workstation
```

Key points:

- **Frontend** envs (`NEXT_PUBLIC_*`) are safe to check into `.env.local`; they are baked into the bundle during `pnpm build`.
- Backend/Supabase secrets should remain in `.env` or a secure secret manager if you share the project. Never commit service-role keys.
- When running Supabase locally, copy the generated credentials from `supabase start` into `.env.local` so the Next.js app and edge functions stay in sync.

## 4. Supabase and Local Services

- Start Supabase locally with `supabase start`; it spins up Postgres, auth, storage, and real-time services.
- Apply schema and seed data using the CLI:
  ```bash
  supabase migration up
  supabase db seed
  ```
- Edge functions can run locally with hot reload:
  ```bash
  supabase functions serve sms-webhook --env-file .env.local
  supabase functions serve issue-policy --env-file .env.local
  ```
- The Next.js dev server reads Supabase URLs/keys from `.env.local` when you launch `pnpm dev`.

## 5. Running the App

1. Start Supabase (local or remote) and ensure `.env.local` is populated.
2. Run `pnpm dev` for HMR or `pnpm build && pnpm start` to emulate production.
3. Visit <http://localhost:3000> for the fan experience or <http://localhost:3000/admin> for operator tools.

## 6. Why We Removed Vercel

Vercel-specific commands (`vercel pull`, cron jobs, preview deploys) added complexity and duplicated the same checks already running in CI. We now rely on pnpm-powered GitHub Actions (`.github/workflows/node-ci.yml` and `.github/workflows/preview.yml`) and provide local-first workflows for:

- Secret management via `.env.local` + Supabase CLI rather than `vercel env`.
- Scheduled work via Supabase (pg_cron, edge functions) or GitHub Actions schedules (see [`scripts/cron.md`](../scripts/cron.md)).
- Preview testing by running `pnpm build` locally or consuming the uploaded build artifact from the preview workflow.

The removal keeps local hosting self-contained and avoids hidden dependencies on the Vercel platform.
