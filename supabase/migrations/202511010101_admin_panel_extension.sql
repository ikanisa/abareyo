-- Admin panel additive schema extension for GIKUNDIRO
-- Ensures USSD-only commerce, RBAC, feature flags, and auditability.

create extension if not exists "pgcrypto";

-- USERS & PROFILES -------------------------------------------------------
alter table if exists public.users
  add column if not exists public_profile jsonb default '{}'::jsonb;

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  opponent text not null,
  kickoff timestamptz,
  venue text,
  status text default 'scheduled',
  gates jsonb default '[]'::jsonb,
  pricing jsonb default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists matches_kickoff_idx on public.matches using brin (kickoff);

create table if not exists public.ticket_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  match_id uuid references public.matches(id) on delete set null,
  total numeric(12,2) not null default 0,
  status text not null default 'pending',
  sms_ref text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.ticket_passes (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.ticket_orders(id) on delete cascade,
  zone text not null,
  gate text,
  qr_token_hash text,
  issued_at timestamptz default now(),
  scanned_at timestamptz
);

create table if not exists public.shop_products (
  id uuid primary key default gen_random_uuid(),
  slug text unique,
  name text not null,
  description text,
  price numeric(12,2) not null default 0,
  currency text not null default 'RWF',
  image_url text,
  variants jsonb default '[]'::jsonb,
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  total numeric(12,2) not null default 0,
  status text not null default 'pending',
  momo_ref text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete cascade,
  product_id uuid references public.shop_products(id) on delete set null,
  qty integer not null default 1,
  price numeric(12,2) not null default 0,
  metadata jsonb default '{}'::jsonb
);

create table if not exists public.shop_promotions (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.shop_products(id) on delete set null,
  title text not null,
  discount_percent numeric(5,2) not null default 0,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz default now(),
  created_by uuid references public.admin_users(id) on delete set null
);

create table if not exists public.insurance_quotes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  premium numeric(12,2) not null,
  status text not null default 'quoted',
  ref text,
  ticket_perk boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.policies (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid references public.insurance_quotes(id) on delete cascade,
  number text not null,
  valid_from timestamptz,
  valid_to timestamptz,
  created_at timestamptz default now()
);

create table if not exists public.sacco_deposits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  amount numeric(12,2) not null,
  status text not null default 'pending',
  ref text,
  referral_code text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.sms_raw (
  id uuid primary key default gen_random_uuid(),
  received_at timestamptz default now(),
  sender text,
  payload text not null,
  meta jsonb default '{}'::jsonb
);

create table if not exists public.sms_parsed (
  id uuid primary key default gen_random_uuid(),
  raw_id uuid references public.sms_raw(id) on delete cascade,
  parsed_at timestamptz default now(),
  amount numeric(12,2),
  momo_ref text,
  status text default 'pending',
  match_confidence numeric(5,2),
  metadata jsonb default '{}'::jsonb
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  kind text not null,
  amount numeric(12,2) not null,
  status text not null default 'pending',
  ticket_order_id uuid references public.ticket_orders(id) on delete set null,
  order_id uuid references public.orders(id) on delete set null,
  sacco_deposit_id uuid references public.sacco_deposits(id) on delete set null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists public.rewards_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  source text not null,
  ref_id text,
  points integer not null default 0,
  meta jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists public.admin_permissions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  description text,
  created_at timestamptz default now()
);

create table if not exists public.admin_roles (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  created_at timestamptz default now()
);

create table if not exists public.admin_role_permissions (
  role_id uuid references public.admin_roles(id) on delete cascade,
  permission_id uuid references public.admin_permissions(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (role_id, permission_id)
);

create table if not exists public.admin_user_roles (
  admin_user_id uuid references public.admin_users(id) on delete cascade,
  role_id uuid references public.admin_roles(id) on delete cascade,
  assigned_at timestamptz default now(),
  primary key (admin_user_id, role_id)
);

create table if not exists public.feature_flags (
  key text primary key,
  enabled boolean not null default false,
  description text,
  updated_at timestamptz default now(),
  updated_by uuid references public.admin_users(id) on delete set null,
  context jsonb default '{}'::jsonb
);

create table if not exists public.translations (
  id uuid primary key default gen_random_uuid(),
  namespace text default 'admin',
  translation_key text not null,
  locale text not null default 'en',
  value text not null,
  updated_at timestamptz default now(),
  updated_by uuid references public.admin_users(id) on delete set null,
  unique(namespace, translation_key, locale)
);

create table if not exists public.report_schedules (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  cron text not null,
  destination text not null,
  payload jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  created_by uuid references public.admin_users(id) on delete set null
);

-- VIEWS ------------------------------------------------------------------
create or replace view public.public_members as
  select
    u.id,
    coalesce((u.public_profile ->> 'displayName'), u.display_name, 'Member') as display_name,
    coalesce((u.public_profile ->> 'avatar'), '') as avatar_url,
    u.created_at
  from public.users u;

grant select on public.public_members to anon;

create table if not exists public.content_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique,
  body jsonb default '{}'::jsonb,
  type text not null default 'article',
  status text not null default 'draft',
  published_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.community_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  body text not null,
  media jsonb default '[]'::jsonb,
  status text not null default 'pending',
  evidence jsonb default '[]'::jsonb,
  moderator_notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create or replace view public.public_content as
  select id, title, slug, type, status, published_at, created_at
  from public.content_items
  where status = 'published';

grant select on public.public_content to anon;

-- RLS --------------------------------------------------------------------
alter table public.users enable row level security;
alter table public.ticket_orders enable row level security;
alter table public.orders enable row level security;
alter table public.sacco_deposits enable row level security;
alter table public.rewards_events enable row level security;
alter table public.community_posts enable row level security;

-- Owner policies for user-owned records
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'ticket_orders' AND policyname = 'ticket_orders_owner'
  ) THEN
    EXECUTE $$create policy ticket_orders_owner on public.ticket_orders
      for select using (auth.uid() = user_id)
      with check (auth.uid() = user_id);$$;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'orders' AND policyname = 'orders_owner'
  ) THEN
    EXECUTE $$create policy orders_owner on public.orders
      for select using (auth.uid() = user_id)
      with check (auth.uid() = user_id);$$;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'sacco_deposits' AND policyname = 'sacco_deposits_owner'
  ) THEN
    EXECUTE $$create policy sacco_deposits_owner on public.sacco_deposits
      for select using (auth.uid() = user_id)
      with check (auth.uid() = user_id);$$;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'rewards_events' AND policyname = 'rewards_events_owner'
  ) THEN
    EXECUTE $$create policy rewards_events_owner on public.rewards_events
      for select using (auth.uid() = user_id);$$;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'community_posts' AND policyname = 'community_posts_owner'
  ) THEN
    EXECUTE $$create policy community_posts_owner on public.community_posts
      for select using (auth.uid() = user_id)
      with check (auth.uid() = user_id);$$;
  END IF;
