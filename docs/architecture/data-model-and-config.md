# Data Model & Configuration Contract (Phase 1)

## Overview
This document formalizes the Phase-1 schema and runtime configuration required by the Rayon Sports Fan PWA backend. The model follows the MVP canvas and nests cleanly into NestJS modules.

## Core Entities
| Table | Purpose | Key Fields |
|-------|---------|------------|
| `users` | Guest-first user accounts with optional phone linkage. | `id uuid PK`, `created_at timestamptz`, `locale text default 'rw'`, `phone_mask text nullable`, `status enum('guest','linked')`, `preferred_zone text`, `fcm_token text nullable` |
| `matches` | Fixture catalogue leveraged by Home, Match Centre, Tickets. | `id uuid PK`, `opponent text`, `kickoff timestamptz`, `venue text`, `status enum('scheduled','live','finished','postponed')`, `competition text`, `created_at timestamptz` |
| `ticket_orders` | Basket for ticket purchases prior to payment confirmation. | `id uuid PK`, `user_id uuid FK`, `match_id uuid FK`, `total integer`, `status enum('pending','paid','cancelled','expired')`, `ussd_code text`, `sms_ref text`, `created_at timestamptz`, `expires_at timestamptz` |
| `ticket_order_items` | Zones/quantities within an order. | `id uuid PK`, `order_id uuid FK`, `zone text`, `price integer`, `quantity integer` |
| `ticket_passes` | Delivered passes with rotating QR tokens. | `id uuid PK`, `order_id uuid FK`, `zone text`, `gate text`, `qr_token_hash text`, `state enum('active','used','refunded')`, `activated_at timestamptz`, `consumed_at timestamptz` |
| `sms_raw` | Immutable log of modem inbound SMS. | `id uuid PK`, `received_at timestamptz`, `from_msisdn text`, `text text`, `sim_slot text`, `metadata jsonb`, `ingest_status enum('received','parsed','error')` |
| `sms_parsed` | OpenAI structured output + heuristics. | `id uuid PK`, `sms_id uuid FK`, `amount integer`, `currency text default 'RWF'`, `payer_mask text`, `ref text`, `timestamp timestamptz`, `confidence numeric(3,2)`, `parser_version text`, `parsed_payload jsonb` |
| `payments` | Unified ledger for tickets, memberships, shop, fundraising. | `id uuid PK`, `kind enum('ticket','membership','shop','donation')`, `status enum('pending','confirmed','failed','manual_review')`, `amount integer`, `currency text`, `sms_parsed_id uuid FK`, `order_id uuid nullable`, `membership_id uuid nullable`, `donation_id uuid nullable`, `metadata jsonb`, `confirmed_at timestamptz` |
| `membership_plans` | Catalogue of Gikundiro plans. | `id uuid PK`, `slug text unique`, `name text`, `price integer`, `perks jsonb`, `is_active boolean` |
| `memberships` | User subscriptions to plans. | `id uuid PK`, `user_id uuid FK`, `plan_id uuid FK`, `status enum('pending','active','expired','cancelled')`, `started_at timestamptz`, `expires_at timestamptz`, `auto_renew boolean default false` |
| `products` | Shop products. | `id uuid PK`, `name text`, `slug text unique`, `price integer`, `stock integer`, `images jsonb`, `category text`, `is_active boolean` |
| `orders` | Shop checkout container. | `id uuid PK`, `user_id uuid FK`, `total integer`, `status enum('pending','confirmed','cancelled')`, `shipping_address jsonb`, `created_at timestamptz` |
| `order_items` | Line items bound to `orders`. | `id uuid PK`, `order_id uuid FK`, `product_id uuid FK`, `qty integer`, `price integer` |
| `fund_projects` | Fundraising campaigns. | `id uuid PK`, `title text`, `description text`, `goal integer`, `progress integer`, `status enum('draft','active','completed')`, `cover_image text`, `created_at timestamptz` |
| `fund_donations` | Pledges/payments to projects. | `id uuid PK`, `project_id uuid FK`, `user_id uuid FK`, `amount integer`, `status enum('pending','confirmed','failed')`, `payment_id uuid nullable`, `created_at timestamptz` |
| `gamification_events` | Prediction/check-in/quiz events. | `id uuid PK`, `user_id uuid FK`, `kind enum('prediction','checkin','quiz','donation_bonus')`, `value integer`, `context jsonb`, `occurred_at timestamptz` |
| `leaderboards` | Aggregated points. | `period text PK`, `user_id uuid PK`, `points integer`, `rank integer`, `snapshot_at timestamptz` |
| `fan_clubs` | Community group metadata. | `id uuid PK`, `name text`, `region text`, `bio text`, `is_official boolean` |
| `fan_club_members` | Join table for clubs. | `fan_club_id uuid FK`, `user_id uuid FK`, `role enum('member','moderator','admin')`, `joined_at timestamptz`, `PRIMARY KEY(fan_club_id,user_id)` |
| `posts` | Community feed items (text/media). | `id uuid PK`, `author_id uuid FK`, `content text`, `media jsonb`, `visibility enum('public','club')`, `status enum('published','flagged','removed')`, `created_at timestamptz` |
| `post_reactions` | Likes, etc. | `post_id uuid FK`, `user_id uuid FK`, `kind enum('like','celebrate','wow')`, `created_at timestamptz`, `PRIMARY KEY(post_id,user_id)` |
| `polls` / `poll_options` / `poll_votes` | Structured fan polls. |
| `admin_actions` | Audit trail for manual reconciliation, moderation. | `id uuid PK`, `actor_id uuid FK`, `target_type text`, `target_id uuid`, `action text`, `details jsonb`, `created_at timestamptz` |

