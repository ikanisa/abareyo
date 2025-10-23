# Repository Guidelines

## Project Structure & Module Organization
- `app/` hosts the Next.js App Router surface (layouts, route groups, client wrappers such as `_components/BottomNavContainer.tsx`). Treat anything under `app/_components` as client-only UI and keep server logic in route files.
- Shared logic lives in `src/` (`lib/` for utilities, `providers/` for context, `components/` for reusable UI, `config/` for typed configuration). Import these via the configured path aliases (e.g., `@/lib/observability`).
- Unit tests reside in `tests/unit`, Playwright specs in `tests/e2e`, and infra scripts in `scripts/` and `tools/`. Shared contracts are published from `packages/contracts`.
- Operational assets are in `backend/` (Prisma, REST helpers) and `k8s/` for deployment manifests; update both when backend schemas change.

## Build, Test, and Development Commands
- `npm run dev` (or `make dev`) launches the frontend with Hot Module Reloading.
- `npm run build` runs `next build` and is the deployment parity check; ensure it stays green before pushing.
- `npm run start` serves the production bundle locally.
- `npm run lint`, `npm run type-check`, and `npm run test` (Vitest + type check) are required pre-merge quality gates; use `npm run test:e2e` for Playwright suites.
- For backend migrations use `make backend-migrate`; seed data locally with `make backend-seed`.

## Coding Style & Naming Conventions
- All code is TypeScript with module resolution via path aliases; prefer explicit exports and avoid default exports outside React components.
- Follow ESLint (Next.js config) and Tailwind conventions: components and hooks are `PascalCase.tsx`/`camelCase.ts`, function names use present-tense verbs, and locale-aware routes live under `app/(routes)/`.
- Keep client components annotated with `"use client"` and colocate UI state in `_components/ui`; server code must remain dependency-free of browser APIs.

## Testing Guidelines
- Unit tests use Vitest + Testing Library (`*.test.tsx` or `.test.ts`) and should mirror the source directory structure.
- E2E coverage relies on Playwright in `tests/e2e`; set `E2E_API_MOCKS=1` to exercise mocked backend flows.
- Failing tests block CI; include regression coverage whenever fixing bugs or expanding navigation/locale behavior.

## Commit & Pull Request Guidelines
- Commit messages are imperative and scoped (e.g., `Fix home route manifest path for reverse proxy`, `feat: finalize p3 resiliency and ops docs`). Stick to one functional change per commit.
- PRs must include: concise summary, linked issue or plan entry, test evidence (`npm run build`, relevant suites), and screenshots for UI-facing changes (especially navigation and admin surfaces).
- Flag configuration updates (env keys like `NEXT_PUBLIC_BACKEND_URL`) and coordinate with the infrastructure owners before merging.
