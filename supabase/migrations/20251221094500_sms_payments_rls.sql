set search_path = public;

alter table if exists public.sms_raw force row level security;
alter table if exists public.sms_parsed force row level security;
alter table if exists public.mobile_money_payments force row level security;

drop policy if exists p_sms_raw_owner_update on public.sms_raw;
create policy p_sms_raw_owner_update on public.sms_raw
  for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists p_mobile_money_owner_insert on public.mobile_money_payments;
create policy p_mobile_money_owner_insert on public.mobile_money_payments
  for insert with check (auth.uid() = user_id);

drop policy if exists p_mobile_money_owner_update on public.mobile_money_payments;
create policy p_mobile_money_owner_update on public.mobile_money_payments
  for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop view if exists public.mobile_money_payment_overview;
create view public.mobile_money_payment_overview as
  select
    mmp.id,
    mmp.user_id,
    mmp.amount,
    mmp.currency,
    mmp.status,
    mmp.ref,
    mmp.allocated_to,
    mmp.allocated_id,
    mmp.allocated_at,
    mmp.created_at,
    mmp.updated_at,
    sp.confidence,
    sp.amount as parsed_amount,
    sp.ref as parsed_ref
  from public.mobile_money_payments mmp
  left join public.sms_parsed sp on sp.id = mmp.sms_parsed_id;

grant select on public.mobile_money_payment_overview to authenticated;
comment on view public.mobile_money_payment_overview is 'Owner-scoped mobile money payment status with parsed SMS metadata.';
