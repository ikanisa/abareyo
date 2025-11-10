# Security Controls Overview

This directory centralizes Rayon Sports' operational security references. It extends [`docs/security.md`](../security.md) with
implementation-level controls, verification cadences, and links to deeper runbooks.

## Current Control Catalog

| Domain | Control | Coverage | Verification |
| --- | --- | --- | --- |
| Dependency hygiene | GitHub Advanced Security dependency review + Snyk (`security-scans.yml`) | Pull requests, nightly cron | CI must pass and Dependabot alerts triaged within 2 business days |
| Secret exposure | Gitleaks SARIF upload to GitHub Security (`security-scans.yml`) | Full git history on PRs, nightly cron | `reports/sbom/gitleaks.sarif` must be empty; findings open SEC tickets |
| RBAC | Admin session guard normalizes immutable permission sets (`admin-session.guard.ts`) | All admin Fastify requests | Jest specs `admin-session.guard.spec.ts`, `admin-permissions.guard.spec.ts` |
| Auditability | Admin refund flow records structured audit logs (`admin-orders.controller.ts`) | Ticket refunds + privileged mutations | Jest spec `admin-orders.controller.spec.ts` + manual spot checks |

Additional dynamic testing and response procedures live alongside this README:

- [`penetration-testing-report.md`](penetration-testing-report.md) – OWASP-aligned assessment results and remediation tracking.
- [`incident-response-playbooks.md`](incident-response-playbooks.md) – step-by-step guidance for common security incidents.

## Operational Expectations

1. **Security CI must stay green** before merging to `main`. Investigate dependency or secret-scan failures immediately and file
   follow-up remediation tickets captured in the penetration test report.
2. **RBAC regressions** require both automated test coverage and audit log verification. Extend the guard specs whenever new
   permission surfaces are introduced.
3. **Document updates** – any change to security posture should update this directory and the higher-level overview in
   [`docs/security.md`](../security.md).

For change control, continue to enforce dual-review with security sign-off for items tagged `security-critical` in the release
board.
