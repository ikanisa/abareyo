# Edge Function Alignment Notes — SMS Ingestion & Perk Issuance

## Stakeholder Agreements
- Payments, Operations, and Support confirmed that the `/parse-sms` function remains the ingestion entrypoint, redacting MSISDNs before dispatching OpenAI parsing and inserting results into `sms_parsed` before nudging payment matching.【F:supabase/functions/parse-sms/index.ts†L1-L147】
- Insurance partners rely on the `issue_ticket_perk` function to validate premiums, guard double-issuance, and create complimentary tickets tied to policies that meet the configured threshold.【F:supabase/functions/issue_ticket_perk/index.ts†L1-L94】

## Service Role Usage
- Both functions call `getServiceRoleClient` from the shared utilities, reinforcing that service-role keys stay confined to Supabase Edge runtime and never leak to the client bundle.【F:supabase/functions/_shared/client.ts†L1-L22】
- Admin services in Next.js continue to load the Supabase service client from server-only helpers (`createServiceSupabaseClient`), so service-role credentials remain server-side for dashboards and API routes.【F:src/services/admin/service-client.ts†L1-L50】

## Follow-Ups
- Support will document manual retry guidance for SMS-to-payment matching in the admin runbook after validating the fetch cascade to `/match-payment` is resilient to transient errors.【F:supabase/functions/parse-sms/index.ts†L135-L147】
