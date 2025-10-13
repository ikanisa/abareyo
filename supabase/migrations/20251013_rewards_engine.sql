-- Log of rewards changes (auditable)
create table if not exists public.rewards_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  source text check (source in ('transaction','policy_perk')) not null,
  ref_id uuid,                 -- transactions.id or policies.id
  points int not null,
  meta jsonb,
  created_at timestamptz default now()
);

-- Points rules (simple constants)
create or replace function public.rewards_points_for(kind text, amount int)
returns int language plpgsql as $$
declare
  safe_amount numeric := coalesce(amount, 0);
begin
  -- tweakable rules:
  -- deposit: +2% of amount, purchase: +1% of amount (rounded)
  if safe_amount <= 0 then
    return 0;
  elsif kind = 'deposit' then
    return greatest(1, round(safe_amount * 0.02)::int);
  elsif kind = 'purchase' then
    return greatest(1, round(safe_amount * 0.01)::int);
  else
    return 0;
  end if;
end; $$;

-- AFTER INSERT trigger on transactions => award points
create or replace function public.award_points_on_transaction()
returns trigger language plpgsql as $$
declare
  add int := public.rewards_points_for(new.kind, new.amount);
begin
  if add > 0 and new.user_id is not null then
    update public.users set points = coalesce(points,0) + add where id = new.user_id;
    insert into public.rewards_events (user_id, source, ref_id, points, meta)
      values (new.user_id, 'transaction', new.id, add, jsonb_build_object('kind', new.kind, 'amount', new.amount, 'ref', new.ref));
  end if;
  return new;
end; $$;

drop trigger if exists trg_rewards_on_transactions on public.transactions;
create trigger trg_rewards_on_transactions
  after insert on public.transactions
  for each row execute function public.award_points_on_transaction();
