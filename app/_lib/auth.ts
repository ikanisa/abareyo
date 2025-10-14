import type { NextRequest } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { errorResponse } from "./responses";

function readAccessToken(req: NextRequest): string | null {
  const authz = req.headers.get("authorization") || "";
  const m = authz.match(/^Bearer\s+(.+)$/i);
  if (m?.[1]) return m[1].trim();
  const cookie = req.headers.get("cookie") || "";
  for (const part of cookie.split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (!k || rest.length === 0) continue;
    const value = decodeURIComponent(rest.join("="));
    if (["sb-access-token", "sb:token", "supabase-access-token"].includes(k)) {
      return value;
    }
    if (k === "supabase-auth-token") {
      try {
        const parsed = JSON.parse(value);
        const access = parsed?.currentSession?.access_token;
        if (typeof access === "string" && access) return access;
      } catch {
        // ignore parse errors
      }
    }
  }
  return null;
}

export async function requireAuthUser(
  req: NextRequest,
  supabase: SupabaseClient | null,
) {
  if (!supabase) {
    return { response: errorResponse("unauthorized", 401) } as const;
  }
  const token = readAccessToken(req);
  if (!token) return { response: errorResponse("unauthorized", 401) };
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return { response: errorResponse("unauthorized", 401) };
  return { user: data.user };
}
