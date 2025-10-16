import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

import { ff } from "@/lib/flags";

const supabase = () =>
  createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY!, {
    auth: { persistSession: false },
  });

type PostPayload = {
  user_id?: string;
  user?: {
    name?: string;
    phone?: string;
    momo_number?: string;
    avatar_url?: string | null;
  };
  text: string;
  media_url?: string | null;
};

type FanPostRecord = {
  id: string;
  text: string | null;
  media_url: string | null;
  likes: number | null;
  comments: number | null;
  created_at: string;
  user: {
    id: string;
    name: string | null;
    phone: string | null;
    avatar_url: string | null;
  } | null;
};

async function resolveUserId(db: ReturnType<typeof supabase>, payload: PostPayload) {
  if (payload.user_id) return payload.user_id;
  const rawPhone = payload.user?.phone?.replace(/\s+/g, "");
  if (!rawPhone) return null;
  const { data: existing } = await db
    .from("users")
    .select("id, avatar_url")
    .eq("phone", rawPhone)
    .maybeSingle();
  if (existing?.id) {
    if (payload.user?.avatar_url && !existing.avatar_url) {
      await db.from("users").update({ avatar_url: payload.user.avatar_url }).eq("id", existing.id);
    }
    return existing.id;
  }
  const { data: created, error } = await db
    .from("users")
    .insert({
      phone: rawPhone,
      name: payload.user?.name ?? null,
      momo_number: payload.user?.momo_number ?? rawPhone,
      avatar_url: payload.user?.avatar_url ?? null,
    })
    .select("id")
    .single();
  if (error) throw error;
  return created.id;
}

function formatResponse(records: FanPostRecord[], wantsObject: boolean) {
  return wantsObject ? { posts: records } : records;
}

export async function GET(req: Request) {
  const wantsObject = new URL(req.url).searchParams.get("format") === "object";

  if (!ff("community.light", false)) {
    const sample: FanPostRecord[] = [
      {
        id: "p1",
        text: "Allez Gikundiro!",
        media_url: null,
        likes: 0,
        comments: 0,
        created_at: new Date().toISOString(),
        user: { id: "fan-1", name: "Fan", phone: null, avatar_url: null },
      },
    ];
    return NextResponse.json(formatResponse(sample, wantsObject));
  }

  const db = supabase();
  const { data, error } = await db
    .from("fan_posts")
    .select("*, user:users(id, name, phone, avatar_url)")
    .order("created_at", { ascending: false })
    .limit(40);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(formatResponse((data ?? []) as FanPostRecord[], wantsObject));
}

export async function POST(req: Request) {
  if (!ff("community.light", false)) {
    return NextResponse.json({ error: "community_disabled" }, { status: 503 });
  }

  const db = supabase();
  const payload = (await req.json()) as PostPayload;
  if (!payload.text || !payload.text.trim()) {
    return NextResponse.json({ error: "Post text is required" }, { status: 400 });
  }
  try {
    const userId = await resolveUserId(db, payload);
    const { data, error } = await db
      .from("fan_posts")
      .insert({
        user_id: userId,
        text: payload.text.trim().slice(0, 500),
        media_url: payload.media_url ?? null,
      })
      .select("*, user:users(id, name, phone, avatar_url)")
      .single();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, post: data as FanPostRecord });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
