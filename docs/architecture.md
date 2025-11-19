# Architecture Overview

```mermaid
flowchart LR
    User([Fan / Admin]) -->|HTTPS| Web[Next.js App Router]
    Web -->|APIs + Realtime| Supabase[(Supabase Postgres)]
    Web -->|Uploads| Storage[Supabase Storage]
    Web -->|Contracts| Contracts[@packages/contracts]
    Web -->|Shared Hooks| Lib[src/lib/*]
    Web -->|UI Primitives| Components[src/components/*]

    subgraph Supabase Stack
        Supabase -->|Policies| RLS[RLS + Policies]
        Supabase -->|Triggers| Functions[Edge Functions\n(sms-ingest, issue-policy, ops-digest)]
        Functions -->|Events| Supabase
        Functions -->|Files| Storage
    end

    subgraph Tooling
        Scripts[scripts/ & tools/] --> Functions
        Scripts --> Web
        K8s[k8s manifests] --> Web
        K8s --> Functions
    end
```

- **Web**: The Next.js App Router delivers the PWA UI for fans and admins, consuming typed contracts and shared UI primitives.
- **Supabase Stack**: Postgres with RLS policies is the system of record; Edge Functions process SMS/webhook inputs and emit realtime events back to clients.
- **Tooling**: Scripts, tools, and Kubernetes manifests orchestrate deployments and local preflight checks.
- **Storage**: Media uploads (shop assets, fundraising covers) live in Supabase Storage; functions can write files after validating payloads.

For deeper architectural decisions, reference the ADRs in [`docs/architecture/`](architecture/).

## Module boundaries & entry points

- **Path aliases**: `@/domains/*` hosts domain entry points for `auth`, `payments`, `ticketing`, and `commerce`. Each barrel re-exports the domain’s views and APIs so other areas do not reach into feature internals directly. Shared utilities stay in `src/lib`, `src/providers`, and `src/components`.
- **Backend access**: Frontend and shared packages must not import from `backend/` directly. Any legacy usage is gated through adapters exported from `@rayon/api/legacy-backend` (see `packages/api/src/legacy/backend.ts`).
- **Cross-domain imports**: Lint rules block domain modules from depending on one another; move reusable pieces to shared layers if a cross-cutting concern emerges.
- **Shared contracts**: Client domains may import type-safe shapes from `@rayon/contracts` and HTTP/Supabase helpers from `@rayon/api`, but `backend/` remains an implementation detail.
