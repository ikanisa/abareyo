# Phase 7 – Acceptance & Training (Status: Oct 18 2025)

## Acceptance testing
- Plan a full match-cycle (pre-match → live → post-match) test with realistic data.
- Rehearse workflows: ticket purchase, wallet top-up, insurance policy issuance, MoMo webhooks, admin moderation.
- Verify RLS policies by exercising partner/admin/fan roles.

## Training & runbooks
- Run tabletop incident drills covering payment outage, real-time feed failure, and admin auth lockout.
- Review runbooks (`docs/runbooks/operations.md`, `deploy.md`, `rollback.md`) with Ops team; update gaps.
- Provide training on new Edge Functions & observability dashboards (Grafana/Prometheus).

## KPIs & monitoring
- Establish baseline KPIs: HTTP error rate, p95 latency, queue depth, payment success rate, ticket issuance time.
- Set up dashboards and alert routing for matchday monitoring; confirm on-call rotation.
- Monitor Supabase logs/metrics for at least one full match-cycle before launch.

## Documentation & knowledge transfer
- Compile admin training materials (login, password reset, session revocation).
- Update Supabase dashboard usage guide (auth provider switches, vault secrets, edge functions).
- Record video walkthroughs or workshops for staff (using `docs/workshops/`).

## Outstanding actions
1. Schedule acceptance tests and assign owners.
2. Conduct tabletop drills and log outcomes.
3. Finalize KPI dashboards and alerting.
4. Deliver training sessions and collect feedback.
5. Validate all documentation is discoverable (link from onboarding portal).
6. Replace any hard-coded user IDs in Edge Functions, scheduled jobs, or seeds with role-based lookups aligned to the approved acceptance scenarios.
7. Wire the admin tooling (feature flag panel, RLS overrides, audit exports) into the acceptance walkthrough so operators can rehearse the end-to-end flows without manual database edits.
