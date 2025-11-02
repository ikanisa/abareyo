export type AuditEvent = {
  resource: string;
  action: string;
  entityId: string;
  metadata?: Record<string, unknown>;
  actorId?: string;
  actorEmail?: string;
};
