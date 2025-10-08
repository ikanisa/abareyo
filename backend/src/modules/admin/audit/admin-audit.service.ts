import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';

import { PrismaService } from '../../../prisma/prisma.service.js';

export type AuditRecordInput = {
  adminUserId: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  before?: Prisma.JsonValue | null;
  after?: Prisma.JsonValue | null;
  ip?: string | null;
  userAgent?: string | null;
};

@Injectable()
export class AdminAuditService {
  constructor(private readonly prisma: PrismaService) {}

  async record(input: AuditRecordInput) {
    await this.prisma.auditLog.create({
      data: {
        adminUserId: input.adminUserId,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId ?? null,
        before: input.before ?? null,
        after: input.after ?? null,
        ip: input.ip ?? null,
        userAgent: input.userAgent ?? null,
      },
    });
  }
}
