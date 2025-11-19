# Happy Path Runbook

Follow this checklist to provision local env vars, install dependencies, and run the core workflows with Supabase.

## 1) Provision `.env.local`
- Copy `.env.example` to `.env.local`.
- Populate Supabase keys (`SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `SUPABASE_PROJECT_REF`) plus app secrets (`SMS_WEBHOOK_TOKEN`, `SMS_INGEST_TOKEN`, `NEXT_PUBLIC_BACKEND_URL`, `NEXT_PUBLIC_ENVIRONMENT_LABEL`).
- Keep `.env.local` gitignored and override values only for your machine.

## 2) Install dependencies
- Use pnpm (via Corepack) to install workspace packages:

```bash
pnpm install
```

## 3) Start the web app
- Launch the Next.js dev server with hot reloading:

```bash
pnpm dev
```

## 4) Run quality gates
- Execute the static analysis and production build trio before pushing:

```bash
pnpm lint
pnpm type-check
pnpm build
```

## 5) Supabase lifecycle
- Start the local Supabase stack and apply schema/seed data:

```bash
supabase start
supabase migration up
supabase db seed
```

- Copy the printed credentials into `.env.local` if you plan to run the app against the local Postgres instance.
