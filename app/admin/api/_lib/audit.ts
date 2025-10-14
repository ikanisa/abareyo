import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, TablesInsert } from "@/integrations/supabase/types";

export type AuditLogPayload = {
  action: string;
  entityType: string;
  entityId: string;
  userId: string;
  before?: unknown;
  after?: unknown;
  ip?: string | null;
  userAgent?: string | null;
  context?: Record<string, unknown> | null;
};

export async function recordAudit(
  supabase: SupabaseClient<Database>,
  payload: AuditLogPayload
): Promise<void> {
  try {
    // Ensure JSON-serializable copies (avoid circular refs / class instances).
    const before =
      payload.before !== undefined && payload.before !== null
        ? (JSON.parse(JSON.stringify(payload.before)) as TablesInsert<"audit_logs">["before"])
        : null;

    const after =
      payload.after !== undefined && payload.after !== null
        ? (JSON.parse(JSON.stringify(payload.after)) as TablesInsert<"audit_logs">["after"])
        : null;

    const context =
      payload.context !== undefined && payload.context !== null
        ? (JSON.parse(JSON.stringify(payload.context)) as TablesInsert<"audit_logs">["before"])
        : null;

    // Base row matches generated Supabase types.
    const baseRow: TablesInsert<"audit_logs"> = {
      action: payload.action,
      entity_type: payload.entityType ?? null,
      entity_id: payload.entityId ?? null,
      before,
      after,
      admin_user_id: payload.userId,
      ip: payload.ip ?? null,
      ua: payload.userAgent ?? null,
    };

    // If your table has a `context` JSONB column, include it. The intersection type
    // avoids TS errors even if the generated types don’t declare `context`.
    const row: TablesInsert<"audit_logs"> & {
      context?: TablesInsert<"audit_logs">["before"];
    } = context !== null ? { ...baseRow, context } : baseRow;

    await supabase.from("audit_logs").insert(row as TablesInsert<"audit_logs">);
  } catch (error) {
    console.warn("Failed to write admin audit log", error);
  }
}
