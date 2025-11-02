# Quarterly Dependency Review Cadence

_Last updated: 2025-10-29_

## Purpose
Ensure production dependencies remain secure, supported, and aligned with release management expectations by enforcing a predictable review cycle backed by branch protection rules and automated checks.

## Schedule
- **Cadence**: Quarterly (January, April, July, October)
- **Window**: First full week of the month
- **Owner**: Platform engineering (primary) with security sign-off
- **Kickoff Checklist**:
  1. Create GitHub issue using `plans/templates/dependency-review.md`
  2. Assign engineer + reviewer + security approver
  3. Link latest SBOM + license scan artifacts from `report/sbom/`

## Tooling
- **Renovate** for JavaScript/TypeScript workspaces (`renovate.json`)
- **Dependabot** for GitHub Actions (`.github/dependabot.yml`)
- **License enforcement** via `npm run check:licenses`
- **SBOM generation** via `npm run sbom`

## Process
1. **Automated PRs**
   - Ensure Renovate and Dependabot schedules are aligned to the quarterly window.
   - Allow automation to raise PRs for minor/patch updates; major upgrades require manual RFC.
2. **Triage & Testing**
   - Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run sbom` for each dependency PR.
   - For backend upgrades, run `npm ci` in `backend/` plus `npm run check:licenses`.
3. **Security Review**
   - Verify `npm audit` / `pnpm audit` output for newly introduced risks.
   - Export updated SBOM + license scan and attach to tracking issue.
4. **Merge & Release**
   - Require at least one approving review from security or platform engineering.
   - Merge behind feature flag or progressive rollout if impact is high.
   - Document release notes in `changelogs/` as part of PR template.

## Branch Protection Rules
- Enforced on `main`:
  - ✅ Status checks: `lint`, `typecheck`, `test`, `node-ci`, `deploy`
  - ✅ Require signed commits
  - ✅ Require linear history (squash or rebase)
  - ✅ Require code owner review for `package.json`, `package-lock.json`, `backend/package.json`

## Release Expectations
- Publish a short summary in the deployment ticket linking:
  - GitHub issue tracking the quarterly review
  - SBOM + provenance bundles from GitHub Actions (`web-mobile-supply-chain`, `backend-supply-chain`)
  - License compliance report (`report/sbom/license-scan.json`)
- Update `docs/runbooks/on-call-enablement-checklist.md` if new runtime observability secrets are introduced.

## Escalation
- **Blocking vulnerabilities** (high/critical): escalate to security lead immediately; hotfix outside cadence is permitted.
- **Breaking changes**: open RFC in `plans/` with migration plan before merging.
- **Missed window**: report in engineering weekly sync; reschedule within two weeks.

## References
- Deployment runbooks: `DEPLOYMENT_CHECKLIST.md`, `DEPLOYMENT_QUICKSTART.md`
- Supply chain artifacts: `report/sbom/`
- License policy: `config/compliance/license-policies.json`
