-- Harden row level security across high-risk tables.
-- This migration assumes Supabase defaults where the service_role bypasses RLS.

-- USERS
alter table if exists public.users enable row level security;
drop policy if exists p_users_self_select on public.users;
drop policy if exists p_users_self_update on public.users;
create policy p_users_self_select on public.users
  for select
  using (auth.uid() = id);
create policy p_users_self_update on public.users
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- TICKET ORDERS
alter table if exists public.ticket_orders enable row level security;
drop policy if exists p_user_owns_orders on public.ticket_orders;
drop policy if exists p_ticket_orders_select_own on public.ticket_orders;
drop policy if exists p_ticket_orders_mutate_own on public.ticket_orders;
create policy p_ticket_orders_select_own on public.ticket_orders
  for select
  using (auth.uid() = user_id);
create policy p_ticket_orders_mutate_own on public.ticket_orders
  for update
  using (auth.uid() = user_id or user_id is null)
  with check (auth.uid() = user_id or user_id is null);

-- Allow inserts only when the caller owns the order or the order is anonymous.
drop policy if exists p_ticket_orders_insert_own on public.ticket_orders;
create policy p_ticket_orders_insert_own on public.ticket_orders
  for insert
  with check (auth.uid() = user_id or user_id is null);

-- TICKET PASSES (derived from orders)
alter table if exists public.ticket_passes enable row level security;
drop policy if exists p_user_owns_passes on public.ticket_passes;
drop policy if exists p_ticket_passes_select_own on public.ticket_passes;
create policy p_ticket_passes_select_own on public.ticket_passes
  for select
  using (
    exists (
      select 1
      from public.ticket_orders o
      where o.id = order_id
        and (o.user_id = auth.uid())
    )
  );

-- PAYMENTS (service-only access)
alter table if exists public.payments enable row level security;
drop policy if exists p_payments_public_read on public.payments;
drop policy if exists p_payments_public_write on public.payments;
create policy p_payments_deny_clients on public.payments
  for all
  using (false)
  with check (false);

-- MEMBERSHIPS
alter table if exists public.memberships enable row level security;
drop policy if exists p_memberships_select_owner on public.memberships;
drop policy if exists p_memberships_mutate_owner on public.memberships;
create policy p_memberships_select_owner on public.memberships
  for select
  using (auth.uid() = user_id);
create policy p_memberships_mutate_owner on public.memberships
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ORDERS
alter table if exists public.orders enable row level security;
drop policy if exists p_orders_select_owner on public.orders;
drop policy if exists p_orders_mutate_owner on public.orders;
create policy p_orders_select_owner on public.orders
  for select
  using (auth.uid() = user_id);
create policy p_orders_mutate_owner on public.orders
  for update
  using (auth.uid() = user_id or user_id is null)
  with check (auth.uid() = user_id or user_id is null);
drop policy if exists p_orders_insert_owner on public.orders;
create policy p_orders_insert_owner on public.orders
  for insert
  with check (auth.uid() = user_id or user_id is null);

-- ORDER ITEMS (join to parent order)
alter table if exists public.order_items enable row level security;
drop policy if exists p_order_items_select_owner on public.order_items;
create policy p_order_items_select_owner on public.order_items
  for select
  using (
    exists (
      select 1
      from public.orders o
      where o.id = order_id
        and (o.user_id = auth.uid())
    )
  );

-- FUND DONATIONS
alter table if exists public.fund_donations enable row level security;
drop policy if exists p_fund_donations_select_owner on public.fund_donations;
drop policy if exists p_fund_donations_insert_owner on public.fund_donations;
drop policy if exists p_fund_donations_mutate_owner on public.fund_donations;
create policy p_fund_donations_select_owner on public.fund_donations
  for select
  using (auth.uid() = user_id);
create policy p_fund_donations_insert_owner on public.fund_donations
  for insert
  with check (auth.uid() = user_id or user_id is null);
create policy p_fund_donations_mutate_owner on public.fund_donations
  for update
  using (auth.uid() = user_id or user_id is null)
  with check (auth.uid() = user_id or user_id is null);

-- WALLET & TRANSACTIONS
alter table if exists public.wallets enable row level security;
drop policy if exists p_wallets_select_owner on public.wallets;
create policy p_wallets_select_owner on public.wallets
  for select
  using (auth.uid() = user_id);

alter table if exists public.transactions enable row level security;
drop policy if exists p_transactions_select_owner on public.transactions;
create policy p_transactions_select_owner on public.transactions
  for select
  using (auth.uid() = user_id);

-- SACCO DEPOSITS
alter table if exists public.sacco_deposits enable row level security;
drop policy if exists p_sacco_deposits_select_owner on public.sacco_deposits;
drop policy if exists p_sacco_deposits_insert_owner on public.sacco_deposits;
create policy p_sacco_deposits_select_owner on public.sacco_deposits
  for select
  using (auth.uid() = user_id);
create policy p_sacco_deposits_insert_owner on public.sacco_deposits
  for insert
  with check (auth.uid() = user_id or user_id is null);

-- INSURANCE
alter table if exists public.insurance_quotes enable row level security;
drop policy if exists p_insurance_quotes_select_owner on public.insurance_quotes;
drop policy if exists p_insurance_quotes_mutate_owner on public.insurance_quotes;
create policy p_insurance_quotes_select_owner on public.insurance_quotes
  for select
  using (auth.uid() = user_id);
create policy p_insurance_quotes_mutate_owner on public.insurance_quotes
  for update
  using (auth.uid() = user_id or user_id is null)
  with check (auth.uid() = user_id or user_id is null);
drop policy if exists p_insurance_quotes_insert_owner on public.insurance_quotes;
create policy p_insurance_quotes_insert_owner on public.insurance_quotes
  for insert
  with check (auth.uid() = user_id or user_id is null);

alter table if exists public.policies enable row level security;
drop policy if exists p_policies_select_owner on public.policies;
create policy p_policies_select_owner on public.policies
  for select
  using (
    exists (
      select 1
      from public.insurance_quotes q
      where q.id = quote_id
        and (q.user_id = auth.uid())
    )
  );

-- COMMUNITY POSTS
alter table if exists public.fan_posts enable row level security;
drop policy if exists p_fan_posts_public_read on public.fan_posts;
drop policy if exists p_fan_posts_insert_owner on public.fan_posts;
drop policy if exists p_fan_posts_mutate_owner on public.fan_posts;
create policy p_fan_posts_public_read on public.fan_posts
  for select
  using (true);
create policy p_fan_posts_insert_owner on public.fan_posts
  for insert
  with check (auth.uid() = user_id);
create policy p_fan_posts_mutate_owner on public.fan_posts
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- GAMIFICATION
alter table if exists public.gamification_events enable row level security;
drop policy if exists p_gamification_events_select_owner on public.gamification_events;
create policy p_gamification_events_select_owner on public.gamification_events
  for select
  using (auth.uid() = user_id);

alter table if exists public.leaderboards enable row level security;
drop policy if exists p_leaderboards_public_read on public.leaderboards;
create policy p_leaderboards_public_read on public.leaderboards
  for select
  using (true);

-- DEFAULT fallbacks for tables that should remain service-only must deny anonymous access.
alter table if exists public.sms_raw enable row level security;
alter table if exists public.sms_parsed enable row level security;
drop policy if exists p_sms_raw_service_only on public.sms_raw;
drop policy if exists p_sms_parsed_service_only on public.sms_parsed;
create policy p_sms_raw_service_only on public.sms_raw
  for all
  using (false)
  with check (false);
create policy p_sms_parsed_service_only on public.sms_parsed
  for all
  using (false)
  with check (false);

