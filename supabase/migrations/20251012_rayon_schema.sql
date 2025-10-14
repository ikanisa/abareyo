-- Rayon Sports MVP schema
set search_path = public;

-- Drop legacy objects if they exist so this migration can be applied on top of
-- the previous prototype schema that shipped with the starter kit.
drop table if exists fan_posts cascade;
drop table if exists fan_clubs cascade;
drop table if exists tickets cascade;
drop table if exists matches cascade;
drop table if exists wallet cascade;
drop table if exists transactions cascade;
drop table if exists shop_products cascade;
drop table if exists order_items cascade;
drop table if exists orders cascade;
drop table if exists sacco_deposits cascade;
drop table if exists insurance_quotes cascade;
drop table if exists policies cascade;
drop table if exists users cascade;
drop table if exists polls cascade;

drop type if exists user_tier cascade;
drop type if exists match_status cascade;
drop type if exists ticket_zone cascade;
drop type if exists transaction_type cascade;
drop type if exists order_status cascade;
drop type if exists sacco_status cascade;
drop type if exists insurance_status cascade;

-- Enum definitions
create type user_tier as enum ('guest','fan','gold');
create type match_status as enum ('upcoming','live','ft');
create type ticket_zone as enum ('VIP','Regular','Blue');
create type transaction_type as enum ('deposit','purchase','refund','reward');
create type order_status as enum ('pending','paid','ready','pickedup');
create type sacco_status as enum ('pending','confirmed');
create type insurance_status as enum ('quoted','paid','issued');

-- Core tables
create table users (
  id uuid primary key default gen_random_uuid(),
  name text,
  phone text unique,
  momo_number text,
  avatar_url text,
  tier user_tier not null default 'guest',
  points int not null default 0,
  created_at timestamp with time zone not null default now()
);

create table matches (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  comp text,
  date timestamp with time zone not null,
  venue text,
  status match_status not null default 'upcoming',
  home_team text,
  away_team text,
  vip_price int,
  regular_price int,
  seats_vip int,
  seats_regular int
);

create table tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete set null,
  match_id uuid references matches(id) on delete cascade,
  zone ticket_zone not null,
  price int not null,
  paid boolean not null default false,
  momo_ref text,
  created_at timestamp with time zone not null default now()
);

create table wallet (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references users(id) on delete cascade,
  balance int not null default 0,
  updated_at timestamp with time zone not null default now()
);

create table transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  type transaction_type not null,
  amount int not null,
  ref text,
  created_at timestamp with time zone not null default now()
);

create table shop_products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text,
  price int not null,
  stock int not null default 0,
  description text,
  image_url text,
  badge text
);

create table orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete set null,
  total int not null,
  momo_ref text,
  status order_status not null default 'pending',
  created_at timestamp with time zone not null default now()
);

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete cascade,
  product_id uuid references shop_products(id) on delete restrict,
  qty int not null,
  price int not null
);

create table sacco_deposits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  sacco_name text not null,
  amount int not null,
  ref text,
  status sacco_status not null default 'pending',
  created_at timestamp with time zone not null default now()
);

create table insurance_quotes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  moto_type text,
  plate text,
  premium int not null,
  ticket_perk boolean not null default false,
  status insurance_status not null default 'quoted',
  ref text,
  created_at timestamp with time zone not null default now()
);

create table policies (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid references insurance_quotes(id) on delete cascade,
  number text not null,
  valid_from timestamp with time zone not null,
  valid_to timestamp with time zone not null,
  free_ticket_issued boolean not null default false
);

create table fan_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  text text,
  media_url text,
  likes int not null default 0,
  comments int not null default 0,
  created_at timestamp with time zone not null default now()
);

create table fan_clubs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text,
  members int not null default 0
);

create table polls (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  options jsonb not null,
  results jsonb not null default '{}'::jsonb,
  active boolean not null default true
);

-- Simple updated_at trigger for wallet
create or replace function touch_wallet_updated_at()
returns trigger as $$
begin
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

create trigger wallet_updated_at
before update on wallet
for each row execute procedure touch_wallet_updated_at();

create or replace function increment_user_points(p_user_id uuid, p_points_delta int)
returns void as $$
begin
  update users
  set points = coalesce(points, 0) + coalesce(p_points_delta, 0)
  where id = p_user_id;
end;
$$ language plpgsql;
