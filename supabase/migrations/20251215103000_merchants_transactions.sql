set search_path = public;

-- Merchant registry for NFC issuers
create table if not exists public.merchants (
  id uuid primary key default gen_random_uuid(),
  external_id text unique,
  name text not null,
  status text not null default 'active' check (status in ('active','inactive','suspended','revoked')),
  hmac_secret text not null,
  secret_rotated_at timestamptz,
  nonce_ttl_seconds integer not null default 300 check (nonce_ttl_seconds between 30 and 3600),
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Ensure updated_at columns stay fresh
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_merchants_updated_at on public.merchants;
create trigger trg_merchants_updated_at
  before update on public.merchants
  for each row execute function public.set_updated_at();

-- Merchant transaction ledger with nonce replay guards
create table if not exists public.merchant_transactions (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references public.merchants(id) on delete cascade,
  user_id uuid references public.users(id) on delete set null,
  terminal_id text,
  reference text,
  amount_cents integer check (amount_cents is null or amount_cents >= 0),
  currency text default 'RWF',
  status text not null default 'issued' check (status in ('issued','authorized','captured','failed','reconciled','cancelled')),
  issued_at timestamptz not null default now(),
  nonce text not null,
  nonce_expires_at timestamptz not null,
  nonce_used_at timestamptz,
  signature text,
  payload jsonb default '{}'::jsonb,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  reconciled_at timestamptz
);

drop trigger if exists trg_merchant_transactions_updated_at on public.merchant_transactions;
create trigger trg_merchant_transactions_updated_at
  before update on public.merchant_transactions
  for each row execute function public.set_updated_at();

-- RLS ------------------------------------------------------------------

alter table if exists public.merchants enable row level security;
alter table if exists public.merchants force row level security;

drop policy if exists p_merchants_service_all on public.merchants;
create policy p_merchants_service_all on public.merchants
  for all using (coalesce(auth.jwt()->>'role', '') = 'service_role')
  with check (coalesce(auth.jwt()->>'role', '') = 'service_role');

drop policy if exists p_merchants_self_select on public.merchants;
create policy p_merchants_self_select on public.merchants
  for select using (id::text = coalesce(auth.jwt()->>'merchant_id', ''));

drop policy if exists p_merchants_self_update on public.merchants;
create policy p_merchants_self_update on public.merchants
  for update using (id::text = coalesce(auth.jwt()->>'merchant_id', ''))
  with check (id::text = coalesce(auth.jwt()->>'merchant_id', ''));

alter table if exists public.merchant_transactions enable row level security;
alter table if exists public.merchant_transactions force row level security;

drop policy if exists p_merchant_tx_service_all on public.merchant_transactions;
create policy p_merchant_tx_service_all on public.merchant_transactions
  for all using (coalesce(auth.jwt()->>'role', '') = 'service_role')
  with check (coalesce(auth.jwt()->>'role', '') = 'service_role');

drop policy if exists p_merchant_tx_select on public.merchant_transactions;
create policy p_merchant_tx_select on public.merchant_transactions
  for select using (merchant_id::text = coalesce(auth.jwt()->>'merchant_id', ''));

drop policy if exists p_merchant_tx_insert on public.merchant_transactions;
create policy p_merchant_tx_insert on public.merchant_transactions
  for insert with check (merchant_id::text = coalesce(auth.jwt()->>'merchant_id', ''));

drop policy if exists p_merchant_tx_update on public.merchant_transactions;
create policy p_merchant_tx_update on public.merchant_transactions
  for update using (merchant_id::text = coalesce(auth.jwt()->>'merchant_id', ''))
  with check (merchant_id::text = coalesce(auth.jwt()->>'merchant_id', ''));

-- Indexes for replay protection & cleanup
create unique index if not exists idx_merchant_tx_nonce_guard
  on public.merchant_transactions (merchant_id, nonce);

create index if not exists idx_merchant_tx_nonce_ttl
  on public.merchant_transactions (nonce_expires_at)
  where nonce_expires_at < now();

create index if not exists idx_merchant_tx_status
  on public.merchant_transactions (merchant_id, status, created_at desc);
