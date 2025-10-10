import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../../prisma/prisma.service.js';
import { AdminAuditService } from '../audit/admin-audit.service.js';

type AdminFeatureFlag = {
  key: string;
  enabled: boolean;
  description: string | null;
  updatedAt: string;
  updatedBy: { id: string; displayName: string; email?: string | null } | null;
};

const serialise = (value: unknown) =>
  JSON.parse(
    JSON.stringify(value, (_key, val) => (val instanceof Date ? val.toISOString() : val)),
  );

@Injectable()
export class AdminFeatureFlagsService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AdminAuditService) {}

  async list(): Promise<AdminFeatureFlag[]> {
    const flags = await this.prisma.featureFlag.findMany({
      orderBy: { updatedAt: 'desc' },
      include: { updatedBy: { select: { id: true, displayName: true, email: true } } },
    });
    return flags.map((f) => ({
      key: f.key,
      enabled: Boolean((f.value as Prisma.JsonObject)?.enabled ?? false),
      description: f.description ?? null,
      updatedAt: f.updatedAt.toISOString(),
      updatedBy: f.updatedBy ? { id: f.updatedBy.id, displayName: f.updatedBy.displayName, email: f.updatedBy.email } : null,
    }));
  }

  async upsert(payload: { key: string; enabled: boolean; description?: string }, adminUserId: string | null) {
    const existing = await this.prisma.featureFlag.findUnique({
      where: { key: payload.key },
      include: { updatedBy: { select: { id: true, displayName: true, email: true } } },
    });

    const next = await this.prisma.featureFlag.upsert({
      where: { key: payload.key },
      update: {
        value: { enabled: payload.enabled },
        description: payload.description ?? null,
        updatedById: adminUserId,
      },
      create: {
        key: payload.key,
        value: { enabled: payload.enabled },
        description: payload.description ?? null,
        updatedById: adminUserId,
      },
      include: { updatedBy: { select: { id: true, displayName: true, email: true } } },
    });

    await this.audit.record({
      adminUserId,
      action: 'featureflag.upsert',
      entityType: 'feature_flag',
      entityId: payload.key,
      before: existing ? serialise(existing) : null,
      after: serialise(next),
    });

    return {
      key: next.key,
      enabled: Boolean((next.value as Prisma.JsonObject)?.enabled ?? false),
      description: next.description ?? null,
      updatedAt: next.updatedAt.toISOString(),
      updatedBy: next.updatedBy
        ? { id: next.updatedBy.id, displayName: next.updatedBy.displayName, email: next.updatedBy.email }
        : null,
    } satisfies AdminFeatureFlag;
  }
}

