import { NextResponse } from "next/server";

import {
  tryGetSupabaseServerAnonClient,
  tryGetSupabaseServiceRoleClient,
} from "@/lib/db";
import { createRedisClient } from "@/lib/server/redis-client";

type CheckStatus =
  | { status: "ok"; latencyMs: number }
  | { status: "skipped"; reason: string }
  | { status: "error"; error: string };

const checkSupabase = async (): Promise<CheckStatus> => {
  const client = tryGetSupabaseServiceRoleClient() ?? tryGetSupabaseServerAnonClient();
  if (!client) {
    return { status: "skipped", reason: "not_configured" };
  }

  const startedAt = Date.now();
  try {
    const { error } = await client
      .from("feature_flags")
      .select("key", { head: true, limit: 1 })
      .throwOnError();
    if (error) {
      throw error;
    }
    return { status: "ok", latencyMs: Date.now() - startedAt };
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown_error";
    return { status: "error", error: message };
  }
};

const checkRedis = async (): Promise<CheckStatus> => {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    return { status: "skipped", reason: "not_configured" };
  }

  const client = createRedisClient(redisUrl);
  if (!client) {
    return { status: "error", error: "client_initialisation_failed" };
  }

  const startedAt = Date.now();
  try {
    await client.sendCommand("PING");
    await client.quit();
    return { status: "ok", latencyMs: Date.now() - startedAt };
  } catch (error) {
    await client.quit().catch(() => undefined);
    const message = error instanceof Error ? error.message : "unknown_error";
    return { status: "error", error: message };
  }
};

export async function GET() {
  const [supabase, redis] = await Promise.all([checkSupabase(), checkRedis()]);
  const ok = supabase.status === "ok" && redis.status === "ok";

  return NextResponse.json({
    ok,
    name: "gikundiro",
    time: new Date().toISOString(),
    checks: {
      supabase,
      redis,
    },
  });
}
