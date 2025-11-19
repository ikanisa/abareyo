import { getServiceRoleClient } from "./client.ts";

export type AuditPayload = {
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  before?: unknown;
  after?: unknown;
  context?: Record<string, unknown> | null;
  ip?: string | null;
  ua?: string | null;
  adminUserId?: string | null;
};

export const extractRequestMeta = (req: Request) => ({
  ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
  ua: req.headers.get("user-agent") ?? null,
});

export async function writeAuditLog(payload: AuditPayload) {
  const supabase = getServiceRoleClient();
  try {
    await supabase.from("audit_logs").insert({
      action: payload.action,
      entity_type: payload.entityType ?? null,
      entity_id: payload.entityId ?? null,
      before: payload.before ?? null,
      after: payload.after ?? null,
      context: payload.context ?? null,
      ip: payload.ip ?? null,
      ua: payload.ua ?? null,
      admin_user_id: payload.adminUserId ?? null,
    });
    return true;
  } catch (error) {
    console.warn("[edge:audit] write_failed", { error });
    return false;
  }
}
