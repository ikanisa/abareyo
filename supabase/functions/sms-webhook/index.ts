// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

import { getServiceRoleClient } from "../_shared/client.ts";
import { getSmsWebhookToken, requireEnv } from "../_shared/env.ts";
import { json, parseJsonBody, requireMethod } from "../_shared/http.ts";
import { extractRequestMeta, writeAuditLog } from "../_shared/audit.ts";

const TOKEN = requireEnv(getSmsWebhookToken(), "SMS_WEBHOOK_TOKEN");
const db = getServiceRoleClient();

type Payload = { text?: string };

type MatchResult = { kind: string; id?: string };

async function ensureTicketPass(orderId: string) {
  const { data: existing } = await db
    .from("ticket_passes")
    .select("id")
    .eq("order_id", orderId)
    .limit(1);

  if (existing && existing.length) return;

  await db
    .from("ticket_passes")
    .insert({
      order_id: orderId,
      zone: "Blue",
      gate: "G3",
      qr_token_hash: crypto.randomUUID(),
    })
    .catch(() => {});
}

async function matchAndConfirm(amount: number, ref: string, idempotencyKey: string | null): Promise<MatchResult> {
  const { data: ticketOrders } = await db
    .from("ticket_orders")
    .select("id,total,status,user_id")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(50);
  const ticketOrder = (ticketOrders ?? []).find((order: any) => order.total === amount);
  if (ticketOrder) {
    await db.from("ticket_orders").update({ status: "paid", sms_ref: ref }).eq("id", ticketOrder.id);
    await ensureTicketPass(ticketOrder.id);
    await db
      .from("payments")
      .insert({
        kind: "ticket",
        amount,
        status: "confirmed",
        ticket_order_id: ticketOrder.id,
        metadata: { ref, idempotency_key: idempotencyKey },
      })
      .catch(() => {});
    return { kind: "ticket_order", id: ticketOrder.id };
  }

  const { data: shopOrders } = await db
    .from("orders")
    .select("id,total,status,user_id")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(50);
  const shopOrder = (shopOrders ?? []).find((order: any) => order.total === amount);
  if (shopOrder) {
    await db.from("orders").update({ status: "paid", momo_ref: ref }).eq("id", shopOrder.id);
    await db
      .from("payments")
      .insert({
        kind: "shop",
        amount,
        status: "confirmed",
        order_id: shopOrder.id,
        metadata: { ref, idempotency_key: idempotencyKey },
      })
      .catch(() => {});
    return { kind: "shop_order", id: shopOrder.id };
  }

  const { data: quotes } = await db
    .from("insurance_quotes")
    .select("id,premium,status")
    .eq("status", "quoted")
    .order("created_at", { ascending: true })
    .limit(50);
  const quote = (quotes ?? []).find((row: any) => row.premium === amount);
  if (quote) {
    await db.from("insurance_quotes").update({ status: "paid", ref }).eq("id", quote.id);
    await db
      .from("payments")
      .insert({ kind: "policy", amount, status: "confirmed", metadata: { ref, idempotency_key: idempotencyKey } })
      .catch(() => {});
    return { kind: "insurance_quote", id: quote.id };
  }

  const { data: deposits } = await db
    .from("sacco_deposits")
    .select("id,amount,status,user_id")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(50);
  const deposit = (deposits ?? []).find((row: any) => row.amount === amount);
  if (deposit) {
    await db.from("sacco_deposits").update({ status: "confirmed", ref }).eq("id", deposit.id);
    await db
      .from("payments")
      .insert({ kind: "deposit", amount, status: "confirmed", metadata: { ref, idempotency_key: idempotencyKey } })
      .catch(() => {});
    return { kind: "sacco_deposit", id: deposit.id };
  }

  return { kind: "unmatched" };
}

serve(async (req) => {
  const methodError = requireMethod(req, "POST");
  if (methodError) {
    return methodError;
  }

  const requestMeta = extractRequestMeta(req);

  const auth = req.headers.get("authorization")?.split("Bearer ")[1];
  if (!auth || auth !== TOKEN) {
    return new Response("Unauthorized", { status: 401 });
  }

  const parsed = await parseJsonBody<Payload>(req);
  if (parsed.error) {
    return parsed.error;
  }

  const txt = String(parsed.data?.text ?? "");
  console.log("[edge:sms-webhook] inbound", {
    received: new Date().toISOString(),
    length: txt.length,
  });
  const provider = req.headers.get("x-sms-provider")?.trim() ?? "unknown";
  const providedKey = req.headers.get("x-idempotency-key")?.trim();
  const idempotencyKey = providedKey ? `${provider}:${providedKey}` : null;

  if (idempotencyKey) {
    const { data: existingPayments } = await db
      .from("payments")
      .select("id, kind, order_id, metadata")
      .contains("metadata", { idempotency_key: idempotencyKey })
      .limit(1);

    if (existingPayments && existingPayments.length) {
      const existing = existingPayments[0];
      await writeAuditLog({
        action: "sms.webhook.dedup",
        entityType: "payment",
        entityId: existing.id,
        context: { provider, idempotencyKey },
        ...requestMeta,
      });
      return json({ ok: true, reused: true, result: { kind: existing.kind, id: existing.order_id } });
    }
  }
  const refMatch = txt.match(/Ref[: ]+([A-Z0-9\-]+)/i);
  const amtMatch = txt.match(/RWF[: ]*([\d,]+)/i);
  const REF = refMatch?.[1] ?? crypto.randomUUID().slice(0, 8).toUpperCase();
  const AMT = amtMatch ? Number(amtMatch[1].replace(/,/g, "")) : 0;

  const result = await matchAndConfirm(AMT, REF, idempotencyKey);
  console.log("[edge:sms-webhook] processed", { ref: REF, amount: AMT, result: result.kind });
  await writeAuditLog({
    action: "sms.webhook.processed",
    entityType: "payment",
    entityId: result.id,
    after: { ref: REF, amount: AMT, result: result.kind },
    context: { provider, idempotencyKey },
    ...requestMeta,
  });
  return json({ ok: true, parsed: { REF, AMT }, result });
});
