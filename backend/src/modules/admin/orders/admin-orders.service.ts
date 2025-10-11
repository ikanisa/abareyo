import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Prisma, TicketOrderStatus } from '@prisma/client';

import { PrismaService } from '../../../prisma/prisma.service.js';

export type TicketOrderDetail = Prisma.TicketOrderGetPayload<{
  include: {
    user: { select: { id: true; phoneMask: true } };
    match: { select: { id: true; opponent: true; kickoff: true; venue: true; status: true } };
    items: true;
    payments: true;
    passes: true;
  };
}>;

const PAGE_SIZE_DEFAULT = 25;
const PAGE_SIZE_MAX = 100;

@Injectable()
export class AdminOrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async listTicketOrders(params: { page?: number; pageSize?: number; status?: TicketOrderStatus | 'all'; search?: string }) {
    const page = Math.max(params.page ?? 1, 1);
    const pageSize = Math.min(Math.max(params.pageSize ?? PAGE_SIZE_DEFAULT, 1), PAGE_SIZE_MAX);
    const where: Prisma.TicketOrderWhereInput = {};

    if (params.status && params.status !== 'all') {
      where.status = params.status;
    }

    if (params.search) {
      const term = params.search.trim();
      where.OR = [
        { id: { contains: term, mode: 'insensitive' } },
        { user: { is: { phoneMask: { contains: term, mode: 'insensitive' } } } },
        { ussdCode: { contains: term, mode: 'insensitive' } },
      ];
    }

    const [total, orders] = await this.prisma.$transaction([
      this.prisma.ticketOrder.count({ where }),
      this.prisma.ticketOrder.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          user: { select: { id: true, phoneMask: true } },
          match: { select: { id: true, opponent: true, kickoff: true, venue: true } },
          payments: true,
        },
      }),
    ]);

    return {
      meta: {
        page,
        pageSize,
        total,
      },
      data: orders,
    };
  }

  async getTicketOrder(orderId: string): Promise<TicketOrderDetail> {
    const order = await this.prisma.ticketOrder.findUnique({
      where: { id: orderId },
      include: {
        user: { select: { id: true, phoneMask: true } },
        match: { select: { id: true, opponent: true, kickoff: true, venue: true, status: true } },
        items: true,
        payments: true,
        passes: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Ticket order not found');
    }

    return order;
  }

  async markTicketOrderRefunded(orderId: string, adminUserId: string): Promise<TicketOrderDetail> {
    const order = await this.prisma.ticketOrder.findUnique({
      where: { id: orderId },
      include: { payments: true },
    });

    if (!order) {
      throw new NotFoundException('Ticket order not found');
    }

    if (order.status === 'cancelled') {
      throw new BadRequestException('Order already cancelled');
    }

    const updated = await this.prisma.ticketOrder.update({
      where: { id: orderId },
      data: {
        status: 'cancelled',
        payments: {
          updateMany: {
            where: {},
            data: (() => {
              const meta = order.payments[0]?.metadata;
              const baseMeta =
                typeof meta === 'object' && meta !== null && !Array.isArray(meta)
                  ? (meta as Record<string, unknown>)
                  : {};
              return {
                status: 'manual_review',
                metadata: {
                  ...baseMeta,
                  adminRefundedBy: adminUserId,
                  adminRefundedAt: new Date().toISOString(),
                } as unknown as import('@prisma/client').Prisma.InputJsonValue,
              };
            })(),
          },
        },
      },
      include: {
        user: { select: { id: true, phoneMask: true } },
        match: { select: { id: true, opponent: true, kickoff: true, venue: true, status: true } },
        items: true,
        payments: true,
        passes: true,
      },
    });

    return updated;
  }

  async listShopOrders(params: { page?: number; pageSize?: number; status?: string; search?: string }) {
    const page = Math.max(params.page ?? 1, 1);
    const pageSize = Math.min(Math.max(params.pageSize ?? PAGE_SIZE_DEFAULT, 1), PAGE_SIZE_MAX);
    const where: Prisma.OrderWhereInput = {};

    if (params.status) {
      where.status = params.status;
    }

    if (params.search) {
      const term = params.search.trim();
      where.OR = [{ id: { contains: term, mode: 'insensitive' } }];
    }

    const [total, orders] = await this.prisma.$transaction([
      this.prisma.order.count({ where }),
      this.prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          user: { select: { id: true } },
          items: { include: { product: true } },
          payments: true,
        },
      }),
    ]);

    return {
      meta: { page, pageSize, total },
      data: orders,
    };
  }

  async listDonations(params: { page?: number; pageSize?: number; projectId?: string }) {
    const page = Math.max(params.page ?? 1, 1);
    const pageSize = Math.min(Math.max(params.pageSize ?? PAGE_SIZE_DEFAULT, 1), PAGE_SIZE_MAX);
    const where: Prisma.FundDonationWhereInput = {};

    if (params.projectId) {
      where.projectId = params.projectId;
    }

    const [total, donations] = await this.prisma.$transaction([
      this.prisma.fundDonation.count({ where }),
      this.prisma.fundDonation.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          project: { select: { id: true, title: true } },
          user: { select: { id: true, email: true, phoneMask: true } },
          payments: true,
        },
      }),
    ]);

    return {
      meta: { page, pageSize, total },
      data: donations,
    };
  }
}
