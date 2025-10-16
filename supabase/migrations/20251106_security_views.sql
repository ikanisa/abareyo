set search_path = public;

-- Harden RLS across core tables with defensive checks.
do $$
declare
  tbl text;
  tables text[] := array[
    'users',
    'matches',
    'ticket_orders',
    'ticket_order_items',
    'ticket_passes',
    'tickets',
    'orders',
    'order_items',
    'shop_products',
    'shop_promotions',
    'payments',
    'rewards_events',
    'wallet',
    'transactions',
    'sacco_deposits',
    'insurance_quotes',
    'policies',
    'fan_posts',
    'fan_clubs',
    'polls',
    'sms_raw',
    'sms_parsed',
    'membership_plans',
    'memberships',
    'fund_projects',
    'fund_donations',
    'gamification_events',
    'leaderboards',
    'match_zones',
    'match_gates',
    'admin_users',
    'admin_roles',
    'admin_users_roles',
    'admin_sessions',
    'permissions',
    'roles_permissions',
    'audit_logs',
    'feature_flags',
    'translations',
    'products'
  ];
begin
  foreach tbl in array tables loop
    if to_regclass(format('public.%I', tbl)) is not null then
      execute format('alter table public.%I enable row level security;', tbl);
      execute format('alter table public.%I force row level security;', tbl);
      execute format('drop policy if exists p_service_role_all on public.%I;', tbl);
      execute format(
        'create policy p_service_role_all on public.%I for all using (coalesce(auth.jwt()->>''role'', '''') = ''service_role'') with check (coalesce(auth.jwt()->>''role'', '''') = ''service_role'');',
        tbl
      );
    end if;
  end loop;
end $$;

-- Public read policies where appropriate.
do $$
begin
  if to_regclass('public.matches') is not null then
    execute 'drop policy if exists p_matches_public_select on public.matches';
    execute 'create policy p_matches_public_select on public.matches for select using (true)';
  end if;

  if to_regclass('public.shop_products') is not null then
    execute 'drop policy if exists p_shop_products_public_select on public.shop_products';
    execute 'create policy p_shop_products_public_select on public.shop_products for select using (true)';
  end if;

  if to_regclass('public.shop_promotions') is not null then
    execute 'drop policy if exists p_shop_promotions_public_select on public.shop_promotions';
    execute 'create policy p_shop_promotions_public_select on public.shop_promotions for select using (now() between (starts_at - interval ''14 days'') and (ends_at + interval ''14 days''))';
  end if;

  if to_regclass('public.fan_clubs') is not null then
    execute 'drop policy if exists p_fan_clubs_public_select on public.fan_clubs';
    execute 'create policy p_fan_clubs_public_select on public.fan_clubs for select using (true)';
  end if;

  if to_regclass('public.fan_posts') is not null then
    execute 'drop policy if exists p_fan_posts_public_select on public.fan_posts';
    execute 'create policy p_fan_posts_public_select on public.fan_posts for select using (true)';
  end if;

  if to_regclass('public.polls') is not null then
    execute 'drop policy if exists p_polls_public_select on public.polls';
    execute 'create policy p_polls_public_select on public.polls for select using (coalesce(active, true))';
  end if;

  if to_regclass('public.fund_projects') is not null then
    execute 'drop policy if exists p_fund_projects_public_select on public.fund_projects';
    execute 'create policy p_fund_projects_public_select on public.fund_projects for select using (true)';
  end if;

  if to_regclass('public.leaderboards') is not null then
    execute 'drop policy if exists p_leaderboards_public_select on public.leaderboards';
    execute 'create policy p_leaderboards_public_select on public.leaderboards for select using (true)';
  end if;

  if to_regclass('public.membership_plans') is not null then
    execute 'drop policy if exists p_membership_plans_public_select on public.membership_plans';
    execute 'create policy p_membership_plans_public_select on public.membership_plans for select using (true)';
  end if;
end $$;

-- Member scoped policies.
do $$
begin
  if to_regclass('public.users') is not null then
    execute 'drop policy if exists p_users_public_profiles on public.users';
    execute $users_public$
      create policy p_users_public_profiles on public.users
        for select using (
          coalesce(public_profile, false)
          and coalesce(current_setting('request.jwt.claim.role', true), '') in ('anon', 'authenticated')
        );
    $users_public$;

    execute 'drop policy if exists p_users_self_select on public.users';
    execute 'create policy p_users_self_select on public.users for select using (auth.uid() = id)';

    execute 'drop policy if exists p_users_self_update on public.users';
    execute 'create policy p_users_self_update on public.users for update using (auth.uid() = id) with check (auth.uid() = id)';

    execute 'drop policy if exists p_users_self_insert on public.users';
    execute 'create policy p_users_self_insert on public.users for insert with check (auth.uid() = id)';
  end if;
end $$;

