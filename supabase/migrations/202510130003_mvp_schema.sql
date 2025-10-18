-- USERS
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  name text,
  phone text unique,
  momo_number text,
  avatar_url text,
  tier text check (tier in ('guest','fan','gold')) default 'guest',
  points int default 0,
  created_at timestamptz default now()
);

-- MATCHES & TICKETS
create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  comp text,
  date timestamptz not null,
  venue text,
  status text check (status in ('upcoming','live','ft')) default 'upcoming',
  home_team text, away_team text,
  vip_price int, regular_price int,
  seats_vip int default 0, seats_regular int default 0
);

create table if not exists public.tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  match_id uuid references public.matches(id) on delete cascade,
  zone text check (zone in ('VIP','Regular','Blue')) not null,
  price int not null,
  paid boolean default false,
  momo_ref text,
  created_at timestamptz default now()
);

-- WALLET & TRANSACTIONS
create table if not exists public.wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references public.users(id) on delete cascade,
  balance int default 0,
  updated_at timestamptz default now()
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  kind text check (kind in ('deposit','purchase','refund','reward')),
  amount int not null,
  ref text,
  created_at timestamptz default now()
);

-- SHOP
create table if not exists public.shop_products (
  id uuid primary key default gen_random_uuid(),
  name text, category text, price int, stock int,
  description text, image_url text, badge text
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  total int not null,
  momo_ref text,
  status text check (status in ('pending','paid','ready','pickedup')) default 'pending',
  created_at timestamptz default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete cascade,
  product_id uuid references public.shop_products(id) on delete restrict,
  qty int not null,
  price int not null
);

-- SACCO DEPOSITS
create table if not exists public.sacco_deposits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  sacco_name text,
  amount int not null,
  ref text,
  status text check (status in ('pending','confirmed')) default 'pending',
  created_at timestamptz default now()
);

-- INSURANCE
create table if not exists public.insurance_quotes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  moto_type text, plate text, period_months int,
  premium int, ticket_perk boolean default false,
  status text check (status in ('quoted','paid','issued')) default 'quoted',
  ref text,
  created_at timestamptz default now()
);

create table if not exists public.policies (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid references public.insurance_quotes(id) on delete cascade,
  number text,
  valid_from timestamptz, valid_to timestamptz,
  free_ticket_issued boolean default false
);

-- COMMUNITY
create table if not exists public.fan_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  text text, media_url text,
  likes int default 0, comments int default 0,
  created_at timestamptz default now()
);

-- RLS sane defaults (read-only for public lists)
alter table public.matches enable row level security;
create policy p_matches_read on public.matches for select using (true);

alter table public.shop_products enable row level security;
create policy p_products_read on public.shop_products for select using (true);

-- other tables will be accessed server-side via service role in API routes
