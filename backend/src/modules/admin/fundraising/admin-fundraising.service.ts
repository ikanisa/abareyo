import { Injectable } from '@nestjs/common';
import { Prisma, PaymentStatus } from '@prisma/client';

import { PrismaService } from '../../../prisma/prisma.service.js';

const PAGE_SIZE_DEFAULT = 25;
const PAGE_SIZE_MAX = 100;

@Injectable()
export class AdminFundraisingService {
  constructor(private readonly prisma: PrismaService) {}

  async listProjects(params: { status?: string; search?: string }) {
    const where: Prisma.FundProjectWhereInput = {};
    if (params.status) where.status = params.status;
    if (params.search) {
      const term = params.search.trim();
      where.OR = [{ title: { contains: term, mode: 'insensitive' } }, { description: { contains: term, mode: 'insensitive' } }];
    }
    const data = await this.prisma.fundProject.findMany({ where, orderBy: { createdAt: 'desc' } });
    return data;
  }

  async upsertProject(payload: {
    id?: string;
    title: string;
    description?: string;
    goal: number;
    progress: number;
    status?: string;
    coverImage?: string;
  }) {
    const data: Prisma.FundProjectUncheckedCreateInput = {
      title: payload.title,
      description: payload.description ?? null,
      goal: payload.goal,
      progress: payload.progress ?? 0,
      status: payload.status ?? 'draft',
      coverImage: payload.coverImage ?? null,
    };
    const project = payload.id
      ? await this.prisma.fundProject.update({ where: { id: payload.id }, data })
      : await this.prisma.fundProject.create({ data });
    return project;
  }

  async listDonations(params: { page?: number; pageSize?: number; status?: string; projectId?: string; search?: string }) {
    const page = Math.max(params.page ?? 1, 1);
    const pageSize = Math.min(Math.max(params.pageSize ?? PAGE_SIZE_DEFAULT, 1), PAGE_SIZE_MAX);
    const where: Prisma.FundDonationWhereInput = {};
    if (params.status && Object.values(PaymentStatus).includes(params.status as PaymentStatus)) {
      where.status = params.status as PaymentStatus;
    }
    if (params.projectId) where.projectId = params.projectId;
    if (params.search) {
      const term = params.search.trim();
      where.OR = [
        { id: { contains: term, mode: 'insensitive' } },
        { user: { email: { contains: term, mode: 'insensitive' } } },
        { user: { phoneMask: { contains: term, mode: 'insensitive' } } },
      ];
    }
    const [total, donations] = await this.prisma.$transaction([
      this.prisma.fundDonation.count({ where }),
      this.prisma.fundDonation.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { user: { select: { id: true, email: true, phoneMask: true } }, project: { select: { id: true, title: true } }, payments: true },
      }),
    ]);
    return { meta: { page, pageSize, total }, data: donations };
  }

  async updateDonationStatus(donationId: string, payload: { status: string; note?: string }) {
    const donation = await this.prisma.fundDonation.update({
      where: { id: donationId },
      data: {
        status: (Object.values(PaymentStatus).includes(payload.status as PaymentStatus)
          ? (payload.status as PaymentStatus)
          : undefined) as any,
      },
      include: { user: true, project: true, payments: true },
    });
    return donation;
  }

  async summary(params: { from?: Date; to?: Date }) {
    // Totals from payments for donations
    const wherePayments: Prisma.PaymentWhereInput = { kind: 'donation', status: 'confirmed' } as any;
    if (params.from || params.to) {
      wherePayments.confirmedAt = {};
      if (params.from) (wherePayments.confirmedAt as any).gte = params.from;
      if (params.to) (wherePayments.confirmedAt as any).lte = params.to;
    }
    const payments = await this.prisma.payment.findMany({ where: wherePayments, select: { amount: true, confirmedAt: true } });
    const totalRaised = payments.reduce((sum, p) => sum + (p.amount ?? 0), 0);

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

    const byDay = new Map<string, number>();
    for (const p of payments) {
      const date = (p.confirmedAt ?? new Date()).toISOString().slice(0, 10);
      byDay.set(date, (byDay.get(date) ?? 0) + (p.amount ?? 0));
    }
    const dailySeries = Array.from(byDay.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, value]) => ({ date, value }));

    return {
      totalRaised,
      pendingAmount: pendingAmount._sum.amount ?? 0,
      activeProjects,
      topProjects,
      dailySeries,
    };
  }
}

