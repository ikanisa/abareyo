# Admin CRUD Flow Recommendations

This document captures the recommended end-to-end interactions for the new reusable CRUD scaffolds (searchable data tables, create/edit modals, confirmation dialogs, and undo toasts). It is intended to be used by feature owners and QA when validating administrative modules that rely on the shared building blocks introduced in this iteration.

## Standard Journey: Search → Filter → Detail → Action

All admin tables should support a consistent journey: start with a keyword search, refine with facets, inspect record details, and finally execute a mutating action. The sequence diagram below illustrates how the shared `DataTable`, CRUD dialogs, and undo toasts coordinate across layers.

```mermaid
sequenceDiagram
    actor Admin
    participant DataTable
    participant ModuleController as Module Logic
    participant API

    Admin->>DataTable: Type search term
    DataTable-->>ModuleController: Debounced onSearchChange(term)
    ModuleController->>API: GET /resource?search=term&facets
    API-->>ModuleController: Results payload
    ModuleController-->>DataTable: data + meta + facets

    Admin->>DataTable: Adjust facet selection
    DataTable-->>ModuleController: onChange(facet)
    ModuleController->>API: GET /resource?page=1&facet=value
    API-->>ModuleController: Filtered payload
    ModuleController-->>DataTable: Updated table state

    Admin->>DataTable: Select row → open detail modal
    DataTable-->>ModuleController: setActive(record)

    Admin->>ModuleController: Trigger action
    ModuleController->>API: POST/PATCH /resource/{id}
    API-->>ModuleController: Success response
    ModuleController-->>Admin: CrudUndoToast(title, description, onUndo?)
```

## Module-Specific Flows

### Users Directory (Merge Accounts)

```mermaid
sequenceDiagram
    actor Admin
    participant MergeModal as CrudCreateEditModal
    participant Confirm as CrudConfirmDialog
    participant API

    Admin->>MergeModal: Enter primary + secondary IDs
    Admin->>MergeModal: Submit "Review merge"
    MergeModal-->>Confirm: Open confirmation dialog
    Confirm->>Admin: Display primary/duplicate summary
    Admin->>Confirm: Confirm merge
    Confirm->>API: POST /admin/api/users/directory
    API-->>Confirm: 200 OK
    Confirm-->>Admin: Close dialog + show undo toast
```

**QA checklist**

- Verify search is debounced (no more than one network request per 300 ms when typing).
- Attempt merge with missing IDs → modal should show validation toast and stay open.
- Confirm merge success produces undo toast; closing modal resets form fields.
- Dismissing confirmation dialog should not invoke the API.

### Ticket Orders (Refund Request)

```mermaid
sequenceDiagram
    actor Admin
    participant Table as DataTable
    participant Confirm as CrudConfirmDialog
    participant API

    Admin->>Table: Search or select status facet
    Table-->>API: GET /admin/ticket-orders
    Admin->>Table: Choose refund → open confirm dialog
    Confirm->>API: POST /admin/ticket-orders/{id}/refund
    API-->>Confirm: 200 OK
    Confirm-->>Admin: Show undo toast + refresh table
```

**QA checklist**

- Validate status facets disable while loading and reflect the active value.
- Confirm error state surfaces friendly messaging when API fails.
- Refund button should be disabled for non-paid orders and while a refund is in-flight.
- Undo toast appears after success and triggers a refresh when clicked.

### Services Dashboard (Insurance + Deposits)

```mermaid
sequenceDiagram
    actor Admin
    participant QuoteDrawer as CrudCreateEditModal
    participant Confirm as CrudConfirmDialog
    participant API

    Admin->>QuoteDrawer: Edit quote fields
    QuoteDrawer->>API: PATCH /admin/api/services/insurance
    API-->>QuoteDrawer: Updated quote
    QuoteDrawer-->>Admin: Undo toast (optional revert)

    Admin->>Confirm: Approve deposit confirmation
    Confirm->>API: PATCH /admin/api/services/sacco
    API-->>Confirm: Updated deposit
    Confirm-->>Admin: Undo toast with revert handler
```

**QA checklist**

- Editing a quote should persist changes and surface a toast with undo copy.
- Issuing a policy should refresh the list and expose a revert action in the toast.
- Deposit buttons must respect current status (disabled when already applied).
- Confirmation dialog spinner blocks double-submits while the API call is pending.

## Additional Notes

- Undo handlers are best-effort. Where full reversal is not available server-side, the toast still communicates success to align user expectations.
- Each module reuses the shared scaffolds—any regression fixes should happen inside the reusable components before applying local overrides.
