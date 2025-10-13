import { NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/integrations/supabase/types";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/** Extract an access token from Authorization header or Supabase cookies */
function getAccessToken(req: Request) {
  const authorization = req.headers.get("authorization") ?? "";
  const bearerMatch = authorization.match(/^Bearer\s+(.+)$/i);
  if (bearerMatch?.[1]) return bearerMatch[1].trim();

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

// ---- Extended typing to include rewards_events ----
type RewardsEventRow = {
  id: string;
  user_id: string;
  points: number;
  created_at: string;
};

type ExtendedDatabase = Database & {
  public: Omit<Database["public"], "Tables"> & {
    Tables: Database["public"]["Tables"] & {
      rewards_events: {
        Row: RewardsEventRow;
        Insert: Partial<RewardsEventRow>;
        Update: Partial<RewardsEventRow>;
        Relationships: [];
      };
    };
  };
};

type UserRow = ExtendedDatabase["public"]["Tables"]["users"]["Row"];

async function getDefaultUser(db: SupabaseClient<ExtendedDatabase>) {
  const { data, error } = await db.from("users").select("*").order("created_at").limit(1);
  if (error || !data?.length) return null;
  return data[0];
}

export async function GET(req: Request) {
  if (!supabaseUrl || (!supabaseAnonKey && !supabaseServiceRoleKey)) {
    return NextResponse.json({ error: "supabase_config_missing" }, { status: 500 });
  }

  const url = new URL(req.url);
  const queryUserId = url.searchParams.get("user_id");
  const accessToken = getAccessToken(req);

  // If we have a user access token, authenticate and scope queries with it (RLS path).
  if (accessToken) {
    const authClient = createClient<ExtendedDatabase>(
      supabaseUrl,
      // anon key is fine for auth.getUser; fall back to service role if anon isn't set
      supabaseAnonKey ?? supabaseServiceRoleKey!
    );

    const { data: authData, error: authError } = await authClient.auth.getUser(accessToken);
    if (authError || !authData?.user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const userId = authData.user.id;

    const db = createClient<ExtendedDatabase>(supabaseUrl, supabaseAnonKey ?? supabaseServiceRoleKey!, {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
      auth: { persistSession: false },
    });

    const { data: user, error: userError } = await db
      .from("users")
      .select("id, name, tier, points")
      .eq("id", userId)
      .maybeSingle();

    if (userError) return NextResponse.json({ error: "user_lookup_failed" }, { status: 500 });
    if (!user) return NextResponse.json({ error: "no_user" }, { status: 404 });

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

  // ---- MVP fallback path (no access token): use ?user_id or first user (requires service role or RLS-open policy) ----
  const keyForFallback = supabaseServiceRoleKey ?? supabaseAnonKey!;
  const db = createClient<ExtendedDatabase>(supabaseUrl, keyForFallback, { auth: { persistSession: false } });

  let user: Pick<UserRow, "id" | "name" | "tier" | "points"> | null = null;

  if (queryUserId) {
    const { data, error } = await db
      .from("users")
      .select("id, name, tier, points")
      .eq("id", queryUserId)
      .maybeSingle();
    if (error) return NextResponse.json({ error: "user_lookup_failed" }, { status: 500 });
    if (!data) return NextResponse.json({ error: "no_user" }, { status: 404 });
    user = data;
  } else {
    const first = await getDefaultUser(db);
    if (!first) return NextResponse.json({ error: "no_user" }, { status: 404 });

    user = {
      id: first.id,
      name: first.name,
      tier: first.tier,
      points: first.points ?? 0,
    };
  }

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
