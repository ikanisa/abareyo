import { NextResponse } from "next/server";

import { withServiceSupabaseClient } from "@/app/api/_lib/supabase";
import { maskMsisdn } from "@/lib/msisdn";
import { formatUssdDisplay } from "@/lib/ussd";

type PendingPaymentPayload = {
  ticketOrderId?: string;
  paymentId?: string | null;
  amount?: number | string | null;
  channel?: string | null;
  contactName?: string | null;
  contactPhone?: string | null;
  ussdCode?: string | null;
  expiresAt?: string | null;
  userId?: string | null;
};

const normalizeAmount = (value: PendingPaymentPayload["amount"]): number => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, Math.round(value));
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    if (!Number.isNaN(parsed) && Number.isFinite(parsed)) {
      return Math.max(0, Math.round(parsed));
    }
  }
  return 0;
};

const derivePayerHint = (contactPhone: string | null | undefined, displayCode: string | null): string | null => {
  const fromContact = maskMsisdn(contactPhone ?? undefined);
  if (fromContact) {
    return fromContact;
  }

  if (!displayCode) {
    return null;
  }

  const match = displayCode.match(/\*182\*1\*1\*([^*#]+)\*/i);
  if (!match) {
    return null;
  }

  const raw = match[1];
  if (/x/i.test(raw)) {
    return null;
  }

  return maskMsisdn(raw);
};

export async function POST(request: Request) {
  let payload: PendingPaymentPayload;
  try {
    payload = (await request.json()) as PendingPaymentPayload;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const ticketOrderId = payload.ticketOrderId ?? undefined;
  const paymentId = payload.paymentId ?? undefined;
  if (!ticketOrderId && !paymentId) {
    return NextResponse.json({ error: "missing_order_reference" }, { status: 400 });
  }

  const amount = normalizeAmount(payload.amount);
  const displayCode = payload.ussdCode ? formatUssdDisplay(payload.ussdCode) : null;
  const payerHint = derivePayerHint(payload.contactPhone, displayCode);

  const metadata = {
    channel: payload.channel ?? null,
    contact_name: payload.contactName ?? null,
    contact_phone: payload.contactPhone ?? null,
    payer_hint: payerHint,
    ussd_display: displayCode,
    ussd_code: payload.ussdCode ?? null,
    expires_at: payload.expiresAt ?? null,
    user_id: payload.userId ?? null,
    source: "tickets_web",
    handoff: "clipboard_first",
  } satisfies Record<string, unknown>;

  return withServiceSupabaseClient(async (client) => {
    const record = {
      id: paymentId,
      ticket_order_id: ticketOrderId ?? null,
      kind: "ticket" as const,
      amount,
      status: "pending" as const,
      metadata,
    };

    const query = paymentId
      ? client.from("payments").upsert([record], { onConflict: "id" })
      : client.from("payments").insert([record]);

    const { error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  }, {
    fallback: async () => NextResponse.json({ ok: false, skipped: true }),
  });
}
