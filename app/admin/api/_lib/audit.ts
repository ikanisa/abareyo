import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@/src/integrations/supabase/types';

export type AuditLogPayload = {
  action: string;
  entityType: string;
  entityId: string;
  userId: string;
  before?: unknown;
  after?: unknown;
  ip?: string | null;
  userAgent?: string | null;
};

export async function recordAudit(
  supabase: SupabaseClient<Database>,
  payload: AuditLogPayload,
): Promise<void> {
  try {
    await supabase.from('audit_logs').insert({
      action: payload.action,
      entity_type: payload.entityType,
      entity_id: payload.entityId,
      before: payload.before ?? null,
      after: payload.after ?? null,
      admin_user_id: payload.userId,
      ip: payload.ip ?? null,
      ua: payload.userAgent ?? null,
    });
  } catch (error) {
    console.warn('Failed to write admin audit log', error);
  }
}
