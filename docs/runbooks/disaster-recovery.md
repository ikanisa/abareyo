# Disaster Recovery Runbook

Use this runbook when a region-wide outage, data corruption event, or extended hosting failure threatens Rayon Sports digital services. It complements the Incident Response Runbook and provides the playbook for restoring platform availability and data integrity.

## 1. Objectives & Scope
- **Recovery Time Objective (RTO)**: 2 hours for fan-facing web and API surfaces.
- **Recovery Point Objective (RPO)**: 15 minutes for transactional data (wallet, ticketing) and 1 hour for content caches.
- **Covered systems**: Next.js frontend (Vercel), Supabase (Postgres + storage + edge functions), and the NestJS backend (Kubernetes deployment).

## 2. Prerequisites
- Backup automation verified via Supabase PITR snapshots and nightly S3 dumps of critical tables (`wallet_transactions`, `orders`, `missions`).
- Terraform/Kubernetes manifests stored in `k8s/` with parameterized secrets in the vault.
- Access to DNS registrar and Vercel project admin rights for failover updates.
- Runbook copies stored offline (PDF export) in the on-call vault.

## 3. Disaster Declaration & Leadership
1. Escalate to engineering manager and CTO when:
   - Production region unavailable for >15 minutes with no automated failover, or
   - Data integrity at risk (confirmed corruption or accidental destructive migrations).
2. Engineering manager declares **Disaster Recovery (DR) Mode** in Slack `#incident-response` and assigns roles:
   - **DR Lead** (usually on-call engineer)
   - **Comms Lead** (product/communications)
   - **Scribe** (records timeline and decisions in `reports/operations-log.md`)

## 4. Recovery Phases
### Phase A – Stabilize
- Freeze deployments and feature flag changes.
- Snapshot current state (database backups, Vercel deployment IDs, Kubernetes manifests) before applying recovery steps.
- Disable external integrations that may amplify issues (webhooks, payment retries) by toggling `MAINTENANCE_MODE` feature flag if necessary.

### Phase B – Restore Service
1. **Failover frontend**
   - Promote the warm standby Vercel project (`rayon-failover`) via the Vercel dashboard or `vercel promote` CLI.
   - Update DNS `CNAME` for `app.rayonsports.com` to point to failover deployment if traffic steering is manual.
2. **Restore backend APIs**
   - Apply the checked-in Kubernetes manifests to the standby cluster: `kubectl apply -f k8s/`.
   - Scale deployments: `kubectl scale deploy backend-api --replicas=3`.
   - Update secrets from the vault to ensure Supabase + payment credentials exist in the failover namespace.
3. **Recover database**
   - Use Supabase PITR to restore to the most recent snapshot within RPO.
   - Run data integrity scripts from `scripts/db/verify-integrity.sql` to validate row counts and referential checks.
   - Re-enable replication jobs to analytics warehouse after validation.

### Phase C – Validate
- Run smoke tests: `node scripts/preflight.mjs`, `npm run smoke:telemetry`, and manual wallet top-up flow.
- Confirm monitoring hooks (Grafana, Sentry) are pointed at failover environment.
- Send validation update to stakeholders using the communications template below.

### Phase D – Resume Normal Operations
- Monitor for 1 hour to ensure stability.
- Schedule root-cause analysis and remediation tasks.
- Plan failback to primary region once the root issue is resolved and data is reconciled.

## 5. Communications Templates
### Slack (internal)
```
:arrows_counterclockwise: DR Mode Update – {{incident_id}}
Failover target: {{region/platform}}
Current phase: {{Phase A/B/C/D}}
Key actions: {{bullet list of completed steps}}
Next milestone: {{time + owner}}
```

### Email (stakeholders & partners)
```
Subject: Disaster Recovery Update – {{incident_id}}

We initiated disaster recovery procedures at {{time}} due to {{root trigger}}.

Status:
- Frontend: {{status}}
- Backend API: {{status}}
- Database: {{status}}

Next update at {{time}}. Please route urgent customer communications through {{contact channel}}.

Regards,
{{Comms Lead}}
Rayon Sports Digital Ops
```

## 6. Quarterly Failover Drills
- **Schedule**: Conduct on the first Tuesday of each quarter at 10:00 EAT.
- **Preparation (T-7 days)**: Announce drill scope, confirm backups succeeded, and ensure failover environment is synced.
- **Execution**:
  1. Simulate region outage by draining traffic from primary Vercel project for 30 minutes.
  2. Execute Phase B steps against the staging environment to avoid customer disruption.
  3. Validate telemetry, smoke tests, and rollback readiness.
- **Review (T+1 day)**: Document lessons learned in `reports/operations-log.md` and update runbooks.
- **Success criteria**: Failover completed within 30 minutes, data diff < RPO window, and communications sent within 15 minutes of drill start.

## 7. Post-Recovery Checklist
- [ ] Systems stabilized and confirmed healthy for 60 minutes.
- [ ] Incident retrospective scheduled and calendar invite sent to stakeholders.
- [ ] Follow-up tasks created for infra gaps, automation improvements, and documentation updates.
- [ ] Runbook revisions merged into `main` and shared in `#on-call` Slack channel.

