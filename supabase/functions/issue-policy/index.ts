import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const db = createClient(SUPABASE_URL, SERVICE);

serve(async (_req) => {
  // Load recent paid quotes
  const { data: quotes, error } = await db
    .from("insurance_quotes")
    .select("*")
    .eq("status", "paid")
    .limit(20);

  if (error) {
    return new Response(JSON.stringify({ ok: false, error: error.message }), { status: 500 });
  }

  let inspected = 0;
  let issued = 0;
  let perkTickets = 0;
  const errors: Array<{ quote_id: string; step: string; message: string }> = [];

  for (const q of quotes ?? []) {
    inspected++;

    try {
      // Idempotency: skip if a policy already exists for this quote
      const { data: existingPol, error: exErr } = await db
        .from("policies")
        .select("id")
        .eq("quote_id", q.id)
        .maybeSingle();

      if (exErr) {
        errors.push({ quote_id: q.id, step: "check_policy", message: exErr.message });
        continue;
      }
      if (existingPol?.id) {
        // Ensure quote is marked as issued and perk flag consistent, then continue
        const perkFlag = (q.premium ?? 0) >= 25_000;
        await db.from("insurance_quotes").update({ status: "issued", ticket_perk: perkFlag }).eq("id", q.id);
        continue;
      }

      // 1) Issue policy
      const now = new Date();
      const validFrom = now.toISOString();
      const validTo = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

      const { data: pol, error: polErr } = await db
        .from("policies")
        .insert({
          quote_id: q.id,
          number: "POL-" + crypto.randomUUID().slice(0, 8).toUpperCase(),
          valid_from: validFrom,
          valid_to: validTo,
        })
        .select()
        .single();

      if (polErr) {
        errors.push({ quote_id: q.id, step: "create_policy", message: polErr.message });
        continue;
      }

      // 2) Mark quote issued and set ticket perk
      const perk = (q.premium ?? 0) >= 25_000;
      const { error: updErr } = await db
        .from("insurance_quotes")
        .update({ status: "issued", ticket_perk: perk })
        .eq("id", q.id);

      if (updErr) {
        errors.push({ quote_id: q.id, step: "update_quote", message: updErr.message });
        continue;
      }

      issued++;

      // 3) If perk applies, auto-create a FREE Blue ticket once
      if (perk && q.user_id) {
        // Check user doesn't already have a perk ticket
        const { data: existingPerk, error: perkCheckErr } = await db
          .from("tickets")
          .select("id")
          .eq("user_id", q.user_id)
          .eq("momo_ref", "FREE-TICKET-PERK")
          .limit(1);

        if (!perkCheckErr && !(existingPerk && existingPerk.length)) {
          // Find nearest upcoming match
          const { data: matches, error: mErr } = await db
            .from("matches")
            .select("*")
            .gte("date", new Date().toISOString())
            .order("date", { ascending: true })
            .limit(1);

          if (!mErr) {
            const match = matches?.[0];
            if (match) {
              const { error: tErr } = await db.from("tickets").insert({
                user_id: q.user_id,
                match_id: match.id,
                zone: "Blue",
                price: 0,
                paid: true,
                momo_ref: "FREE-TICKET-PERK",
              });
              if (!tErr) {
                perkTickets++;

                // Log reward event (best-effort)
                await db.from("rewards_events").insert({
                  user_id: q.user_id,
                  source: "policy_perk",
                  ref_id: pol.id,
                  points: 0,
                  meta: { perk: "free_blue_ticket", match_id: match.id },
                }).catch(() => {});
              }
            }
          }
        }
      }
    } catch (e) {
      errors.push({
        quote_id: q.id,
        step: "unexpected",
        message: e instanceof Error ? e.message : "Unknown error",
      });
      continue;
    }
  }

  return new Response(
    JSON.stringify({
      ok: true,
      inspected,
      issued,
      perkTickets,
      errors: errors.length ? errors : undefined,
    }),
    { status: 200, headers: { "content-type": "application/json" } },
  );
});
