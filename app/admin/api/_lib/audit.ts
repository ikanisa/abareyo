import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database, TablesInsert } from '@/integrations/supabase/types';

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
  payload: AuditLogPayload,
): Promise<void> {
  try {
    const row: TablesInsert<'audit_logs'> = {
      action: payload.action,
      entity_type: payload.entityType ?? null,
      entity_id: payload.entityId ?? null,
      before: (payload.before as TablesInsert<'audit_logs'>['before']) ?? null,
      after: (payload.after as TablesInsert<'audit_logs'>['after']) ?? null,
      admin_user_id: payload.userId,
      ip: payload.ip ?? null,
      ua: payload.userAgent ?? null,
    };

    await supabase.from('audit_logs').insert(row);
  } catch (error) {
    console.warn('Failed to write admin audit log', error);
  }
}
