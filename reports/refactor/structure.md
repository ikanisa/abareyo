# Transitional Repository Layout

The refactor introduces a workspace boundary that co-exists with the legacy monorepo surface. The following summary captures the current state so that teams can plan incremental migrations.

## Legacy Entry Points

- **`app/`** – continues to host the production Next.js experience, including all customer and admin routes.
- **`packages/mobile`**, **`ios/`**, **`android/`** – remain the source of truth for the native and hybrid mobile deliverables.
- **`docs/` (existing content)** – retains historical runbooks, ADRs, and operational notes until the new documentation pipeline is online.

## New Workspaces

- **`packages/config`** – placeholder for shared runtime configuration modules that will eventually replace ad-hoc imports from `src/config`.
- **`packages/ui`** – staging area for the component system that will be elevated out of `src/components` once parity is validated.
- **`packages/api`** – reserved for typed API clients and SDK exports aligned with backend contracts.
- **`apps/web`** – future home of the Next.js application once the monolith is decomposed.
- **`apps/admin`** – will encapsulate the standalone admin dashboard after feature parity reviews.
- **`apps/mobile`** – planned workspace for Expo/React Native sources that presently live under `packages/mobile`.
- **`docs/package.json`** – introduces tooling scaffolding for documentation automation while the markdown corpus remains untouched.

## Migration Notes

- No source files were moved as part of this transition; existing build and deployment pipelines remain unaffected.
- Each new workspace is private and versioned at `0.0.0` to prevent accidental publication before the refactor completes.
- Future commits should update this report as individual domains reach production readiness.
