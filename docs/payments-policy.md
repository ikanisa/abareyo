# Payments Policy

This policy governs the handling of ticketing, merchandise, insurance, and SACCO payments processed through the Rayon Sports Digital Platform.

## Scope

- Mobile money (MTN MoMo, Airtel Money)
- USSD initiated purchases and SACCO deposits
- Insurance premium issuance
- Admin-side adjustments and manual reconciliations

## Principles

1. **Payment-first UX** – Customers always receive confirmation via SMS/WhatsApp before UI updates are considered complete.
2. **Data integrity** – All confirmed transactions must be written to Supabase with traceable audit metadata.
3. **Compliance** – Follow national banking and SACCO regulations for KYC, AML, and record retention.
4. **Separation of duties** – Manual overrides require a second reviewer from the finance team.

## Required Secrets

| Secret | Purpose | Location |
| --- | --- | --- |
| `SMS_WEBHOOK_TOKEN` | Authenticates inbound SMS payloads to the Edge Function. | `.env.local`, staging/production secret store |
| `SMS_INGEST_TOKEN` | Enables manual SMS ingestion tooling. | Same as above |
| `MOMO_WEBHOOK_SECRET` | Validates MTN/Airtel webhook signatures. | Stored per-environment |
| `USSD_CALLBACK_SECRET` | Signs USSD callback payloads. | Stored per-environment |
| `PAYMENTS_RECONCILIATION_WEBHOOK` | Notifies finance bots of daily reconciliation status. | Production only |

Secrets must follow the rotation cadence defined in [`docs/env.md`](env.md#secret-management-policy).

## Data Flow

1. Fan triggers a payment via the PWA or USSD menu.
2. MTN/Airtel sends an SMS or webhook to Supabase Edge Functions (`sms-ingest`, `issue-perk`, `issue-policy`).
3. Functions validate payload signatures, persist the transaction record, and enqueue notifications.
4. Next.js clients subscribe to Supabase channels and reflect the new state; manual overrides happen via `/admin/sms`.

The architecture diagram in [`docs/architecture.md`](architecture.md) shows how these functions relate to the core application packages.

## Reconciliation & Auditing

- Use `node tools/gsm-emulator/send-sms.js` for local testing; production data should never be reprocessed locally.
- Finance receives nightly digests via the `ops-digest` Edge Function.
- Admins can mark disputes in the `/admin/payments` view; each dispute requires a Jira ticket link.
- Store reconciliation exports in the secure `supabase.storage.payments-exports` bucket.

## Manual Overrides

- Allowed only when automated ingestion fails or fraud review flags the transaction.
- Require two-step approval: submitter (ops) + approver (finance lead).
- Document overrides in the ledger table with fields: `reason`, `approver_id`, `source_reference`.

## Refunds

- Initiate via telco portals; annotate Supabase records with the refund reference and timestamp.
- Trigger the `payments:refund` webhook to notify CRM integrations.

## Compliance & Retention

- Retain transaction records for 7 years.
- Mask personally identifiable information when exporting to CSV (`phone` truncated to last four digits).
- Access logs must be retained for at least 12 months for audits.

## Incident Handling

- Follow [`docs/runbooks/disaster-recovery.md`](runbooks/disaster-recovery.md) for platform-wide outages.
- For suspected payment fraud, escalate to finance leadership and follow the telecom dispute process within 24 hours.
- After resolution, document findings in the `audit/payments/` directory and update regression tests if applicable.

## Related Resources

- [`docs/security.md`](security.md)
- [`docs/runbooks/web.md`](runbooks/web.md)
- [`docs/runbooks/mobile.md`](runbooks/mobile.md)
- [`docs/release.md`](release.md)
