import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const db = createClient(SUPABASE_URL, SERVICE);

serve(async (_req) => {
  // Find quotes that are paid but not yet issued
  const { data: quotes, error } = await db
    .from("insurance_quotes")
    .select("*")
    .eq("status", "paid")
    .limit(20);
  if (error) {
    return new Response(JSON.stringify({ ok: false, error: error.message }), { status: 500 });
  }

  let issued = 0, tickets = 0;
  for (const q of quotes ?? []) {
    // 1) Issue policy
    const { data: pol, error: e1 } = await db
      .from("policies")
      .insert({
        quote_id: q.id,
        number: "POL-" + crypto.randomUUID().slice(0, 8).toUpperCase(),
        valid_from: new Date().toISOString(),
        valid_to: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
      })
      .select()
      .single();
    if (e1) continue;

    // Mark quote issued; set perk flag if premium >= 25k
    const perk = (q.premium ?? 0) >= 25000;
    await db.from("insurance_quotes").update({ status: "issued", ticket_perk: perk }).eq("id", q.id);
    issued++;

    // 2) If perk, auto-create FREE BLUE ticket (price 0, paid=true)
    if (perk && q.user_id) {
      // Pick the nearest upcoming match
      const { data: m } = await db
        .from("matches")
        .select("*")
        .gte("kickoff", new Date().toISOString())
        .order("kickoff", { ascending: true })
        .limit(1);
      const match = m?.[0];
      if (match) {
        const { data: existingPerk } = await db
          .from("ticket_orders")
          .select("id")
          .eq("user_id", q.user_id)
          .eq("sms_ref", "FREE-TICKET-PERK")
          .limit(1);
        const alreadyHasPerk = Boolean(existingPerk && existingPerk.length);
        if (!alreadyHasPerk) {
          const { data: order, error: orderError } = await db
            .from("ticket_orders")
            .insert({
              user_id: q.user_id,
              match_id: match.id,
              total: 0,
              status: "paid",
              sms_ref: "FREE-TICKET-PERK",
            })
            .select("id")
            .single();
          if (order && !orderError) {
            const { data: pass, error: passError } = await db
              .from("ticket_passes")
              .insert({
                order_id: order.id,
                zone: "Blue",
                gate: "G3",
              })
              .select("id")
              .single();
            if (pass && !passError) {
              tickets++;
              // optional: log event
              await db.from("rewards_events").insert({
                user_id: q.user_id,
                source: "policy_perk",
                ref_id: pol.id,
                points: 0,
                meta: { perk: "free_blue_ticket", match_id: match.id, order_id: order.id, pass_id: pass.id },
              });
            }
          }
        }
      }
    }
  }
  return new Response(JSON.stringify({ ok: true, issued, tickets }), { status: 200 });
});
