create table if not exists public.tapmomo_merchants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade unique,
  merchant_account text not null,
  merchant_label text,
  aid text not null,
  signing_key text not null,
  nonce_ttl_seconds integer default 60,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.tapmomo_merchants enable row level security;

create policy if not exists "service role full access"
  on public.tapmomo_merchants
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create trigger if not exists tapmomo_merchants_set_updated_at
  before update on public.tapmomo_merchants
  for each row
  execute function public.set_current_timestamp_updated_at();
