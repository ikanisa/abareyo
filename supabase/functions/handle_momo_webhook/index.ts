import { serve } from "https://deno.land/std@0.202.0/http/server.ts";

import { getServiceRoleClient } from "../_shared/client.ts";
import { json, jsonError, parseJsonBody, requireMethod } from "../_shared/http.ts";

type WebhookPayload = {
  momo_ref?: string;
  amount?: number;
  note?: string;
};

const supabase = getServiceRoleClient();

serve(async (req) => {
  const methodError = requireMethod(req, "POST");
  if (methodError) {
    return methodError;
  }

  const parsed = await parseJsonBody<WebhookPayload>(req);
  if (parsed.error) {
    return parsed.error;
  }

  const payload = parsed.data ?? {};
  const momoRef = payload.momo_ref;
  if (!momoRef) {
    return jsonError("missing_momo_ref", 400);
  }

  const amount = payload.amount ?? null;
  const note = payload.note ?? null;

  const ticketOrderResult = await supabase
    .from("ticket_orders")
    .select("id, user_id, total, status")
    .eq("momo_ref", momoRef)
    .maybeSingle();
  if (ticketOrderResult.error) {
    return jsonError(ticketOrderResult.error.message, 500);
  }
  if (ticketOrderResult.data) {
    const order = ticketOrderResult.data;
    if (order.status !== "paid") {
      await supabase.from("ticket_orders").update({ status: "paid" }).eq("id", order.id);
      await supabase.from("tickets").update({ paid: true, state: "active" }).eq("order_id", order.id);
      await supabase.from("transactions").insert({
        user_id: order.user_id,
        amount: amount ?? order.total,
        type: "purchase",
        ref: momoRef,
        status: "confirmed",
      });
      if (order.user_id) {
        await supabase.rpc("increment_user_points", {
          p_user_id: order.user_id,
          p_points_delta: amount ?? order.total ?? 0,
        });
      }
    }
    return json({ ok: true, matched: "ticket_order", id: order.id });
  }

  const ticketResult = await supabase
    .from("tickets")
    .select("id, user_id, price, paid")
    .eq("momo_ref", momoRef)
    .maybeSingle();
  if (ticketResult.error) {
    return jsonError(ticketResult.error.message, 500);
  }

  if (ticketResult.data) {
    const ticket = ticketResult.data;
    if (!ticket.paid) {
      await supabase.from("tickets").update({ paid: true, state: "active" }).eq("id", ticket.id);
      await supabase.from("transactions").insert({
        user_id: ticket.user_id,
        amount: amount ?? ticket.price,
        type: "purchase",
        ref: momoRef,
        status: "confirmed",
      });
      if (ticket.user_id) {
        await supabase.rpc("increment_user_points", {
          p_user_id: ticket.user_id,
          p_points_delta: amount ?? ticket.price ?? 0,
        });
      }
    }
    return json({ ok: true, matched: "ticket", id: ticket.id });
  }

  const orderResult = await supabase
    .from("orders")
    .select("id, user_id, total, status")
    .eq("momo_ref", momoRef)
    .maybeSingle();
  if (orderResult.error) {
    return jsonError(orderResult.error.message, 500);
  }
  if (orderResult.data) {
    const order = orderResult.data;
    if (order.status !== "paid") {
      await supabase.from("orders").update({ status: "paid" }).eq("id", order.id);
      await supabase.from("transactions").insert({
        user_id: order.user_id,
        amount: amount ?? order.total,
        type: "purchase",
        ref: momoRef,
        status: "confirmed",
      });
      if (order.user_id) {
        await supabase.rpc("increment_user_points", {
          p_user_id: order.user_id,
          p_points_delta: amount ?? order.total ?? 0,
        });
      }
    }
    return json({ ok: true, matched: "order", id: order.id });
  }

  const saccoResult = await supabase
    .from("sacco_deposits")
    .select("id, user_id, amount, status")
    .eq("ref", momoRef)
    .maybeSingle();
  if (saccoResult.error) {
    return jsonError(saccoResult.error.message, 500);
  }
  if (saccoResult.data) {
    const deposit = saccoResult.data;
    if (deposit.status !== "confirmed") {
      await supabase.from("sacco_deposits").update({ status: "confirmed" }).eq("id", deposit.id);
      await supabase.from("transactions").insert({
        user_id: deposit.user_id,
        amount: amount ?? deposit.amount,
        type: "deposit",
        ref: momoRef,
        status: "confirmed",
      });
      if (deposit.user_id) {
        await supabase.rpc("increment_user_points", {
          p_user_id: deposit.user_id,
          p_points_delta: amount ?? deposit.amount ?? 0,
        });
      }
    }
    return json({ ok: true, matched: "sacco_deposit", id: deposit.id });
  }

  const quoteResult = await supabase
    .from("insurance_quotes")
    .select("id, user_id, premium, status")
    .eq("ref", momoRef)
    .maybeSingle();
  if (quoteResult.error) {
    return jsonError(quoteResult.error.message, 500);
  }
  if (quoteResult.data) {
    const quote = quoteResult.data;
    if (quote.status !== "paid") {
      await supabase.from("insurance_quotes").update({ status: "paid" }).eq("id", quote.id);
      await supabase.from("transactions").insert({
        user_id: quote.user_id,
        amount: amount ?? quote.premium,
        type: "purchase",
        ref: momoRef,
        status: "confirmed",
      });
      if (quote.user_id) {
        await supabase.rpc("increment_user_points", {
          p_user_id: quote.user_id,
          p_points_delta: amount ?? quote.premium ?? 0,
        });
      }
    }
    return json({ ok: true, matched: "insurance_quote", id: quote.id });
  }

  return json({ ok: false, matched: null, momo_ref: momoRef, amount, note });
});
