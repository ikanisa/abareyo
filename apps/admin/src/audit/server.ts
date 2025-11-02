import { getServiceRoleClient } from "@/supabase/service-role";

import type { AuditEvent } from "./types";

export const recordAuditEvent = async (event: AuditEvent) => {
  const client = getServiceRoleClient();
  if (!client) {
    console.warn("[audit] Supabase service role unavailable; event logged to console only", event);
    return { ok: false, reason: "Supabase unavailable" } as const;
  }

  const payload = {
    resource: event.resource,
    action: event.action,
    entity_id: event.entityId,
    metadata: event.metadata ?? {},
    actor_id: event.actorId ?? null,
    actor_email: event.actorEmail ?? null,
  };

  const { error } = await client.from("audit_logs").insert(payload);
  if (error) {
    console.error("[audit] failed to persist audit event", error, event);
    return { ok: false, reason: error.message } as const;
  }
  return { ok: true } as const;
};
