import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const createSupabaseClient = () => {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
};

type EntityKind = 'ticket' | 'order' | 'quote' | 'deposit';

type AttachPayload = {
  smsId?: string;
  sms_id?: string;
  entity?: { kind: EntityKind; id: string };
  adminId?: string | null;
  admin_id?: string | null;
  note?: string | null;
  manual_note?: string | null;
};

type TicketOrderRecord = {
  id: string;
  user_id: string | null;
  total: number;
  status: string;
  sms_ref: string | null;
};

type ShopOrderRecord = {
  id: string;
  user_id: string | null;
  total: number;
  status: string;
  momo_ref: string | null;
};

type InsuranceQuoteRecord = {
  id: string;
  user_id: string | null;
  premium: number;
  status: string;
  ref: string | null;
};

type SaccoDepositRecord = {
  id: string;
  user_id: string | null;
  amount: number;
  status: string;
  ref: string | null;
};

type SmsParsedRecord = {
  id: string;
  amount: number;
  ref: string | null;
  created_at: string;
};

type EntityRecordMap = {
  ticket: TicketOrderRecord;
  order: ShopOrderRecord;
  quote: InsuranceQuoteRecord;
  deposit: SaccoDepositRecord;
};

type EntityTable = {
  [K in EntityKind]: string;
};

const ENTITY_TABLE: EntityTable = {
  ticket: 'ticket_orders',
  order: 'orders',
  quote: 'insurance_quotes',
  deposit: 'sacco_deposits',
};

async function fetchEntity<K extends EntityKind>(
  db: SupabaseClient,
  kind: K,
  id: string,
): Promise<EntityRecordMap[K] | null> {
  const { data, error } = await db.from(ENTITY_TABLE[kind]).select('*').eq('id', id).maybeSingle();
  if (error) {
    throw new Error(error.message);
  }
  return (data as EntityRecordMap[K] | null) ?? null;
}

async function ensureTicketPass(db: SupabaseClient, orderId: string) {
  const { data: existing, error } = await db
    .from('ticket_passes')
    .select('id')
    .eq('order_id', orderId)
    .limit(1);
  if (error) {
    throw new Error(error.message);
  }
  if (!existing || existing.length === 0) {
    const { error: insertError } = await db.from('ticket_passes').insert({
      order_id: orderId,
      zone: 'BLUE',
      gate: 'G3',
      qr_token_hash: randomUUID(),
    });
    if (insertError) {
      throw new Error(insertError.message);
    }
  }
}

async function updateEntity(
  db: SupabaseClient,
  kind: EntityKind,
  id: string,
  parsed: SmsParsedRecord,
): Promise<void> {
  if (kind === 'ticket') {
    const { error } = await db
      .from('ticket_orders')
      .update({ status: 'paid', sms_ref: parsed.ref ?? null })
      .eq('id', id);
    if (error) throw new Error(error.message);
    await ensureTicketPass(db, id);
    return;
  }
  if (kind === 'order') {
    const { error } = await db
      .from('orders')
      .update({ status: 'paid', momo_ref: parsed.ref ?? null })
      .eq('id', id);
    if (error) throw new Error(error.message);
    return;
  }
  if (kind === 'quote') {
    const { error } = await db
      .from('insurance_quotes')
      .update({ status: 'paid', ref: parsed.ref ?? null })
      .eq('id', id);
    if (error) throw new Error(error.message);
    return;
  }
  if (kind === 'deposit') {
    const { error } = await db
      .from('sacco_deposits')
      .update({ status: 'confirmed', ref: parsed.ref ?? null })
      .eq('id', id);
    if (error) throw new Error(error.message);
  }
}

async function markSmsMatched(db: SupabaseClient, smsId: string, entity: { kind: EntityKind; id: string }) {
  const { error } = await db
    .from('sms_parsed')
    .update({ matched_entity: `${entity.kind}:${entity.id}` })
    .eq('id', smsId);
  if (error) {
    throw new Error(error.message);
  }
}

async function writeAudit(entry: Record<string, unknown>) {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  if (!backendUrl) {
    return;
  }
  try {
    const endpoint = `${backendUrl.replace(/\/$/, '')}/admin/api/audit`;
    await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    });
  } catch {
    // audit fan-out is best effort
  }
}

export async function POST(request: Request) {
  const db = createSupabaseClient();
  if (!db) {
    return NextResponse.json({ error: 'supabase_not_configured' }, { status: 500 });
  }
  let payload: AttachPayload;
  try {
    payload = (await request.json()) as AttachPayload;
  } catch {
    return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });
  }

  const smsId = payload.smsId ?? payload.sms_id;
  const entity = payload.entity;
  const adminId = payload.adminId ?? payload.admin_id ?? null;
  const manualNote = payload.note ?? payload.manual_note ?? null;

  if (!smsId || !entity?.id || !entity.kind) {
    return NextResponse.json({ error: 'missing_fields' }, { status: 400 });
  }

  try {
    const { data: parsed, error: parsedError } = await db
      .from('sms_parsed')
      .select('id, amount, ref, created_at')
      .eq('id', smsId)
      .maybeSingle();

    if (parsedError) {
      throw new Error(parsedError.message);
    }

    if (!parsed) {
      return NextResponse.json({ error: 'sms_not_found' }, { status: 404 });
    }

    const before = await fetchEntity(db, entity.kind, entity.id);
    if (!before) {
      return NextResponse.json({ error: 'entity_not_found' }, { status: 404 });
    }

    await updateEntity(db, entity.kind, entity.id, parsed as SmsParsedRecord);
    await markSmsMatched(db, smsId, entity);

    const after = await fetchEntity(db, entity.kind, entity.id);

    await writeAudit({
      action: 'sms_attach',
      entity_type: entity.kind,
      entity_id: entity.id,
      before,
      after,
      admin_user_id: adminId,
      context: { sms_id: smsId, sms_ref: parsed.ref ?? null, note: manualNote },
    });

    return NextResponse.json({ ok: true, ref: parsed.ref ?? null });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'attach_failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
