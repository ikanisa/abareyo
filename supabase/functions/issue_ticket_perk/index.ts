import { serve } from "https://deno.land/std@0.202.0/http/server.ts";

import { getServiceRoleClient } from "../_shared/client.ts";
import { json, jsonError, parseJsonBody, requireMethod } from "../_shared/http.ts";

type Payload = {
  quote_id?: string;
};

const supabase = getServiceRoleClient();
const TICKET_THRESHOLD = Number(Deno.env.get("TICKET_PERK_THRESHOLD") ?? "50000");

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
  if (!payload.quote_id) {
    return jsonError("missing_quote_id", 400);
  }

  const { data: quote, error: quoteError } = await supabase
    .from("insurance_quotes")
    .select("id, user_id, premium, status")
    .eq("id", payload.quote_id)
    .maybeSingle();
  if (quoteError) {
    return jsonError(quoteError.message, 500);
  }
  if (!quote) {
    return jsonError("quote_not_found", 404);
  }
  if (!quote.user_id) {
    return jsonError("quote_missing_user", 400);
  }
  if ((quote.premium ?? 0) < TICKET_THRESHOLD) {
    return json({ ok: false, reason: "threshold_not_met" });
  }
  if (quote.status !== "paid" && quote.status !== "issued") {
    return json({ ok: false, reason: "quote_not_paid" });
  }

  const { data: policy } = await supabase
    .from("policies")
    .select("id, free_ticket_issued")
    .eq("quote_id", quote.id)
    .maybeSingle();
  if (!policy) {
    return jsonError("policy_not_found", 404);
  }
  if (policy.free_ticket_issued) {
    return json({ ok: false, reason: "ticket_already_issued" });
  }

  const { data: match } = await supabase
    .from("matches")
    .select("id")
    .eq("status", "upcoming")
    .order("date", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!match) {
    return jsonError("no_upcoming_match", 404);
  }

  const { data: ticket, error: ticketError } = await supabase
    .from("tickets")
    .insert({
      user_id: quote.user_id,
      match_id: match.id,
      zone: "Regular",
      price: 0,
      paid: true,
      momo_ref: `perk:${quote.id}`,
      state: "active",
      gate: "Perk",
      qr_token: crypto.randomUUID(),
    })
    .select("id")
    .single();
  if (ticketError) {
    return jsonError(ticketError.message, 500);
  }

  await supabase.from("policies").update({ free_ticket_issued: true }).eq("id", policy.id);

  return json({ ok: true, ticket_id: ticket?.id ?? null });
});