do $$
begin
  if to_regclass('public.ticket_orders') is not null then
    execute 'drop policy if exists p_ticket_orders_owner_select on public.ticket_orders';
    execute $orders$
      create policy p_ticket_orders_owner_select on public.ticket_orders
        for select using (auth.uid() = user_id);
    $orders$;

    execute 'drop policy if exists p_ticket_orders_owner_modify on public.ticket_orders';
    execute $orders_update$
      create policy p_ticket_orders_owner_modify on public.ticket_orders
        for update using (auth.uid() = user_id)
        with check (auth.uid() = user_id);
    $orders_update$;

    execute 'drop policy if exists p_ticket_orders_owner_insert on public.ticket_orders';
    execute 'create policy p_ticket_orders_owner_insert on public.ticket_orders for insert with check (auth.uid() = user_id)';
  end if;

  if to_regclass('public.ticket_passes') is not null then
    execute 'drop policy if exists p_ticket_passes_owner_select on public.ticket_passes';
    execute $passes$
      create policy p_ticket_passes_owner_select on public.ticket_passes
        for select using (
          exists (
            select 1
            from public.ticket_orders o
            where o.id = ticket_passes.order_id
              and o.user_id = auth.uid()
          )
        );
    $passes$;
  end if;

  if to_regclass('public.ticket_order_items') is not null then
    execute 'drop policy if exists p_ticket_order_items_owner_select on public.ticket_order_items';
    execute $items$
      create policy p_ticket_order_items_owner_select on public.ticket_order_items
        for select using (
          exists (
            select 1
            from public.ticket_orders o
            where o.id = ticket_order_items.order_id
              and o.user_id = auth.uid()
          )
        );
    $items$;
  end if;

  if to_regclass('public.wallet') is not null then
    execute 'drop policy if exists p_wallet_owner_select on public.wallet';
    execute 'create policy p_wallet_owner_select on public.wallet for select using (auth.uid() = user_id)';
  end if;

  if to_regclass('public.transactions') is not null then
    execute 'drop policy if exists p_transactions_owner_select on public.transactions';
    execute 'create policy p_transactions_owner_select on public.transactions for select using (auth.uid() = user_id)';
  end if;

  if to_regclass('public.sacco_deposits') is not null then
    execute 'drop policy if exists p_sacco_deposits_owner_select on public.sacco_deposits';
    execute 'create policy p_sacco_deposits_owner_select on public.sacco_deposits for select using (auth.uid() = user_id)';
  end if;

  if to_regclass('public.insurance_quotes') is not null then
    execute 'drop policy if exists p_insurance_quotes_owner_select on public.insurance_quotes';
    execute 'create policy p_insurance_quotes_owner_select on public.insurance_quotes for select using (auth.uid() = user_id)';
  end if;

  if to_regclass('public.policies') is not null then
    execute 'drop policy if exists p_policies_owner_select on public.policies';
    execute $policies$
      create policy p_policies_owner_select on public.policies
        for select using (
          exists (
            select 1
            from public.insurance_quotes q
            where q.id = policies.quote_id
              and q.user_id = auth.uid()
          )
        );
    $policies$;
  end if;

  if to_regclass('public.fan_posts') is not null then
    execute 'drop policy if exists p_fan_posts_owner_write on public.fan_posts';
    execute 'create policy p_fan_posts_owner_write on public.fan_posts for insert with check (auth.uid() = user_id)';

    execute 'drop policy if exists p_fan_posts_owner_update on public.fan_posts';
    execute 'create policy p_fan_posts_owner_update on public.fan_posts for update using (auth.uid() = user_id) with check (auth.uid() = user_id)';
  end if;

  if to_regclass('public.rewards_events') is not null then
    execute 'drop policy if exists p_rewards_events_owner_select on public.rewards_events';
    execute 'create policy p_rewards_events_owner_select on public.rewards_events for select using (auth.uid() = user_id)';
  end if;

  if to_regclass('public.payments') is not null then
    execute 'drop policy if exists p_payments_owner_select on public.payments';
    execute $payments$
      create policy p_payments_owner_select on public.payments
        for select using (
          exists (
            select 1
            from public.ticket_orders o
            where o.id = payments.ticket_order_id
              and o.user_id = auth.uid()
          )
          or exists (
            select 1
            from public.orders so
            where so.id = payments.order_id
              and so.user_id = auth.uid()
          )
        );
    $payments$;
  end if;

  if to_regclass('public.fund_donations') is not null then
    execute 'drop policy if exists p_fund_donations_owner_select on public.fund_donations';
    execute 'create policy p_fund_donations_owner_select on public.fund_donations for select using (auth.uid() = user_id)';
  end if;

  if to_regclass('public.gamification_events') is not null then
    execute 'drop policy if exists p_gamification_events_owner_select on public.gamification_events';
    execute 'create policy p_gamification_events_owner_select on public.gamification_events for select using (auth.uid() = user_id)';
  end if;
