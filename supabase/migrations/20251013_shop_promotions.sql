create table if not exists public.shop_promotions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  discount_pct numeric check (discount_pct > 0 and discount_pct <= 90),
  product_ids uuid[] not null default '{}',
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  created_at timestamptz default now()
);

create index if not exists idx_promotions_active on public.shop_promotions(starts_at, ends_at);

comment on table public.shop_promotions is 'Admin-defined sales windows and bundles';
