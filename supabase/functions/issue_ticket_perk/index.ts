import { serve } from "https://deno.land/std@0.202.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type Payload = {
  quote_id?: string;
};

const rawSupabaseUrl = Deno.env.get("SITE_SUPABASE_URL") ?? Deno.env.get("SUPABASE_URL");
const rawServiceKey =
  Deno.env.get("SITE_SUPABASE_SECRET_KEY") ??
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ??
  Deno.env.get("SUPABASE_SECRET_KEY");
const TICKET_THRESHOLD = Number(Deno.env.get("TICKET_PERK_THRESHOLD") ?? "50000");

if (!rawSupabaseUrl || !rawServiceKey) {
  throw new Error("Supabase URL or secret key is missing");
}

const supabase = createClient(rawSupabaseUrl, rawServiceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  let payload: Payload;
  try {
    payload = await req.json();
  } catch {
    return json({ error: "invalid_json" }, 400);
  }

  if (!payload.quote_id) {
    return json({ error: "missing_quote_id" }, 400);
  }

  const { data: quote, error: quoteError } = await supabase
    .from("insurance_quotes")
    .select("id, user_id, premium, status")
    .eq("id", payload.quote_id)
    .maybeSingle();
  if (quoteError) {
    return json({ error: quoteError.message }, 500);
  }
  if (!quote) {
    return json({ error: "quote_not_found" }, 404);
  }
  if (!quote.user_id) {
    return json({ error: "quote_missing_user" }, 400);
  }
  if (quote.premium < TICKET_THRESHOLD) {
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
    return json({ error: "policy_not_found" }, 404);
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
    return json({ error: "no_upcoming_match" }, 404);
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
    return json({ error: ticketError.message }, 500);
  }

  await supabase
    .from("policies")
    .update({ free_ticket_issued: true })
    .eq("id", policy.id);

  return json({ ok: true, ticket_id: ticket.id });
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
