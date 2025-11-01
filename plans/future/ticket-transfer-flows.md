# Ticket Transfer Flow Enhancements

## Vision
Allow supporters to share, claim, and audit match tickets with end-to-end transparency tied to wallet history and QR code lifecycle events.

## Remote Controls
- **Feature flag:** `features.ticketTransferV2`
- **Remote config:** `rollouts.ticketTransferV2` (enum: `staff`, `beta`, `general`)

## Dependencies
- Wallet service must emit transfer events to Supabase `ticket_transfers` table for audit trails.
- Notifications service requires new templates for claim confirmations and reminders.
- Support tooling needs exportable CSV reports combining transfers with entry scans.

## Rollout Strategy
1. **Staff validation:** enable flag for internal team, focusing on reversing transfers and refund scenarios.
2. **Member beta:** allow season ticket holders to invite guests; monitor Supabase row-level security enforcement.
3. **General availability:** open to all, ensure Supabase triggers backfill historical transfers for analytics.

## Stakeholder Notes
- Update help center articles with new walkthrough gifs.
- Finance team should sign off on revenue recognition implications before mass rollout.
