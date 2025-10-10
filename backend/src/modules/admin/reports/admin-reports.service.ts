import { Injectable } from '@nestjs/common';
import { Prisma, PaymentStatus } from '@prisma/client';

import { PrismaService } from '../../../prisma/prisma.service.js';

@Injectable()
export class AdminReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async overview(params: { from?: Date; to?: Date }) {
    const orderWhere: Prisma.OrderWhereInput = {};
    if (params.from || params.to) {
      orderWhere.createdAt = {};
      if (params.from) (orderWhere.createdAt as any).gte = params.from;
      if (params.to) (orderWhere.createdAt as any).lte = params.to;
    }

    const orders = await this.prisma.order.findMany({ where: orderWhere, select: { id: true, status: true, total: true } });
    const totalsByStatus: Record<string, number> = {};
    let totalRevenue = 0;
    for (const o of orders) {
      totalsByStatus[o.status] = (totalsByStatus[o.status] ?? 0) + 1;
      totalRevenue += o.total ?? 0;
    }
    const outstandingCount = (totalsByStatus['pending'] ?? 0) + (totalsByStatus['processing'] ?? 0);
    const readyForPickupCount = (totalsByStatus['ready'] ?? 0) + (totalsByStatus['ready_for_pickup'] ?? 0);
    const fulfilledCount = totalsByStatus['fulfilled'] ?? 0;

    const donationPayments = await this.prisma.payment.findMany({
      where: { kind: 'donation', status: PaymentStatus.confirmed, ...(params.from || params.to ? { confirmedAt: { gte: params.from, lte: params.to } } : {}) },
      select: { amount: true },
    });
    const totalRaised = donationPayments.reduce((sum, p) => sum + (p.amount ?? 0), 0);
    const pendingAmount = await this.prisma.fundDonation.aggregate({ _sum: { amount: true }, where: { status: 'pending' } });
    const activeProjects = await this.prisma.fundProject.count({ where: { status: 'active' } });
    const projects = await this.prisma.fundProject.findMany({ orderBy: { createdAt: 'desc' }, take: 5 });
    const topProjects = projects.map((p) => ({
      id: p.id,
      title: p.title,
      status: p.status,
      goal: p.goal,
      progress: p.progress,
      percent: p.goal > 0 ? Math.round((p.progress / p.goal) * 100) : 0,
    }));

    const membershipCounts = await this.prisma.membership.groupBy({ by: ['status', 'planId'], _count: true });
    const totalMembers = await this.prisma.membership.count();
    const autoRenewEnabled = await this.prisma.membership.count({ where: { autoRenew: true } });
    const pending = membershipCounts.filter((m) => m.status === 'pending').reduce((n, m) => n + m._count, 0);
    const active = membershipCounts.filter((m) => m.status === 'active').reduce((n, m) => n + m._count, 0);
    const cancelled = membershipCounts.filter((m) => m.status === 'cancelled').reduce((n, m) => n + m._count, 0);
    const planGroups = await this.prisma.membership.groupBy({ by: ['planId'], _count: true });
    const planMap = new Map<string | null, number>(planGroups.map((g) => [g.planId, g._count]));
    const plans = await this.prisma.membershipPlan.findMany();
    const planSeries = plans.map((p) => ({ planId: p.id, planName: p.name, members: planMap.get(p.id) ?? 0 }));

    return {
      shop: {
        totalsByStatus,
        totalRevenue,
        outstandingCount,
        readyForPickupCount,
        fulfilledCount,
      },
      fundraising: {
        totalRaised,
        pendingAmount: pendingAmount._sum.amount ?? 0,
        activeProjects,
        topProjects,
        dailySeries: [],
      },
      membership: {
        total: totalMembers,
        active,
        pending,
        cancelled,
        autoRenewEnabled,
        expiringSoon: 0,
        planSeries,
      },
    };
  }
}

