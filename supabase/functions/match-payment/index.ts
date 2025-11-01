// Route: POST /match-payment
// Body: { sms_parsed_id: uuid }
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

import { getServiceRoleClient } from "../_shared/client.ts";
import { json, jsonError, parseJsonBody, requireMethod } from "../_shared/http.ts";

const supabase = getServiceRoleClient();

type TicketOrder = {
  id: string;
  total: number;
  created_at: string;
  status: string;
};

type Payload = { sms_parsed_id?: string };

serve(async (req) => {
  const methodError = requireMethod(req, "POST");
  if (methodError) {
    return methodError;
  }

  const parsed = await parseJsonBody<Payload>(req);
  if (parsed.error) {
    return parsed.error;
  }

  const payload = parsed.data ?? {};
  const smsParsedId = payload.sms_parsed_id;
  if (!smsParsedId) {
    return jsonError("missing_sms_parsed_id", 400);
  }

  const { data: sp, error: spError } = await supabase
    .from("sms_parsed")
    .select("id, amount, ref, created_at, sms_raw:sms_id(user_id)")
    .eq("id", smsParsedId)
    .single();

  if (spError || !sp) {
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
    return jsonError(paymentError.message, 500);
  }

  // Create mobile_money_payments record if user_id is available
  if (userId) {
    await supabase.from("mobile_money_payments").insert({
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
    // Realtime fanout is best-effort.
  }

  return json({
    ok: true,
    kind,
    order_id: orderId,
    matched_entity: matchedEntity,
  });
});
