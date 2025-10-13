import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const db = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

export async function POST(req: Request) {
  try {
    const payload = await req.json().catch(() => null);
    const policyId = payload?.policy_id as string | undefined;

    if (!policyId) {
      return NextResponse.json({ error: "policy_id_required" }, { status: 400 });
    }

    // Get policy + quote
    const { data: pol, error: ep } = await db
      .from("policies")
      .select("id, insurance_quotes!inner(user_id, premium, ticket_perk)")
      .eq("id", policyId)
      .maybeSingle<{
        id: string;
        insurance_quotes: { user_id: string | null; premium: number | null; ticket_perk: boolean | null };
      }>();
    if (ep || !pol) {
      return NextResponse.json({ error: "policy_not_found" }, { status: 404 });
    }

    const quote = pol.insurance_quotes;
    if (!quote?.ticket_perk) {
      return NextResponse.json({ error: "not_eligible" }, { status: 400 });
    }

    if (!quote.user_id) {
      return NextResponse.json({ error: "missing_user" }, { status: 400 });
    }

    // Already issued auto-perk ticket? Bail gracefully.
    const { data: existing, error: existingError } = await db
      .from("ticket_orders")
      .select("id")
      .eq("user_id", quote.user_id)
      .eq("sms_ref", "FREE-TICKET-PERK")
      .limit(1);
    if (existingError) {
      return NextResponse.json({ error: "ticket_lookup_failed" }, { status: 500 });
    }
    if (existing && existing.length) {
      return NextResponse.json({ ok: true, already: true });
    }

    // Pick nearest upcoming match
    const { data: m, error: matchError } = await db
      .from("matches")
      .select("id")
      .gte("kickoff", new Date().toISOString())
      .order("kickoff", { ascending: true })
      .limit(1);
    if (matchError) {
      return NextResponse.json({ error: "match_lookup_failed" }, { status: 500 });
    }
    const match = m?.[0];
    if (!match) {
      return NextResponse.json({ error: "no_upcoming_match" }, { status: 400 });
    }

    // Create free BLUE ticket
    const { data: order, error: orderError } = await db
      .from("ticket_orders")
      .insert({
        user_id: quote.user_id,
        match_id: match.id,
        total: 0,
        status: "paid",
        sms_ref: "FREE-TICKET-PERK",
      })
      .select("id")
      .single();
    if (orderError || !order) {
      return NextResponse.json({ error: "ticket_order_failed" }, { status: 500 });
    }

    const { data: pass, error: passError } = await db
      .from("ticket_passes")
      .insert({
        order_id: order.id,
        zone: "Blue",
        gate: "G3",
      })
      .select("id")
      .single();
    if (passError || !pass) {
      return NextResponse.json({ error: "ticket_pass_failed" }, { status: 500 });
    }

    await db.from("rewards_events").insert({
      user_id: quote.user_id,
      source: "policy_perk",
      ref_id: pol.id,
      points: 0,
      meta: { perk: "free_blue_ticket_manual", match_id: match.id, order_id: order.id, pass_id: pass.id },
    });

    return NextResponse.json({ ok: true, match_id: match.id, ticket_id: pass.id });
  } catch (error) {
    console.error("claim_ticket_failed", error);
    return NextResponse.json({ error: "unexpected_error" }, { status: 500 });
  }
}
