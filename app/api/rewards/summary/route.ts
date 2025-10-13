import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

// NOTE: For MVP we use the "first" user (or you can pass ?user_id=...).
// Replace with real auth in production.
async function getDefaultUser(db: SupabaseClient) {
  const { data, error } = await db.from("users").select("*").order("created_at").limit(1);
  if (error || !data?.length) return null;
  return data[0];
}

export async function GET(req: Request) {
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json({ error: "supabase_config_missing" }, { status: 500 });
  }

  const db = createClient(supabaseUrl, supabaseAnonKey);
  const url = new URL(req.url);
  const userId = url.searchParams.get("user_id");
  let user = null;

  if (userId) {
    const { data, error } = await db.from("users").select("*").eq("id", userId).single();
    user = error ? null : data ?? null;
  } else {
    user = await getDefaultUser(db);
  }
  if (!user) return NextResponse.json({ error: "no_user" }, { status: 404 });

  // latest perk: check free ticket perk or last rewards event
  const { data: freeTickets } = await db
    .from("tickets")
    .select("id, match_id, created_at, price, momo_ref")
    .eq("user_id", user.id)
    .eq("price", 0)
    .eq("momo_ref", "FREE-TICKET-PERK")
    .order("created_at", { ascending: false })
    .limit(1);

  const freeTicket = freeTickets?.[0] ?? null;

  const { data: events } = await db
    .from("rewards_events")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1);

  const latestEvent = events?.[0] ?? null;

  return NextResponse.json({
    user: { id: user.id, name: user.name, tier: user.tier, points: user.points ?? 0 },
    latestPerk: freeTicket
      ? { type: "free_ticket", ticket_id: freeTicket.id, label: "Free BLUE ticket available" }
      : latestEvent
      ? { type: "points", points: latestEvent.points, label: `+${latestEvent.points} pts` }
      : null,
  });
}
