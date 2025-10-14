import type { TablesInsert } from '@/integrations/supabase/types';

import { getServiceClient } from './db';

export type AuditInput = {
  adminId: string;
  action: string;
  entityType?: string;
  entityId?: string;
  before?: unknown;
  after?: unknown;
  request?: Request;
  context?: unknown;
};

const extractRequestMeta = (req?: Request) => {
  if (!req) return { ip: null, ua: null };
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;
  const ua = req.headers.get('user-agent');
  return { ip, ua };
};

const toJson = (value: unknown) => {
  if (value === undefined || value === null) return null;
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return null;
  }
};

export const writeAuditLog = async ({
  adminId,
  action,
  entityType,
  entityId,
  before,
  after,
  request,
  context,
}: AuditInput) => {
  try {
    const client = getServiceClient();
    const meta = extractRequestMeta(request);
    const payload: TablesInsert<'audit_logs'> = {
      admin_user_id: adminId,
      action,
      entity_type: entityType ?? null,
      entity_id: entityId ?? null,
      before: toJson(before),
      after: toJson(after),
      ip: meta.ip,
      ua: meta.ua ?? null,
      context: toJson(context),
    };
    await client.from('audit_logs').insert(payload);
  } catch (error) {
    console.error('failed to write audit log', error);
  }
};
