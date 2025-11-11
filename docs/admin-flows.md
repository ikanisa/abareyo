# Admin UI Canonical Flows

This document captures the shared flows that drive the revamped admin surface. Each section includes a high-level Mermaid diagram and implementation notes referencing the new shared hooks and mutation helpers.

## Search + Filter Lifecycle

```mermaid
sequenceDiagram
    participant U as Admin User
    participant UI as Table UI
    participant Hook as useAdminSearch/useAdminFilters
    participant API as Admin API

    U->>UI: Type search term / select filter
    UI->>Hook: setSearch()/setFilter()
    Hook-->>Hook: Persist to URL + sessionStorage
    Hook-->>UI: Expose debouncedSearch + filters
    UI->>API: fetch list with debounced params
    API-->>UI: Return paginated dataset
    UI-->>U: Render rows + inline status
```

**Key points**

- `useAdminSearch` owns the debounced query, persistence, and URL synchronisation. Components pass `searchValue` back into `DataTable` for a controlled input.
- `useAdminFilters` keeps filter state in sync with query params and shares the same persistence contract.
- On every debounced change, tables reset to page 1 and trigger a fresh fetch.

## Standardised Mutation Pattern

```mermaid
flowchart LR
    Start[User action] --> useAdminMutation
    useAdminMutation -->|onMutate| Optimistic[Optimistic update]
    useAdminMutation -->|mutationFn| Server[API request]
    Server -->|Success| SuccessToast[(Toast + refresh)]
    Server -->|Error| Rollback[Rollback + error toast]
```

**Implementation notes**

- `useAdminMutation` centralises optimistic updates, toast copy, and rollback handling. It exposes `state` so row-level controls can surface inline loading/error states.
- Tables use `state.activeId` to disable buttons or inputs for the entity currently mutating.
- Success handlers trigger lightweight refresh helpers to keep local caches in sync.

## Operational Alert Drill-ins

```mermaid
sequenceDiagram
    participant Dashboard
    participant Admin
    participant Action
    participant Modal

    Dashboard->>Admin: Render alert with CTA
    Admin->>Action: Click link or "Investigate" button
    alt Link action
        Action->>Browser: Navigate to targeted surface
    else Modal action
        Action->>Modal: Open AdminBottomSheet with playbook
        Modal->>Admin: Show remediation steps + CTA link
    end
```

**Highlights**

- Alerts now describe both the issue and the next best action. Link actions deep-link into the relevant admin screen; modal actions open an `AdminBottomSheet` with investigative guidance and a contextual CTA.
- The `DashboardSnapshot` service annotates each alert with structured action metadata so the client can render consistent controls.
