-- Phase 1 security: tighten RLS by removing broad authenticated policies and adding scoped admin/service-role access.
set search_path = public;

do $$
declare
  tbl text;
  tables text[] := array[
    'admin_roles',
    'admin_sessions',
    'admin_users',
    'admin_users_roles',
    'audit_logs',
    'fan_clubs',
    'fan_posts',
    'feature_flags',
    'fund_donations',
    'fund_projects',
    'gamification_events',
    'insurance_quotes',
    'leaderboards',
    'match_gates',
    'match_zones',
    'matches',
    'membership_plans',
    'memberships',
    'order_items',
    'orders',
    'payments',
    'permissions',
    'policies',
    'polls',
    'products',
    'products_legacy',
    'rewards_events',
    'roles_permissions',
    'sacco_deposits',
    'shop_products',
    'shop_promotions',
    'sms_parsed',
    'sms_raw',
    'ticket_order_items',
    'ticket_orders',
    'ticket_passes',
    'tickets',
    'tickets_legacy',
    'transactions',
    'transactions_legacy',
    'translations',
    'users',
    'wallet',
    'wallets'
  ];
begin
  foreach tbl in array tables loop
    if to_regclass(format('public.%I', tbl)) is not null then
      execute format('drop policy if exists authenticated_all on public.%I;', tbl);
    end if;
  end loop;
end $$;

-- Grant explicit admin access (JWT role = 'admin') to manage core tables without relying on broad policies.
do $$
declare
  tbl text;
  admin_tables text[] := array[
    'admin_roles',
    'admin_sessions',
    'admin_users',
    'admin_users_roles',
    'audit_logs',
    'feature_flags',
    'permissions',
    'roles_permissions',
    'translations',
    'fan_clubs',
    'fan_posts',
    'fund_projects',
    'leaderboards',
    'matches',
    'match_gates',
    'match_zones',
    'membership_plans',
    'polls',
    'shop_products',
    'shop_promotions'
  ];
begin
  foreach tbl in array admin_tables loop
    if to_regclass(format('public.%I', tbl)) is not null then
      execute format('drop policy if exists p_%I_admin_all on public.%I;', tbl, tbl);
      execute format(
        'create policy p_%I_admin_all on public.%I for all ' ||
        'using (coalesce(auth.jwt()->>''role'', '''') = ''admin'') ' ||
        'with check (coalesce(auth.jwt()->>''role'', '''') = ''admin'');',
        tbl,
        tbl
      );
    end if;
  end loop;
end $$;

-- Legacy tables need explicit service role access.
do $$
begin
  if to_regclass('public.wallets') is not null then
    execute 'drop policy if exists p_wallets_service_all on public.wallets';
    execute 'create policy p_wallets_service_all on public.wallets for all using (coalesce(auth.jwt()->>''role'', '''') = ''service_role'') with check (coalesce(auth.jwt()->>''role'', '''') = ''service_role'')';
  end if;

  if to_regclass('public.products_legacy') is not null then
    execute 'drop policy if exists p_products_legacy_service_all on public.products_legacy';
    execute 'create policy p_products_legacy_service_all on public.products_legacy for all using (coalesce(auth.jwt()->>''role'', '''') = ''service_role'') with check (coalesce(auth.jwt()->>''role'', '''') = ''service_role'')';
  end if;

  if to_regclass('public.tickets_legacy') is not null then
    execute 'drop policy if exists p_tickets_legacy_service_all on public.tickets_legacy';
    execute 'create policy p_tickets_legacy_service_all on public.tickets_legacy for all using (coalesce(auth.jwt()->>''role'', '''') = ''service_role'') with check (coalesce(auth.jwt()->>''role'', '''') = ''service_role'')';
  end if;

  if to_regclass('public.transactions_legacy') is not null then
    execute 'drop policy if exists p_transactions_legacy_service_all on public.transactions_legacy';
    execute 'create policy p_transactions_legacy_service_all on public.transactions_legacy for all using (coalesce(auth.jwt()->>''role'', '''') = ''service_role'') with check (coalesce(auth.jwt()->>''role'', '''') = ''service_role'')';
  end if;
end $$;