> Full Prisma DDL will codify the enums noted above. Time fields default to `now()` unless specified.

## Supporting Enums
```
enum PaymentStatus {
  pending
  confirmed
  failed
  manual_review
}

enum SmsIngestStatus {
  received
  parsed
  error
}

enum GamificationKind {
  prediction
  checkin
  quiz
  donation_bonus
}
```

Prisma schema will live under `backend/prisma/schema.prisma`, with migrations committed alongside application code.

## Relationships & Indexing
- Unique composite `(ticket_passes.qr_token_hash)` with rotation service updating hash every 30 seconds.
- Partial index on `payments(status = 'pending')` to optimise reconciliation queries.
- `sms_raw` retention policy handled via scheduled job (archive to S3 after 90 days).
- `leaderboards` aggregated nightly with materialized view option for faster reads.

## Environment Variable Contract
| Variable | Required | Description |
|----------|----------|-------------|
| `APP_BASE_URL` | ✅ | Public base URL for PWA used in manifest, deep links. |
| `BACKEND_BASE_URL` | ✅ | Base URL for Nest APIs consumed by frontend & mobile wrappers. |
| `DATABASE_URL` | ✅ | Postgres connection string (Prisma). |
| `DATABASE_SHADOW_URL` | ✅ | Shadow database for Prisma migrations (non-prod). |
| `REDIS_URL` | ✅ | Redis instance for BullMQ queues, caching, realtime presence. |
| `S3_ENDPOINT` | ✅ | S3-compatible endpoint (e.g., Cloudflare R2). |
| `S3_BUCKET` | ✅ | Bucket name for assets, QR exports, media. |
| `S3_REGION` | ✅ | Region/zone for S3 provider. |
| `S3_ACCESS_KEY_ID` | ✅ | Access credential. |
| `S3_SECRET_ACCESS_KEY` | ✅ | Secret credential. |
| `OPENAI_API_KEY` | ✅ | OpenAI Responses/Structured Output access. |
| `OPENAI_BASE_URL` | ⬜ | Optional override for Azure/OpenAI gateway. |
| `SMS_WEBHOOK_TOKEN` | ✅ | Shared secret used by GSM modem daemon when posting inbound SMS. |
| `JWT_SECRET` | ✅ | Placeholder for future auth; used for signed URLs (pass tokens). |
| `REALTIME_WS_ORIGIN` | ⬜ | Origin allow-list for WebSocket handshake (set in prod). |
| `FEATURE_FLAGS` | ⬜ | JSON blob toggling experimental UI. |
| `ANALYTICS_WRITE_KEY` | ⬜ | Segment/analytics write key (optional). |
| `LOG_LEVEL` | ⬜ | Default `info`; adjust per environment. |
| `QUEUE_SCHEDULER_DISABLED` | ⬜ | Set `true` in environments without background worker. |

### Environment Configuration
- Use Nest `@nestjs/config` to map env vars into typed `ConfigService` namespaces (`database`, `queue`, `openai`, `storage`, `sms`).
- Secrets managed via SSM/Secret Manager in prod; `.env` used only for local dev.
- Prisma `schema.prisma` will reference `env("DATABASE_URL")` and `env("DATABASE_SHADOW_URL")`.

## Next Actions
1. Scaffold `backend/` NestJS workspace with Prisma integration referencing this schema.
2. Generate initial Prisma migration (`202501131200_init`) and seed script for sample matches/products.
3. Mirror critical enums to a shared `packages/contracts` package for frontend TypeScript safety.
4. Configure Supabase (optional) or RDS/Cloud SQL with `pgcrypto` extension for UUID generation.