END $$;

-- Public read-only views
revoke all on public.public_members from public;
revoke all on public.public_content from public;
grant select on public.public_members to anon;
grant select on public.public_content to anon;

-- FUNCTIONS & TRIGGERS ---------------------------------------------------
create or replace function public.award_points_for_payment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  award integer;
begin
  if (new.status <> 'confirmed') then
    return new;
  end if;
  award := greatest(1, floor(new.amount / 1000));
  if new.user_id is not null then
    insert into public.rewards_events(user_id, source, ref_id, points, meta)
    values (new.user_id, 'payment', new.id::text, award, coalesce(new.metadata, '{}'::jsonb));
  elsif new.ticket_order_id is not null then
    insert into public.rewards_events(user_id, source, ref_id, points, meta)
    select t.user_id, 'ticket_payment', new.id::text, award, coalesce(new.metadata, '{}'::jsonb)
    from public.ticket_orders t where t.id = new.ticket_order_id;
  elsif new.order_id is not null then
    insert into public.rewards_events(user_id, source, ref_id, points, meta)
    select o.user_id, 'shop_payment', new.id::text, award, coalesce(new.metadata, '{}'::jsonb)
    from public.orders o where o.id = new.order_id;
  end if;
  return new;
end;
$$;

-- Add missing user_id column on payments for triggers (additive, nullable)
alter table public.payments
  add column if not exists user_id uuid;

create trigger payments_award_points
  after insert on public.payments
  for each row
  when (new.status = 'confirmed')
  execute function public.award_points_for_payment();

create or replace function public.retro_issue_points(
  target_user uuid,
  points integer,
  reason text,
  meta jsonb default '{}'::jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  result jsonb;
begin
  if target_user is null then
    raise exception 'target_user required';
  end if;

  insert into public.rewards_events(user_id, source, ref_id, points, meta)
  values (target_user, 'retro_points', reason, points, meta)
  returning jsonb_build_object('id', id, 'points', points, 'created_at', created_at) into result;

  return jsonb_build_object('status', 'ok', 'event', result);
end;
$$;

create or replace function public.retro_issue_ticket_perk(
  target_user uuid,
  match uuid,
  note text
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  order_id uuid;
  pass_id uuid;
begin
  if target_user is null or match is null then
    raise exception 'target_user and match are required';
  end if;

  insert into public.ticket_orders(user_id, match_id, total, status, sms_ref)
  values (target_user, match, 0, 'paid', 'RETRO-PERK')
  returning id into order_id;

  insert into public.ticket_passes(order_id, zone, gate, qr_token_hash)
  values (order_id, 'Blue', 'G3', encode(gen_random_bytes(12), 'hex'))
  returning id into pass_id;

  insert into public.rewards_events(user_id, source, ref_id, points, meta)
  values (target_user, 'ticket_perk', order_id::text, 0, jsonb_build_object('match_id', match, 'note', note));

  return jsonb_build_object('status', 'ok', 'order_id', order_id, 'pass_id', pass_id);
end;
$$;

-- AUDIT HOOKS ------------------------------------------------------------
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  action text,
  entity_type text,
  entity_id text,
  before jsonb,
  after jsonb,
  admin_user_id uuid references public.admin_users(id) on delete set null,
  ip text,
  ua text,
  context jsonb,
  at timestamptz default now()
);

-- Seed baseline admin role ------------------------------------------------
insert into public.admin_roles(id, name, description)
select gen_random_uuid(), 'superadmin', 'Full control of admin panel'
where not exists (select 1 from public.admin_roles where name = 'superadmin');

insert into public.admin_permissions(id, code, description)
select gen_random_uuid(), 'admin.module.overview', 'Access overview module'
where not exists (select 1 from public.admin_permissions where code = 'admin.module.overview');

insert into public.admin_permissions(id, code, description)
select gen_random_uuid(), 'admin.module.match_ops', 'Access match operations'
where not exists (select 1 from public.admin_permissions where code = 'admin.module.match_ops');

insert into public.feature_flags(key, enabled, description)
select 'admin.module.overview', true, 'Overview module'
where not exists (select 1 from public.feature_flags where key = 'admin.module.overview');

insert into public.feature_flags(key, enabled, description)
select 'admin.module.admin', true, 'Admin configuration module'
where not exists (select 1 from public.feature_flags where key = 'admin.module.admin');

