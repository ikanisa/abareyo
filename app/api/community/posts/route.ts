import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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

export async function GET() {
  const db = supabase();
  const { data, error } = await db
    .from("fan_posts")
    .select("*, user:users(id, name, phone, avatar_url)")
    .order("created_at", { ascending: false })
    .limit(40);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json((data ?? []) as FanPostRecord[]);
}

export async function POST(req: Request) {
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
