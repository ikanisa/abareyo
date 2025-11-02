import { NextResponse } from "next/server";
import { z } from "zod";

import { recordAuditEvent } from "@/audit/server";
import { assertApiAccess } from "@/auth/api-guard";
import { getServiceRoleClient } from "@/supabase/service-role";

const schema = z.object({
  status: z.enum(["pending", "paid", "fulfilled", "refunded"]),
  fulfilled_at: z.string().datetime().nullable().optional(),
});

export const PATCH = async (request: Request, { params }: { params: { id: string } }) => {
  let session;
  try {
    ({ session } = await assertApiAccess(["admin", "commerce", "analyst"]));
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
    .from("shop_orders")
    .update({ status: parse.data.status, fulfilled_at: parse.data.fulfilled_at ?? null })
    .eq("id", params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await recordAuditEvent({
    resource: "shop_orders",
    action: "update_status",
    entityId: params.id,
    metadata: parse.data,
    actorId: session.user.id,
    actorEmail: session.user.email ?? undefined,
  });

  return NextResponse.json({ ok: true });
};
