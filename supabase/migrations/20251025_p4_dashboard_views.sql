set search_path = public;

create or replace view admin_dashboard_kpis as
with tickets as (
  select
    count(*) filter (where status = 'paid' and created_at >= now() - interval '7 days')::numeric as value_7d,
    count(*) filter (where status = 'paid' and created_at >= now() - interval '30 days')::numeric as value_30d
  from ticket_orders
),
shop as (
  select
    coalesce(sum(total) filter (where status in ('paid','ready','pickedup') and created_at >= now() - interval '7 days'), 0)::numeric as value_7d,
    coalesce(sum(total) filter (where status in ('paid','ready','pickedup') and created_at >= now() - interval '30 days'), 0)::numeric as value_30d
  from orders
),
policies as (
  select
    count(*) filter (where status = 'issued' and created_at >= now() - interval '7 days')::numeric as value_7d,
    count(*) filter (where status = 'issued' and created_at >= now() - interval '30 days')::numeric as value_30d
  from insurance_quotes
),
deposits as (
  select
    coalesce(sum(amount) filter (where status = 'confirmed' and created_at >= now() - interval '7 days'), 0)::numeric as value_7d,
    coalesce(sum(amount) filter (where status = 'confirmed' and created_at >= now() - interval '30 days'), 0)::numeric as value_30d
  from sacco_deposits
)
select 'tickets'::text as metric, tickets.value_7d, tickets.value_30d, 'count'::text as format from tickets
union all
select 'gmv', shop.value_7d, shop.value_30d, 'currency' from shop
union all
select 'policies', policies.value_7d, policies.value_30d, 'count' from policies
union all
select 'deposits', deposits.value_7d, deposits.value_30d, 'currency' from deposits;

create or replace view admin_dashboard_sms_metrics as
with raw as (
  select count(*) filter (where received_at >= now() - interval '7 days')::numeric as raw_count_7d
  from sms_raw
),
parsed as (
  select
    count(*) filter (where sp.created_at >= now() - interval '7 days')::numeric as parsed_count_7d,
    avg(extract(epoch from (sp.created_at - sr.received_at))) as avg_latency
  from sms_parsed sp
  left join sms_raw sr on sr.id = sp.sms_id
  where sp.created_at >= now() - interval '7 days'
)
select
  coalesce(raw.raw_count_7d, 0)::numeric as raw_count_7d,
  coalesce(parsed.parsed_count_7d, 0)::numeric as parsed_count_7d,
  case
    when coalesce(raw.raw_count_7d, 0) = 0 then null
    else coalesce(parsed.parsed_count_7d, 0) / nullif(raw.raw_count_7d, 0)
  end as success_rate,
  parsed.avg_latency as average_latency_seconds
from raw
cross join parsed;

create or replace view admin_dashboard_payment_metrics as
with confirmed as (
  select
    p.id,
    p.created_at,
    coalesce(to_ord.created_at, shop_ord.created_at) as origin_created_at
  from payments p
  left join ticket_orders to_ord on to_ord.id = p.ticket_order_id
  left join orders shop_ord on shop_ord.id = p.order_id
  where p.status = 'confirmed'
    and p.created_at >= now() - interval '7 days'
),
pending as (
  select
    (select count(*) from ticket_orders where status = 'pending')::numeric as ticket_pending,
    (select count(*) from orders where status = 'pending')::numeric as shop_pending
)
select
  (select count(*) from confirmed)::numeric as confirmed_count_7d,
  coalesce(pending.ticket_pending, 0) + coalesce(pending.shop_pending, 0) as pending_count,
  (
    select avg(extract(epoch from (c.created_at - c.origin_created_at)))
    from confirmed c
    where c.origin_created_at is not null
  ) as average_confirmation_seconds
from pending;

create or replace view admin_dashboard_gate_throughput as
select
  coalesce(gate, 'Unassigned') as gate,
  count(*)::numeric as passes,
  24 as window_hours
from ticket_passes
where created_at >= now() - interval '24 hours'
group by 1, 3;
