-- USERS (guest-capable; app auth outside scope)
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  locale text default 'rw',
  phone_mask text
);

-- MATCHES & TICKETS
create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  opponent text not null,
  kickoff timestamptz not null,
  venue text,
  status text check (status in ('scheduled','live','finished')) default 'scheduled'
);

create table if not exists public.ticket_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id),
  match_id uuid references public.matches(id),
  total int not null,
  status text check (status in ('pending','paid','cancelled')) default 'pending',
  ussd_code text,
  sms_ref text,
  created_at timestamptz default now()
);

create table if not exists public.ticket_passes (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.ticket_orders(id) on delete cascade,
  zone text,
  gate text,
  qr_token_hash text,
  state text check (state in ('active','used','refunded')) default 'active',
  created_at timestamptz default now()
);

-- SMS ingest & parsed
create table if not exists public.sms_raw (
  id uuid primary key default gen_random_uuid(),
  received_at timestamptz default now(),
  from_msisdn text,
  text text not null,
  source text default 'gsm-daemon'
);

create table if not exists public.sms_parsed (
  id uuid primary key default gen_random_uuid(),
  sms_id uuid references public.sms_raw(id) on delete cascade,
  amount int not null,
  currency text default 'RWF',
  payer_mask text,
  ref text,
  matched_entity text, -- 'order:<id>' | 'membership:<id>' | 'donation:<id>'
  confidence numeric,
  created_at timestamptz default now()
);

-- PAYMENTS (unified)
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  kind text check (kind in ('ticket','membership','shop','donation')) not null,
  amount int not null,
  status text check (status in ('pending','confirmed','failed')) default 'pending',
  sms_parsed_id uuid references public.sms_parsed(id) on delete set null,
  order_id uuid references public.ticket_orders(id) on delete set null,
  membership_id uuid,
  donation_id uuid,
  created_at timestamptz default now()
);

-- MEMBERSHIP
create table if not exists public.membership_plans (
  id uuid primary key default gen_random_uuid(),
  name text,
  price int,
  perks jsonb default '[]'::jsonb
);

create table if not exists public.memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id),
  plan_id uuid references public.membership_plans(id),
  status text check (status in ('active','expired','pending')) default 'pending',
  started_at timestamptz,
  expires_at timestamptz
);

-- SHOP
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text,
  price int,
  stock int default 0,
  images jsonb default '[]'::jsonb
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id),
  total int,
  status text check (status in ('pending','paid','cancelled')) default 'pending',
  created_at timestamptz default now()
);

create table if not exists public.order_items (
  order_id uuid references public.orders(id) on delete cascade,
  product_id uuid references public.products(id),
  qty int,
  price int,
  primary key (order_id, product_id)
);

-- FUNDRAISING
create table if not exists public.fund_projects (
  id uuid primary key default gen_random_uuid(),
  title text,
  goal int,
  progress int default 0
);

create table if not exists public.fund_donations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id),
  amount int,
  status text check (status in ('pending','confirmed','failed')) default 'pending'
);

-- GAMIFICATION
create table if not exists public.gamification_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id),
  kind text,
  value int,
  context jsonb,
  created_at timestamptz default now()
);

create table if not exists public.leaderboards (
  period text,
  user_id uuid references public.users(id),
  points int,
  primary key (period, user_id)
);

-- ADMIN / AUDIT
create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  password_hash text not null,
  display_name text,
  status text default 'active',
  last_login timestamptz
);

create table if not exists public.admin_roles (
  id uuid primary key default gen_random_uuid(),
  name text unique not null
);

create table if not exists public.admin_users_roles (
  admin_user_id uuid references public.admin_users(id) on delete cascade,
  role_id uuid references public.admin_roles(id) on delete cascade,
  primary key (admin_user_id, role_id)
);

create table if not exists public.permissions (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  description text
);

create table if not exists public.roles_permissions (
  role_id uuid references public.admin_roles(id) on delete cascade,
  permission_id uuid references public.permissions(id) on delete cascade,
  primary key (role_id, permission_id)
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  at timestamptz default now(),
  admin_user_id uuid references public.admin_users(id),
  action text,
  entity_type text,
  entity_id text,
  before jsonb,
  after jsonb,
  ip text,
  ua text
);
