import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { z } from "zod";

import { recordAuditEvent } from "@/audit/server";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/supabase/env";

const auditSchema = z.object({
  resource: z.string(),
  action: z.string(),
  entityId: z.string(),
  metadata: z.record(z.any()).optional(),
});

export const POST = async (request: Request) => {
  const payload = await request.json().catch(() => null);
  const parse = auditSchema.safeParse(payload);
  if (!parse.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const supabaseUrl = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();
  if (!supabaseUrl || !anonKey) {
    return NextResponse.json({ error: "Supabase credentials missing" }, { status: 503 });
  }

  const cookieStore = cookies();
  const headerStore = headers();
  const routeClient = createRouteHandlerClient({
    cookies: () => cookieStore,
    headers: () => headerStore,
    supabaseUrl,
    supabaseKey: anonKey,
  });

  const {
    data: { session },
  } = await routeClient.auth.getSession();

  await recordAuditEvent({
    ...parse.data,
    actorId: session?.user.id,
    actorEmail: session?.user.email ?? undefined,
  });

  return NextResponse.json({ ok: true });
};
