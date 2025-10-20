-- Additional ticketing and transactions enhancements
set search_path = public;

do $do$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'ticket_order_status'
      and n.nspname = 'public'
  ) then
    execute $$create type ticket_order_status as enum ('pending','paid','cancelled','expired')$$;
  end if;

  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'transaction_status'
      and n.nspname = 'public'
  ) then
    execute $$create type transaction_status as enum ('pending','confirmed','failed','manual_review')$$;
  end if;
end
$do$;

alter table matches
  add column if not exists blue_price int,
  add column if not exists seats_blue int;

create table if not exists ticket_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete set null,
  match_id uuid references matches(id) on delete cascade,
  total int not null,
  momo_ref text,
  status ticket_order_status not null default 'pending',
  ussd_code text,
  expires_at timestamp with time zone,
  created_at timestamp with time zone not null default now()
);

create table if not exists ticket_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references ticket_orders(id) on delete cascade,
  zone ticket_zone not null,
  quantity int not null,
  price int not null
);

alter table tickets
  add column if not exists order_id uuid references ticket_orders(id) on delete set null,
  add column if not exists gate text,
  add column if not exists state text not null default 'pending',
  add column if not exists qr_token text,
  add column if not exists updated_at timestamp with time zone not null default now();

create or replace function touch_ticket_updated_at()
returns trigger as $$
begin
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

create trigger ticket_updated_at
before update on tickets
for each row execute procedure touch_ticket_updated_at();

alter table transactions
  add column if not exists status transaction_status not null default 'pending';
