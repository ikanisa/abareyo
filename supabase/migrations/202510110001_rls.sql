alter table public.users enable row level security;
alter table public.ticket_orders enable row level security;
alter table public.ticket_passes enable row level security;
alter table public.sms_raw enable row level security;
alter table public.sms_parsed enable row level security;
alter table public.payments enable row level security;
alter table public.memberships enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.fund_donations enable row level security;
alter table public.gamification_events enable row level security;
alter table public.leaderboards enable row level security;

-- Public read for matches, products, projects (non-sensitive)
alter table public.matches enable row level security;
create policy p_read_matches on public.matches for select using (true);

alter table public.products enable row level security;
create policy p_read_products on public.products for select using (true);

alter table public.fund_projects enable row level security;
create policy p_read_projects on public.fund_projects for select using (true);

-- Minimal owner policies for user-linked rows (client ops). Server bypass through service role.
create policy p_user_owns_orders on public.ticket_orders
  for select using (auth.uid()::uuid = user_id);
create policy p_user_owns_passes on public.ticket_passes
  for select using (exists (select 1 from public.ticket_orders o where o.id = order_id and o.user_id = auth.uid()::uuid));
