// Route: POST /match-payment
// Body: { sms_parsed_id: uuid }
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

import { z } from "../_shared/schema.ts";

import { getServiceRoleClient } from "../_shared/client.ts";
import { json, jsonError, requireMethod, validateJsonBody } from "../_shared/http.ts";
import { logError, logInfo, logWarn } from "../_shared/log.ts";

const supabase = getServiceRoleClient();

type TicketOrder = {
  id: string;
  total: number;
  created_at: string;
  status: string;
};

const payloadSchema = z.object({
  sms_parsed_id: z.string().uuid(),
});

serve(async (req) => {
  const methodError = requireMethod(req, "POST");
  if (methodError) {
    return methodError;
  }

  const validation = await validateJsonBody(req, payloadSchema);
  if (validation.error || !validation.data) {
    logWarn("match_payment_invalid_payload", { endpoint: "match-payment" });
    return validation.error ?? jsonError("invalid_payload", 400);
  }

  const { sms_parsed_id: smsParsedId } = validation.data;
  logInfo("match_payment_request", { smsParsedId });

  const { data: sp, error: spError } = await supabase
    .from("sms_parsed")
    .select("id, amount, ref, created_at, sms_raw:sms_id(user_id)")
    .eq("id", smsParsedId)
    .single();

  if (spError || !sp) {
    logWarn("match_payment_parsed_missing", { smsParsedId, error: spError?.message });
    return jsonError("parsed_not_found", 404);
  }

  const amount = sp.amount ?? 0;
  const userId = sp.sms_raw && typeof sp.sms_raw === 'object' && 'user_id' in sp.sms_raw 
    ? (sp.sms_raw as { user_id: string | null }).user_id 
    : null;
  const windowStart = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();

  const { data: existingPayments } = await supabase
    .from("payments")
    .select("id, order_id, kind, status")
    .eq("sms_parsed_id", sp.id)
    .limit(1);

  const existingPayment = existingPayments?.[0];
  if (existingPayment) {
    logInfo("match_payment_reuse", { smsParsedId, existingPayment: existingPayment.id });
    return json({
      ok: true,
      kind: existingPayment.kind,
      order_id: existingPayment.order_id,
      reused: true,
    });
  }

  const { data: orders } = await supabase
    .from("ticket_orders")
    .select("id, total, created_at, status")
    .eq("status", "pending")
    .gte("created_at", windowStart)
    .order("created_at", { ascending: true })
    .limit(100);

  let matchedOrder: TicketOrder | undefined;
  if (orders) {
    matchedOrder = orders.find((order) => order.total === amount);
  }

  let kind: "ticket" | "membership" | "donation" = "donation";
  let orderId: string | null = null;
  let matchedEntity: string | null = null;
  let paymentStatus: "pending" | "confirmed" | "failed" = "pending";
  let momoStatus: "pending" | "allocated" | "failed" | "manual" = "pending";
  let allocatedTo: string | null = null;
  let allocatedId: string | null = null;

  if (matchedOrder) {
    orderId = matchedOrder.id;
    matchedEntity = `order:${orderId}`;
    kind = "ticket";
    paymentStatus = "confirmed";
    momoStatus = "allocated";
    allocatedTo = "ticket_order";
    allocatedId = orderId;

    await supabase
      .from("ticket_orders")
      .update({ status: "paid", sms_ref: sp.ref ?? null })
      .eq("id", orderId);

    const { data: existingPasses } = await supabase
      .from("ticket_passes")
      .select("id")
      .eq("order_id", orderId)
      .limit(1);

    if (!existingPasses || existingPasses.length === 0) {
      const rawToken = crypto.randomUUID();
      await supabase.from("ticket_passes").insert({
        order_id: orderId,
        zone: "BLUE",
        gate: "G3",
        qr_token_hash: rawToken,
      });
    }
  }

  await supabase
    .from("sms_parsed")
    .update({ matched_entity: matchedEntity })
    .eq("id", sp.id);

  const { error: paymentError } = await supabase.from("payments").insert({
    kind,
    amount,
    status: paymentStatus,
    sms_parsed_id: sp.id,
    order_id: orderId,
  });

  if (paymentError) {
    logError("match_payment_insert_failed", { smsParsedId, error: paymentError.message });
    return jsonError(paymentError.message, 500);
  }

  // Create mobile_money_payments record if user_id is available
  if (userId) {
    const { error: momoError } = await supabase.from("mobile_money_payments").insert({
      sms_parsed_id: sp.id,
      user_id: userId,
      amount,
      currency: "RWF",
      ref: sp.ref ?? null,
      status: momoStatus,
      allocated_to: allocatedTo,
      allocated_id: allocatedId,
      allocated_at: momoStatus === "allocated" ? new Date().toISOString() : null,
    });

    if (momoError) {
      logWarn("match_payment_momo_insert_failed", { smsParsedId, error: momoError.message });
    }
  }

  try {
    const url = new URL(req.url);
    url.pathname = "/functions/v1/realtime-ping";
    await fetch(url.toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topic: "payments",
        payload: { amount, kind, order_id: orderId },
      }),
    });
  } catch {
    logWarn("match_payment_realtime_notify_failed", { smsParsedId, orderId });
  }

  logInfo("match_payment_completed", { smsParsedId, orderId, kind });
  return json({
    ok: true,
    kind,
    order_id: orderId,
    matched_entity: matchedEntity,
  });
});
