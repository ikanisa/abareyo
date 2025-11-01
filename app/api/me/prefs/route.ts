import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { getSupabase } from "@/app/_lib/supabase";

const DEFAULT_PREFS = {
  language: "rw",
  notifications: { goals: true, kickoff: true, final: true, club: true, expoPushToken: null as string | null },
};

const PREF_COOKIE = "gikundiro:notification-prefs";
const MEMBER_COOKIE = "gikundiro:member-id";

const memoryPrefs = new Map<string, typeof DEFAULT_PREFS>();

const parseJson = <T>(value: string | undefined): T | null => {
  if (!value) return null;
  try {
    return JSON.parse(decodeURIComponent(value)) as T;
  } catch (error) {
    console.warn("Unable to parse preference cookie", error);
    return null;
  }
};

const serializePrefs = (prefs: typeof DEFAULT_PREFS) => encodeURIComponent(JSON.stringify(prefs));

const resolveUserId = (req: NextRequest, cookieStore: ReturnType<typeof cookies>): string | null => {
  const headerId = req.headers.get("x-client-id") ?? req.headers.get("x-user-id");
  const cookieId = cookieStore.get(MEMBER_COOKIE)?.value;
  return headerId ?? cookieId ?? null;
};

const mergeNotifications = (
  input: Partial<(typeof DEFAULT_PREFS)["notifications"]> | null | undefined,
): (typeof DEFAULT_PREFS)["notifications"] => ({
  ...DEFAULT_PREFS.notifications,
  ...(input ?? {}),
});

export async function GET(req: NextRequest) {
  const cookieStore = cookies();
  const supabase = getSupabase();
  const userId = resolveUserId(req, cookieStore);

  if (!userId) {
    const fallback = parseJson<typeof DEFAULT_PREFS>(cookieStore.get(PREF_COOKIE)?.value);
    return NextResponse.json({ prefs: fallback ?? DEFAULT_PREFS });
  }

  if (!supabase) {
    const cached = memoryPrefs.get(userId);
    if (cached) {
      return NextResponse.json({ prefs: cached });
    }
    const fallback = parseJson<typeof DEFAULT_PREFS>(cookieStore.get(PREF_COOKIE)?.value);
    return NextResponse.json({ prefs: fallback ?? DEFAULT_PREFS });
  }

  const { data, error } = await supabase
    .from("user_prefs" as never)
    .select("language, notifications")
    .eq("user_id", userId)
    .maybeSingle<{ language: string | null; notifications: Record<string, unknown> | null }>();

  if (error) {
    console.error("Failed to load notification prefs", error);
    return NextResponse.json({ prefs: DEFAULT_PREFS }, { status: 500 });
  }

  const prefs = {
    language: data?.language ?? DEFAULT_PREFS.language,
    notifications: mergeNotifications((data?.notifications as typeof DEFAULT_PREFS.notifications | null) ?? null),
  };

  cookieStore.set({
    name: PREF_COOKIE,
    value: serializePrefs(prefs),
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });

  return NextResponse.json({ prefs });
}

export async function POST(req: NextRequest) {
  const cookieStore = cookies();
  const supabase = getSupabase();
  const userId = resolveUserId(req, cookieStore);

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as Partial<typeof DEFAULT_PREFS> | null;
  if (!body) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const prefs = {
    language: body.language ?? DEFAULT_PREFS.language,
    notifications: mergeNotifications(body.notifications),
  };

  if (!supabase) {
    memoryPrefs.set(userId, prefs);
    cookieStore.set({
      name: PREF_COOKIE,
      value: serializePrefs(prefs),
      httpOnly: false,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });
    return NextResponse.json({ ok: true, offline: true });
  }

  const { error } = await supabase
    .from("user_prefs" as never)
    .upsert({
      user_id: userId,
      language: prefs.language,
      notifications: prefs.notifications,
    } as never);

  if (error) {
    console.error("Failed to persist notification prefs", error);
    return NextResponse.json({ error: "failed_to_save_prefs" }, { status: 500 });
  }

  cookieStore.set({
    name: PREF_COOKIE,
    value: serializePrefs(prefs),
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });

  return NextResponse.json({ ok: true });
}
