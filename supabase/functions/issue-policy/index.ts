import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const db = createClient(SUPABASE_URL, SERVICE);

serve(async (_req) => {
  // 1) Pull a small batch of paid quotes
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

  // Helpers
  const nowIso = () => new Date().toISOString();
  const plusDaysIso = (days: number) =>
    new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

  async function findNearestUpcomingMatch() {
    // Try matches.date
    const now = nowIso();
    let { data: byDate, error: dateErr } = await db
      .from("matches")
      .select("*")
      .gte("date", now)
      .order("date", { ascending: true })
      .limit(1);

    if (!dateErr && byDate && byDate.length) return byDate[0];

    // Fallback: matches.kickoff
    const { data: byKick, error: kickErr } = await db
      .from("matches")
      .select("*")
      .gte("kickoff", now)
      .order("kickoff", { ascending: true })
      .limit(1);

    if (!kickErr && byKick && byKick.length) return byKick[0];
    return null;
  }

  async function hasExistingPerk(userId: string) {
    // Check BOTH schemas for prior perk
    const { data: t1 } = await db
      .from("tickets")
      .select("id")
      .eq("user_id", userId)
      .eq("momo_ref", "FREE-TICKET-PERK")
      .limit(1);

    if (t1 && t1.length) return true;

    const { data: t2 } = await db
      .from("ticket_orders")
      .select("id")
      .eq("user_id", userId)
      .eq("sms_ref", "FREE-TICKET-PERK")
      .limit(1);

    return !!(t2 && t2.length);
  }

  async function grantPerkTicketLegacy(userId: string, matchId: string) {
    const { error: tErr } = await db.from("tickets").insert({
      user_id: userId,
      match_id: matchId,
      zone: "Blue",
      price: 0,
      paid: true,
      momo_ref: "FREE-TICKET-PERK",
    });
    return !tErr;
  }

  async function grantPerkTicketNew(userId: string, matchId: string, policyId: string) {
    // Create a zero-total paid order with sms_ref marker
    const { data: order, error: orderErr } = await db
      .from("ticket_orders")
      .insert({
        user_id: userId,
        match_id: matchId,
        total: 0,
        status: "paid",
        sms_ref: "FREE-TICKET-PERK",
      })
      .select("id")
      .single();

    if (orderErr || !order?.id) return false;

    // Create one Blue pass; store a token hash (raw token or UUID)
    const rawToken = crypto.randomUUID(); // keep simple; hashing optional if your DB expects hash
    const { error: passErr } = await db
      .from("ticket_passes")
      .insert({
        order_id: order.id,
        zone: "Blue",
        gate: "G3",
        qr_token_hash: rawToken,
      })
      .select("id")
      .single();

    if (passErr) return false;

    // Log event (best-effort)
    await db
      .from("rewards_events")
      .insert({
        user_id: userId,
        source: "policy_perk",
        ref_id: policyId,
        points: 0,
        meta: { perk: "free_blue_ticket", match_id: matchId, order_id: order.id },
      })
      .catch(() => {});

    return true;
  }

  for (const q of quotes ?? []) {
    inspected++;
    try {
      // Idempotency: if a policy already exists for this quote, ensure quote is issued and continue
      const { data: existingPol, error: exErr } = await db
        .from("policies")
        .select("id")
        .eq("quote_id", q.id)
        .maybeSingle();

      if (exErr) {
        errors.push({ quote_id: q.id, step: "check_policy", message: exErr.message });
        continue;
      }

      if (!existingPol?.id) {
        // Issue new policy
        const { data: pol, error: polErr } = await db
          .from("policies")
          .insert({
            quote_id: q.id,
            number: "POL-" + crypto.randomUUID().slice(0, 8).toUpperCase(),
            valid_from: nowIso(),
            valid_to: plusDaysIso(30),
          })
          .select()
          .single();

        if (polErr || !pol) {
          errors.push({ quote_id: q.id, step: "create_policy", message: polErr?.message ?? "policy_insert_failed" });
          continue;
        }

        // Update quote -> issued + perk flag
        const perkFlag = (q.premium ?? 0) >= 25_000;
        const { error: updErr } = await db
          .from("insurance_quotes")
          .update({ status: "issued", ticket_perk: perkFlag })
          .eq("id", q.id);
        if (updErr) {
          errors.push({ quote_id: q.id, step: "update_quote", message: updErr.message });
          continue;
        }

        issued++;

        // Perk ticket grant (new policy path)
        if (perkFlag && q.user_id) {
          if (!(await hasExistingPerk(q.user_id))) {
            const match = await findNearestUpcomingMatch();
            if (match) {
              // Try new schema first; if it fails, fallback to legacy tickets table
              const okNew = await grantPerkTicketNew(q.user_id, match.id, pol.id);
              if (okNew) {
                perkTickets++;
              } else {
                const okLegacy = await grantPerkTicketLegacy(q.user_id, match.id);
                if (okLegacy) {
                  perkTickets++;
                  // Best-effort log
                  await db
                    .from("rewards_events")
                    .insert({
                      user_id: q.user_id,
                      source: "policy_perk",
                      ref_id: pol.id,
                      points: 0,
                      meta: { perk: "free_blue_ticket", match_id: match.id },
                    })
                    .catch(() => {});
                }
              }
            }
          }
        }
      } else {
        // Policy exists: make sure quote is marked issued and perk flag consistent
        const perkFlag = (q.premium ?? 0) >= 25_000;
        await db.from("insurance_quotes").update({ status: "issued", ticket_perk: perkFlag }).eq("id", q.id);
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
