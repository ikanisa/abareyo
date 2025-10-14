-- Admin performance indexes and product gallery support
alter table public.shop_products
  add column if not exists images jsonb default '[]'::jsonb;

create index if not exists idx_ticket_orders_match on public.ticket_orders(match_id);
create index if not exists idx_ticket_orders_status on public.ticket_orders(status);
create index if not exists idx_ticket_passes_order on public.ticket_passes(order_id);
create index if not exists idx_orders_status on public.orders(status);
create index if not exists idx_orders_created on public.orders(created_at desc);
create index if not exists idx_shop_products_category on public.shop_products(category);
create index if not exists idx_sms_raw_received on public.sms_raw(received_at desc);
create index if not exists idx_sms_parsed_amount on public.sms_parsed(amount);
create index if not exists idx_payments_kind on public.payments(kind);
