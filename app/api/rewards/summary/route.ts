import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function getAccessToken(req: Request) {
  const authorization = req.headers.get("authorization") ?? "";
  const bearerMatch = authorization.match(/^Bearer\s+(.+)$/i);
  if (bearerMatch?.[1]) {
    return bearerMatch[1].trim();
  }

  const cookieHeader = req.headers.get("cookie") ?? "";
  if (!cookieHeader) return null;

  const cookieNames = ["sb-access-token", "sb:token", "supabase-access-token"] as const;
  for (const part of cookieHeader.split(";")) {
    const [rawName, ...rawValue] = part.trim().split("=");
    if (!rawName || rawValue.length === 0) continue;
    if (cookieNames.includes(rawName as (typeof cookieNames)[number])) {
      return decodeURIComponent(rawValue.join("="));
    }
  }

  return null;
}

export async function GET(req: Request) {
  if (!supabaseUrl || (!supabaseAnonKey && !supabaseServiceRoleKey)) {
    return NextResponse.json({ error: "supabase_config_missing" }, { status: 500 });
  }

  const accessToken = getAccessToken(req);
  if (!accessToken) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabaseKey = supabaseServiceRoleKey ?? supabaseAnonKey;
  const authClient = createClient(supabaseUrl, supabaseKey);

  const {
    data: authData,
    error: authError,
  } = await authClient.auth.getUser(accessToken);
  if (authError || !authData?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const userId = authData.user.id;

  const db = createClient(supabaseUrl, supabaseKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });

  const { data: user, error: userError } = await db
    .from("users")
    .select("id, name, tier, points")
    .eq("id", userId)
    .maybeSingle();

  if (userError) {
    return NextResponse.json({ error: "user_lookup_failed" }, { status: 500 });
  }
  if (!user) {
    return NextResponse.json({ error: "no_user" }, { status: 404 });
  }

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
