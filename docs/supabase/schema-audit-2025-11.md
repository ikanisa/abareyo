# Supabase Domain Coverage Audit — November 2025

## Matches, Tickets, and Passes
- `public.matches` tracks opponent, kickoff, venue, and status fields; ticket orders and passes reference these IDs for seat assignment and QR issuance.【F:supabase/migrations/20251011000000_core.sql†L10-L37】
- Legacy MVP tables (`public.matches`, `public.tickets`) remain for historical parity with earlier mobile releases.【F:supabase/migrations/202510130001_mvp_schema.sql†L14-L35】

## Ticketing & Wallet Pass Experience
- Unified ticket orders record USSD codes and SMS references, while `public.ticket_passes` stores gate assignments and pass state for matchday validation.【F:supabase/migrations/20251011000000_core.sql†L18-L37】
- Wallet balances and transactions provide pass-adjacent ledger data for hybrid pay flows.【F:supabase/migrations/202510130001_mvp_schema.sql†L37-L52】

## Shop Inventory & Orders
- `public.shop_products` exposes name, category, pricing, inventory, and merchandising metadata with row-level security for read-only catalogues.【F:supabase/migrations/202510130001_mvp_schema.sql†L54-L76】
- Orders and order items capture totals, MoMo references, and fulfilment status for fan commerce flows.【F:supabase/migrations/20251011000000_core.sql†L99-L113】

## Services & Partner Offerings
- SACCO deposits, insurance quotes, and policies cover savings and insurance partner workflows, including premium thresholds for perk eligibility.【F:supabase/migrations/202510130001_mvp_schema.sql†L78-L106】
- Parsed SMS and payments tables bridge MoMo confirmations into ticket, membership, shop, and donation entities for downstream automation.【F:supabase/migrations/20251011000000_core.sql†L39-L71】

## Rewards & Perks
- `public.rewards_events` logs all point issuances with source attribution and metadata, backing perks issuance reporting.【F:supabase/migrations/202510130004_rewards_engine.sql†L1-L48】

## News, Community, and Content
- Content publishing surfaces rely on `public.content_items` with a `public_content` view for published articles, while `public.community_posts` handles moderated fan submissions.【F:supabase/migrations/202511010101_admin_panel_extension.sql†L261-L299】

## Members & Public Directory
- Membership plans and status records drive entitlements, and the `public.public_members` view exposes curated member profiles to the fan experience.【F:supabase/migrations/20251011000000_core.sql†L73-L88】【F:supabase/migrations/202511010101_admin_panel_extension.sql†L261-L270】
