import { NextResponse } from "next/server";
import { z } from "zod";

import { recordAuditEvent } from "@/audit/server";
import { assertApiAccess } from "@/auth/api-guard";
import { getServiceRoleClient } from "@/supabase/service-role";

const schema = z.object({
  flagged: z.boolean().optional(),
  sentiment: z.enum(["positive", "neutral", "negative"]).optional(),
});

export const PATCH = async (request: Request, { params }: { params: { id: string } }) => {
  let session;
  try {
    ({ session } = await assertApiAccess(["admin", "community", "analyst"]));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unauthorized";
    return NextResponse.json({ error: message }, { status: message === "Forbidden" ? 403 : 401 });
  }

  const input = await request.json().catch(() => null);
  const parse = schema.safeParse(input);
  if (!parse.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const client = getServiceRoleClient();
  if (!client) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  const { error } = await client
    .from("community_posts")
    .update(parse.data)
    .eq("id", params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await recordAuditEvent({
    resource: "community_posts",
    action: "moderate",
    entityId: params.id,
    metadata: parse.data,
    actorId: session.user.id,
    actorEmail: session.user.email ?? undefined,
  });

  return NextResponse.json({ ok: true });
};
