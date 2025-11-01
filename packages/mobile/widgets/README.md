# Mobile Widgets Package

This package houses mobile-specific widget scaffolding used by the Rayon supporter app.

## Available Modules

- `TicketScannerWidget` – server-aware QR scanner shell gated behind the `features.ticketScanner` remote toggle.
- `TicketTransferWidget` – placeholder metadata for the ticket transfer entrypoint (`features.ticketTransferV2`).
- `CastingBroadcastWidget` – placeholder metadata for Chromecast/AirPlay surfaces (`features.streamingCast`).

## Feature Toggles

| Toggle Key | Default | Description | Rollout Notes |
| --- | --- | --- | --- |
| `features.ticketScanner` | `false` | Enables ticket QR scanning surfaces under `/tickets/scan`. | Roll out to venue staff cohorts once Supabase remote config table has matching rows. |
| `features.ticketTransferV2` | `false` | Unlocks richer transfer flows linking wallet history with receipts. | Coordinate with support to publish in-app education. |
| `features.streamingCast` | `false` | Exposes Chromecast/AirPlay casting hooks for live streams. | Requires CDN upgrade to support HLS multi-bitrate manifests. |

Rollouts are configured in Supabase via the `feature_flags` table and, optionally, the `remote_config` table for staged cohorts. Stakeholders should update the docs in `plans/future/` before toggling production users.
