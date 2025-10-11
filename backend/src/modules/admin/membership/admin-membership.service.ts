import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, MembershipStatus } from '@prisma/client';

import { PrismaService } from '../../../prisma/prisma.service.js';

const PAGE_SIZE_DEFAULT = 25;
const PAGE_SIZE_MAX = 100;

@Injectable()
export class AdminMembershipService {
  constructor(private readonly prisma: PrismaService) {}

  async listPlans() {
    const plans = await this.prisma.membershipPlan.findMany({ orderBy: { price: 'asc' } });
    return plans.map((p) => ({
      ...p,
      perks: Array.isArray(p.perks) ? (p.perks as unknown as string[]) : [],
    }));
  }

  async upsertPlan(payload: { id?: string; name: string; slug: string; price: number; perks: string[]; isActive?: boolean }) {
    const data: Prisma.MembershipPlanUncheckedCreateInput = {
      name: payload.name,
      slug: payload.slug,
      price: payload.price,
      perks: payload.perks,
      isActive: payload.isActive ?? true,
    } as Prisma.MembershipPlanUncheckedCreateInput;

    const plan = payload.id
      ? await this.prisma.membershipPlan.update({ where: { id: payload.id }, data })
      : await this.prisma.membershipPlan.create({ data });

    return {
      ...plan,
      perks: Array.isArray(plan.perks) ? (plan.perks as unknown as string[]) : [],
    };
  }

  async listMembers(params: { page?: number; pageSize?: number; status?: string; planId?: string; search?: string }) {
    const page = Math.max(params.page ?? 1, 1);
    const pageSize = Math.min(Math.max(params.pageSize ?? PAGE_SIZE_DEFAULT, 1), PAGE_SIZE_MAX);
    const where: Prisma.MembershipWhereInput = {};

    if (params.status && Object.values(MembershipStatus).includes(params.status as MembershipStatus)) {
      where.status = params.status as MembershipStatus;
    }
    if (params.planId) {
      where.planId = params.planId;
    }
    if (params.search) {
      const term = params.search.trim();
      where.OR = [{ user: { is: { phoneMask: { contains: term, mode: 'insensitive' } } } }];
    }

    const [total, members] = await this.prisma.$transaction([
      this.prisma.membership.count({ where }),
      this.prisma.membership.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          user: { select: { id: true, phoneMask: true, locale: true } },
          plan: true,
          payments: true,
        },
      }),
    ]);

    return { meta: { page, pageSize, total }, data: members };
  }

  async updateMemberStatus(membershipId: string, payload: { status: string; autoRenew?: boolean }) {
    const membership = await this.prisma.membership.findUnique({ where: { id: membershipId } });
    if (!membership) {
      throw new NotFoundException('Membership not found');
    }

    const data: Prisma.MembershipUpdateInput = {};
    if (payload.status && Object.values(MembershipStatus).includes(payload.status as MembershipStatus)) {
      data.status = payload.status as MembershipStatus;
    }
    if (typeof payload.autoRenew === 'boolean') {
      data.autoRenew = payload.autoRenew;
    }

    const updated = await this.prisma.membership.update({ where: { id: membershipId }, data, include: { user: true, plan: true, payments: true } });
    return updated;
  }
}
