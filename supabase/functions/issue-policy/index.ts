import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

import { getServiceRoleClient } from "../_shared/client.ts";
import { json, requireMethod } from "../_shared/http.ts";

const db = getServiceRoleClient();

serve(async (req) => {
  const methodError = requireMethod(req, "POST");
  if (methodError) {
    return methodError;
  }

  console.log("[edge:issue-policy] start", { at: new Date().toISOString() });
  const { data: quotes, error } = await db
    .from("insurance_quotes")
    .select("*")
    .eq("status", "paid")
    .limit(20);

  if (error) {
    return json({ ok: false, error: error.message }, { status: 500 });
  }

  let inspected = 0;
  let issued = 0;
  let perkTickets = 0;
  const errors: Array<{ quote_id: string; step: string; message: string }> = [];

  const nowIso = () => new Date().toISOString();
  const plusDaysIso = (days: number) => new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

  async function findNearestUpcomingMatch() {
    const now = nowIso();

    const { data: byDate, error: dateErr } = await db
      .from("matches")
      .select("*")
      .gte("date", now)
      .order("date", { ascending: true })
      .limit(1);

    if (!dateErr && byDate && byDate.length) return byDate[0];

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

  async function grantPerkTicketNew(userId: string, matchId: string, policyId: string) {
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

    const rawToken = crypto.randomUUID();
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

        if (perkFlag && q.user_id) {
          if (!(await hasExistingPerk(q.user_id))) {
            const match = await findNearestUpcomingMatch();
            if (match && (await grantPerkTicketNew(q.user_id, match.id, pol.id))) {
              perkTickets++;
            }
          }
        }
      } else {
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

  console.log("[edge:issue-policy] complete", { inspected, issued, perkTickets, errors: errors.length });
  return json(
    {
      ok: true,
      inspected,
      issued,
      perkTickets,
      errors: errors.length ? errors : undefined,
    },
    { status: 200 },
  );
});
