-- Capture WhatsApp delivery status webhooks for auditability and support follow-up flows.
create table if not exists public.whatsapp_delivery_events (
  id uuid primary key default gen_random_uuid(),
  message_id text not null,
  phone text,
  status text not null,
  conversation_id text,
  event_timestamp timestamptz,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists whatsapp_delivery_events_message_status_idx
  on public.whatsapp_delivery_events (message_id, status);

create index if not exists whatsapp_delivery_events_created_at_idx
  on public.whatsapp_delivery_events (created_at desc);
