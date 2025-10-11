// Route: POST /match-payment
// Body: { sms_parsed_id: uuid }
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

type TicketOrder = {
  id: string;
  total: number;
  created_at: string;
  status: string;
};

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  let payload: { sms_parsed_id?: string };
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "invalid_json" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const smsParsedId = payload.sms_parsed_id;
  if (!smsParsedId) {
    return new Response(JSON.stringify({ error: "missing_sms_parsed_id" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { data: sp, error: spError } = await supabase
    .from("sms_parsed")
    .select("id, amount, ref, created_at")
    .eq("id", smsParsedId)
    .single();

  if (spError || !sp) {
    return new Response(JSON.stringify({ error: "parsed_not_found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const amount = sp.amount ?? 0;
  const windowStart = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();

  const { data: existingPayments } = await supabase
    .from("payments")
    .select("id, order_id, kind, status")
    .eq("sms_parsed_id", sp.id)
    .limit(1);

  const existingPayment = existingPayments?.[0];
  if (existingPayment) {
    return new Response(
      JSON.stringify({
        ok: true,
        kind: existingPayment.kind,
        order_id: existingPayment.order_id,
        reused: true,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
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

  if (matchedOrder) {
    orderId = matchedOrder.id;
    matchedEntity = `order:${orderId}`;
    kind = "ticket";
    paymentStatus = "confirmed";

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
    return new Response(JSON.stringify({ error: paymentError.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
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

  return new Response(
    JSON.stringify({
      ok: true,
      kind,
      order_id: orderId,
      matched_entity: matchedEntity,
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    },
  );
});
