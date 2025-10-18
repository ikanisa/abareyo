// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const TOKEN = Deno.env.get("SMS_WEBHOOK_TOKEN");
const rawSupabaseUrl = Deno.env.get("SITE_SUPABASE_URL") ?? Deno.env.get("SUPABASE_URL");
const rawServiceKey =
  Deno.env.get("SITE_SUPABASE_SECRET_KEY") ??
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ??
  Deno.env.get("SUPABASE_SECRET_KEY");

if (!TOKEN || !rawSupabaseUrl || !rawServiceKey) {
  throw new Error("SMS webhook token or Supabase credentials are missing");
}

const db = createClient(rawSupabaseUrl, rawServiceKey);

serve(async (req) => {
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });
  const auth = req.headers.get("authorization")?.split("Bearer ")[1];
  if (!auth || auth !== TOKEN) return new Response("Unauthorized", { status: 401 });

  const payload = await req.json().catch(() => ({}));
  const txt = String(payload?.text ?? "");
  const refMatch = txt.match(/Ref[: ]+([A-Z0-9\-]+)/i);
  const amtMatch = txt.match(/RWF[: ]*([\d,]+)/i);
  const REF = refMatch?.[1] ?? crypto.randomUUID().slice(0, 8).toUpperCase();
  const AMT = amtMatch ? Number(amtMatch[1].replace(/,/g, "")) : 0;

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

  // Try to match pending ticket/order/quote/deposit by amount or placeholder ref
  // We prioritise ticket orders, then shop orders, insurance quotes, and sacco deposits.
  async function matchAndConfirm() {
    // ticket orders (new schema)
    const { data: ticketOrders } = await db
      .from("ticket_orders")
      .select("id,total,status,user_id")
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(50);

    const ticketOrder = (ticketOrders ?? []).find((order: any) => order.total === AMT);
    if (ticketOrder) {
      await db.from("ticket_orders").update({ status: "paid", sms_ref: REF }).eq("id", ticketOrder.id);
      await ensureTicketPass(ticketOrder.id);
      await db
        .from("payments")
        .insert({ kind: "ticket", amount: AMT, status: "confirmed", ticket_order_id: ticketOrder.id, metadata: { ref: REF } })
        .catch(() => {});
      return { kind: "ticket_order", id: ticketOrder.id };
    }

    // shop orders
    const { data: shopOrders } = await db
      .from("orders")
      .select("id,total,status,user_id")
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(50);
    const shopOrder = (shopOrders ?? []).find((order: any) => order.total === AMT);
    if (shopOrder) {
      await db.from("orders").update({ status: "paid", momo_ref: REF }).eq("id", shopOrder.id);
      await db
        .from("payments")
        .insert({ kind: "shop", amount: AMT, status: "confirmed", order_id: shopOrder.id, metadata: { ref: REF } })
        .catch(() => {});
      return { kind: "shop_order", id: shopOrder.id };
    }

    // insurance quotes
    const { data: quotes } = await db
      .from("insurance_quotes")
      .select("id,premium,status")
      .eq("status", "quoted")
      .order("created_at", { ascending: true })
      .limit(50);
    const quote = (quotes ?? []).find((row: any) => row.premium === AMT);
    if (quote) {
      await db.from("insurance_quotes").update({ status: "paid", ref: REF }).eq("id", quote.id);
      await db
        .from("payments")
        .insert({ kind: "policy", amount: AMT, status: "confirmed", metadata: { ref: REF } })
        .catch(() => {});
      return { kind: "insurance_quote", id: quote.id };
    }

    // sacco deposits
    const { data: deposits } = await db
      .from("sacco_deposits")
      .select("id,amount,status,user_id")
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(50);
    const deposit = (deposits ?? []).find((row: any) => row.amount === AMT);
    if (deposit) {
      await db.from("sacco_deposits").update({ status: "confirmed", ref: REF }).eq("id", deposit.id);
      await db
        .from("payments")
        .insert({ kind: "deposit", amount: AMT, status: "confirmed", metadata: { ref: REF } })
        .catch(() => {});
      return { kind: "sacco_deposit", id: deposit.id };
    }

    return { kind: "unmatched" };
  }

  const result = await matchAndConfirm();
  return new Response(JSON.stringify({ ok: true, parsed: { REF, AMT }, result }), { status: 200 });
});
