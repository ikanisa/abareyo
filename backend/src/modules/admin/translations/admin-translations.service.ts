import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../../prisma/prisma.service.js';
import { AdminAuditService } from '../audit/admin-audit.service.js';

type AdminTranslation = {
  lang: string;
  key: string;
  value: string;
  updatedAt: string;
  updatedBy: { id: string; displayName: string; email: string | null } | null;
};

const serialise = (value: unknown) =>
  JSON.parse(
    JSON.stringify(value, (_key, val) => (val instanceof Date ? val.toISOString() : val)),
  );

@Injectable()
export class AdminTranslationsService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AdminAuditService) {}

  async list(params: { lang?: string; page?: number; pageSize?: number; search?: string }) {
    const page = Math.max(params.page ?? 1, 1);
    const pageSize = Math.min(Math.max(params.pageSize ?? 50, 1), 200);

    const where: Prisma.TranslationWhereInput = {};
    if (params.lang) where.lang = params.lang;
    if (params.search) {
      const term = params.search.trim();
      where.OR = [{ key: { contains: term, mode: 'insensitive' } }, { value: { contains: term, mode: 'insensitive' } }];
    }

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.translation.count({ where }),
      this.prisma.translation.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { updatedBy: { select: { id: true, displayName: true, email: true } } },
      }),
    ]);

    return {
      meta: { page, pageSize, total },
      data: rows.map((t) => ({
        lang: t.lang,
        key: t.key,
        value: t.value,
        updatedAt: t.updatedAt.toISOString(),
        updatedBy: t.updatedBy ? { id: t.updatedBy.id, displayName: t.updatedBy.displayName, email: t.updatedBy.email } : null,
      } satisfies AdminTranslation)),
    };
  }

  async languages() {
    const langs = await this.prisma.translation.findMany({ distinct: ['lang'], select: { lang: true }, orderBy: { lang: 'asc' } });
    return langs.map((l) => l.lang);
  }

  async upsert(payload: { lang: string; key: string; value: string }, adminUserId: string | null) {
    const existing = await this.prisma.translation.findUnique({ where: { lang_key: { lang: payload.lang, key: payload.key } } });
    const next = await this.prisma.translation.upsert({
      where: { lang_key: { lang: payload.lang, key: payload.key } },
      update: { value: payload.value, updatedById: adminUserId },
      create: { lang: payload.lang, key: payload.key, value: payload.value, updatedById: adminUserId },
      include: { updatedBy: { select: { id: true, displayName: true, email: true } } },
    });

    await this.audit.record({
      adminUserId,
      action: 'translation.upsert',
      entityType: 'translation',
      entityId: `${payload.lang}:${payload.key}`,
      before: existing ? serialise(existing) : null,
      after: serialise(next),
    });

    return {
      lang: next.lang,
      key: next.key,
      value: next.value,
      updatedAt: next.updatedAt.toISOString(),
      updatedBy: next.updatedBy ? { id: next.updatedBy.id, displayName: next.updatedBy.displayName, email: next.updatedBy.email } : null,
    } satisfies AdminTranslation;
  }

  async remove(lang: string, key: string, adminUserId: string | null) {
    const existing = await this.prisma.translation.findUnique({ where: { lang_key: { lang, key } } });
    if (!existing) throw new NotFoundException('Translation not found');
    await this.prisma.translation.delete({ where: { lang_key: { lang, key } } });
    await this.audit.record({
      adminUserId,
      action: 'translation.delete',
      entityType: 'translation',
      entityId: `${lang}:${key}`,
      before: serialise(existing),
      after: null,
    });
  }

  async export(lang: string) {
    const rows = await this.prisma.translation.findMany({ where: { lang }, orderBy: { key: 'asc' } });
    return rows.map((t) => ({ key: t.key, value: t.value, updatedAt: t.updatedAt.toISOString() }));
  }

  async import(lang: string, entries: Array<{ key: string; value: string }>, mode: 'preview' | 'apply', adminUserId: string | null) {
    const existing = await this.prisma.translation.findMany({ where: { lang } });
    const map = new Map(existing.map((t) => [t.key, t] as const));
    const created: Array<{ key: string; value: string }> = [];
    const updated: Array<{ key: string; value: string; previousValue: string }> = [];
    const unchanged: Array<{ key: string; value: string }> = [];

    for (const e of entries) {
      const curr = map.get(e.key);
      if (!curr) created.push({ key: e.key, value: e.value });
      else if (curr.value !== e.value) updated.push({ key: e.key, value: e.value, previousValue: curr.value });
      else unchanged.push({ key: e.key, value: e.value });
    }

    if (mode === 'preview') {
      return { applied: false, lang, created, updated, unchanged };
    }

    await this.prisma.$transaction(async (tx) => {
      for (const c of created) {
        await tx.translation.create({ data: { lang, key: c.key, value: c.value, updatedById: adminUserId } });
      }
      for (const u of updated) {
        await tx.translation.update({ where: { lang_key: { lang, key: u.key } }, data: { value: u.value, updatedById: adminUserId } });
      }
    });

    await this.audit.record({
      adminUserId,
      action: 'translation.import',
      entityType: 'translation_import',
      entityId: `${lang}:${Date.now()}`,
      before: null,
      after: serialise({ lang, counts: { created: created.length, updated: updated.length, unchanged: unchanged.length } }),
    });

    return { applied: true, lang, created, updated, unchanged };
  }
}

