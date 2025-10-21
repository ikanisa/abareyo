import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { serverEnv } from "@/config/env";

const ADMIN_COOKIE_NAME = serverEnv.NEXT_PUBLIC_ADMIN_SESSION_COOKIE ?? "admin_session";
const BACKEND_BASE = serverEnv.NEXT_PUBLIC_BACKEND_URL;
const FALLBACK_BACKEND = "/api";

export async function redirectIfAuthenticated(destination = "/staff") {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get(ADMIN_COOKIE_NAME);
  if (!sessionCookie) {
    return;
  }

  const backendBase = BACKEND_BASE && BACKEND_BASE.trim().length > 0 ? BACKEND_BASE : FALLBACK_BACKEND;
  try {
    const response = await fetch(`${backendBase}/admin/me`, {
      headers: { cookie: cookieStore.toString() },
      cache: "no-store",
    });
    if (response.ok) {
      redirect(destination);
    }
  } catch (error) {
    if (serverEnv.NODE_ENV !== "production") {
      console.warn("redirectIfAuthenticated check failed", error);
    }
  }
}
