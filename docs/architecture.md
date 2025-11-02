# Architecture Overview

```mermaid
flowchart TD
    subgraph Client Apps
        A[Next.js App Router]
        B[Capacitor Shells]
    end

    subgraph Shared Packages
        C[@packages/contracts]
        D[src/lib/*]
        E[src/components/*]
    end

    subgraph Supabase
        F[(Postgres + Row Level Security)]
        G[Edge Functions\n(sms-ingest, issue-policy, ops-digest)]
        H[Storage Buckets]
    end

    subgraph Tooling
        I[scripts/ & tools/]
        J[k8s manifests]
    end

    A --> C
    A --> D
    A --> G
    B --> A
    B --> C
    C --> F
    D --> F
    G --> F
    G --> H
    I --> G
    J --> A
    J --> G
```

- **Client Apps**: The Next.js App Router provides the core PWA experience consumed by mobile and desktop browsers. Capacitor shells embed the same UI for Android/iOS distribution.
- **Shared Packages**: Type-safe contracts and UI primitives shared between app layers. Packages are published from the monorepo and bundled via pnpm workspaces.
- **Supabase**: Central data plane with Postgres, Edge Functions, and Storage. Edge Functions process SMS/webhook inputs and emit realtime updates consumed by the clients.
- **Tooling**: Deployment tooling includes scripts for preflight checks, Supabase operations, and Kubernetes manifests used for container-based hosting.

For deeper architectural decisions, reference the ADRs in [`docs/architecture/`](architecture/).