end $$;

-- Member directory columns and public view.
alter table if exists public.users
  add column if not exists display_name text,
  add column if not exists region text,
  add column if not exists fan_club text,
  add column if not exists public_profile boolean default false,
  add column if not exists language text default 'rw',
  add column if not exists joined_at timestamptz default now();

update public.users set joined_at = coalesce(joined_at, now()) where joined_at is null;
update public.users set language = coalesce(language, 'rw') where language is null;
update public.users set public_profile = coalesce(public_profile, false) where public_profile is null;

drop view if exists public.public_members;
create view public.public_members as
select
  id,
  coalesce(display_name, name, 'Fan') as display_name,
  coalesce(region, '—') as region,
  coalesce(fan_club, '—') as fan_club,
  joined_at,
  coalesce(avatar_url, '') as avatar_url
from public.users
where coalesce(public_profile, false) is true;

grant select on public.public_members to anon, authenticated;

-- Admin dashboard views.
create or replace view admin_dashboard_kpis as
with tickets as (
  select
    count(*) filter (where status = 'paid' and created_at >= now() - interval '7 days')::numeric as value_7d,
    count(*) filter (where status = 'paid' and created_at >= now() - interval '30 days')::numeric as value_30d
  from ticket_orders
),
shop as (
  select
    coalesce(sum(total) filter (where status in ('paid','ready','pickedup') and created_at >= now() - interval '7 days'), 0)::numeric as value_7d,
    coalesce(sum(total) filter (where status in ('paid','ready','pickedup') and created_at >= now() - interval '30 days'), 0)::numeric as value_30d
  from orders
),
policies as (
  select
    count(*) filter (where status = 'issued' and created_at >= now() - interval '7 days')::numeric as value_7d,
    count(*) filter (where status = 'issued' and created_at >= now() - interval '30 days')::numeric as value_30d
  from insurance_quotes
),
deposits as (
  select
    coalesce(sum(amount) filter (where status = 'confirmed' and created_at >= now() - interval '7 days'), 0)::numeric as value_7d,
    coalesce(sum(amount) filter (where status = 'confirmed' and created_at >= now() - interval '30 days'), 0)::numeric as value_30d
  from sacco_deposits
)
select 'tickets'::text as metric, tickets.value_7d, tickets.value_30d, 'count'::text as format from tickets
union all
select 'gmv', shop.value_7d, shop.value_30d, 'currency' from shop
union all
select 'policies', policies.value_7d, policies.value_30d, 'count' from policies
union all
select 'deposits', deposits.value_7d, deposits.value_30d, 'currency' from deposits;

create or replace view admin_dashboard_sms_metrics as
with raw as (
  select count(*) filter (where received_at >= now() - interval '7 days')::numeric as raw_count_7d
  from sms_raw
),
parsed as (
  select
    count(*) filter (where sp.created_at >= now() - interval '7 days')::numeric as parsed_count_7d,
    avg(extract(epoch from (sp.created_at - sr.received_at))) as avg_latency
  from sms_parsed sp
  left join sms_raw sr on sr.id = sp.sms_id
  where sp.created_at >= now() - interval '7 days'
)
select
  coalesce(raw.raw_count_7d, 0)::numeric as raw_count_7d,
  coalesce(parsed.parsed_count_7d, 0)::numeric as parsed_count_7d,
  case
    when coalesce(raw.raw_count_7d, 0) = 0 then null
    else coalesce(parsed.parsed_count_7d, 0) / nullif(raw.raw_count_7d, 0)
  end as success_rate,
  parsed.avg_latency as average_latency_seconds
from raw
cross join parsed;

create or replace view admin_dashboard_payment_metrics as
with confirmed as (
  select
    p.id,
    p.created_at,
    coalesce(to_ord.created_at, shop_ord.created_at) as origin_created_at
  from payments p
  left join ticket_orders to_ord on to_ord.id = p.ticket_order_id
  left join orders shop_ord on shop_ord.id = p.order_id
  where p.status = 'confirmed'
    and p.created_at >= now() - interval '7 days'
),
pending as (
  select
    (select count(*) from ticket_orders where status = 'pending')::numeric as ticket_pending,
    (select count(*) from orders where status = 'pending')::numeric as shop_pending
)
select
  (select count(*) from confirmed)::numeric as confirmed_count_7d,
  coalesce(pending.ticket_pending, 0) + coalesce(pending.shop_pending, 0) as pending_count,
  (
    select avg(extract(epoch from (c.created_at - c.origin_created_at)))
    from confirmed c
    where c.origin_created_at is not null
  ) as average_confirmation_seconds
from pending;

create or replace view admin_dashboard_gate_throughput as
select
  coalesce(gate, 'Unassigned') as gate,
  count(*)::numeric as passes,
  24 as window_hours
from ticket_passes
where created_at >= now() - interval '24 hours'
group by 1, 3;
