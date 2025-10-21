# Supabase Function Shared Utilities

Shared helpers for edge functions live here. Each function should:

- Import the service-role client via `getServiceRoleClient()` to avoid duplicating
  credential loading logic or auth configuration.
- Use `requireEnv()` (from `env.ts`) for mandatory secrets so misconfiguration
  fails fast with a descriptive error.
- Prefer the HTTP helpers in `http.ts` (`requireMethod`, `parseJsonBody`, `json`,
  `jsonError`) to keep request validation and response formatting consistent.

These modules are Deno-compatible and rely exclusively on `Deno.env` and native
web APIs. Add new helpers here instead of copy/pasting into individual
functions.
