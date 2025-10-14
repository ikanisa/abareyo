import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

import { recordAudit } from '@/app/admin/api/_lib/audit';
import { AdminAuthError, requireAdminSession } from '@/app/admin/api/_lib/session';
import { getSupabaseAdmin } from '@/app/admin/api/_lib/supabase';

const ORDER_SUMMARY = 'id, status, momo_ref, total, match_id, created_at';
const SHOP_ORDER_SUMMARY = 'id, status, momo_ref, total, created_at';
const QUOTE_SUMMARY = 'id, status, ref, premium, user_id, created_at';
const DEPOSIT_SUMMARY = 'id, status, ref, amount, user_id, created_at';

export async function POST(request: NextRequest) {
  let payload: { sms_id?: string; entity?: { kind?: string; id?: string } } | null = null;

  try {
    const session = await requireAdminSession();
    const supabase = getSupabaseAdmin();

    payload = (await request.json().catch(() => null)) as typeof payload;
    const smsId = payload?.sms_id;
    const entity = payload?.entity;

    if (!smsId || !entity?.kind || !entity.id) {
      return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });
    }

    const { data: sms, error: smsError } = await supabase
      .from('sms_parsed')
      .select('id, ref, amount, payer_mask, created_at, sms_id')
      .eq('id', smsId)
      .maybeSingle();

    if (smsError) {
      throw smsError;
    }

    if (!sms) {
      return NextResponse.json({ error: 'sms_not_found' }, { status: 404 });
    }

    const refValue = sms.ref ?? sms.id;

    if (entity.kind === 'ticket') {
      const { data: before, error: beforeError } = await supabase
        .from('ticket_orders')
        .select(ORDER_SUMMARY)
        .eq('id', entity.id)
        .maybeSingle();

      if (beforeError) throw beforeError;
      if (!before) return NextResponse.json({ error: 'ticket_order_not_found' }, { status: 404 });

      const { data: updated, error: updateError } = await supabase
        .from('ticket_orders')
        .update({ status: 'paid', momo_ref: refValue })
        .eq('id', entity.id)
        .select(ORDER_SUMMARY)
        .single();

      if (updateError) throw updateError;

      const { data: existingPasses, error: passCheckError } = await supabase
        .from('ticket_passes')
        .select('id')
        .eq('order_id', entity.id)
        .limit(1);

      if (passCheckError) throw passCheckError;

      if (!existingPasses || existingPasses.length === 0) {
        const { data: newPass, error: passError } = await supabase
          .from('ticket_passes')
          .insert({ order_id: entity.id, zone: 'Blue', gate: 'G3', state: 'active', qr_token_hash: randomUUID() })
          .select('id, zone, gate, state, created_at')
          .single();

        if (passError) throw passError;

        await recordAudit(supabase, {
          action: 'ticket_passes.insert',
          entityType: 'ticket_pass',
          entityId: newPass.id,
          before: null,
          after: newPass,
          userId: session.user.id,
          ip: session.ip,
          userAgent: session.userAgent,
        });
      }

      await recordAudit(supabase, {
        action: 'ticket_orders.attach_sms',
        entityType: 'ticket_order',
        entityId: entity.id,
        before,
        after: updated,
        userId: session.user.id,
        ip: session.ip,
        userAgent: session.userAgent,
      });
    } else if (entity.kind === 'order') {
      const { data: before, error: beforeError } = await supabase
        .from('orders')
        .select(SHOP_ORDER_SUMMARY)
        .eq('id', entity.id)
        .maybeSingle();

      if (beforeError) throw beforeError;
      if (!before) return NextResponse.json({ error: 'shop_order_not_found' }, { status: 404 });

      const { data: updated, error: updateError } = await supabase
        .from('orders')
        .update({ status: 'paid', momo_ref: refValue })
        .eq('id', entity.id)
        .select(SHOP_ORDER_SUMMARY)
        .single();

      if (updateError) throw updateError;

      await recordAudit(supabase, {
        action: 'orders.attach_sms',
        entityType: 'shop_order',
        entityId: entity.id,
        before,
        after: updated,
        userId: session.user.id,
        ip: session.ip,
        userAgent: session.userAgent,
      });
    } else if (entity.kind === 'quote') {
      const { data: before, error: beforeError } = await supabase
        .from('insurance_quotes')
        .select(QUOTE_SUMMARY)
        .eq('id', entity.id)
        .maybeSingle();

      if (beforeError) throw beforeError;
      if (!before) return NextResponse.json({ error: 'quote_not_found' }, { status: 404 });

      const { data: updated, error: updateError } = await supabase
        .from('insurance_quotes')
        .update({ status: 'paid', ref: refValue })
        .eq('id', entity.id)
        .select(QUOTE_SUMMARY)
        .single();

      if (updateError) throw updateError;

      await recordAudit(supabase, {
        action: 'insurance_quotes.attach_sms',
        entityType: 'insurance_quote',
        entityId: entity.id,
        before,
        after: updated,
        userId: session.user.id,
        ip: session.ip,
        userAgent: session.userAgent,
      });
    } else if (entity.kind === 'deposit') {
      const { data: before, error: beforeError } = await supabase
        .from('sacco_deposits')
        .select(DEPOSIT_SUMMARY)
        .eq('id', entity.id)
        .maybeSingle();

      if (beforeError) throw beforeError;
      if (!before) return NextResponse.json({ error: 'deposit_not_found' }, { status: 404 });

      const { data: updated, error: updateError } = await supabase
        .from('sacco_deposits')
        .update({ status: 'confirmed', ref: refValue })
        .eq('id', entity.id)
        .select(DEPOSIT_SUMMARY)
        .single();

      if (updateError) throw updateError;

      await recordAudit(supabase, {
        action: 'sacco_deposits.attach_sms',
        entityType: 'sacco_deposit',
        entityId: entity.id,
        before,
        after: updated,
        userId: session.user.id,
        ip: session.ip,
        userAgent: session.userAgent,
      });
    } else {
      return NextResponse.json({ error: 'unsupported_entity' }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error('Failed to attach SMS to entity', error, payload);
    return NextResponse.json({ error: 'sms_attach_failed' }, { status: 500 });
  }
}
