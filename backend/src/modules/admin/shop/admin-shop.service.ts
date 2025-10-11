import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../../prisma/prisma.service.js';

const PAGE_SIZE_DEFAULT = 25;
const PAGE_SIZE_MAX = 100;

@Injectable()
export class AdminShopService {
  constructor(private readonly prisma: PrismaService) {}

  async listOrders(params: { page?: number; pageSize?: number; status?: string; search?: string }) {
    const page = Math.max(params.page ?? 1, 1);
    const pageSize = Math.min(Math.max(params.pageSize ?? PAGE_SIZE_DEFAULT, 1), PAGE_SIZE_MAX);
    const where: Prisma.OrderWhereInput = {};
    if (params.status) where.status = params.status;
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
          user: { select: { id: true, phoneMask: true } },
          items: { include: { product: true } },
          payments: true,
        },
      }),
    ]);

    return { meta: { page, pageSize, total }, data: orders };
  }

  async updateStatus(orderId: string, payload: { status: string; note?: string; adminUserId?: string | null }) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');
    const notes = Array.isArray(order.fulfillmentNotes) ? (order.fulfillmentNotes as any[]) : [];
    if (payload.note) {
      notes.push({ at: new Date().toISOString(), note: payload.note, adminUserId: payload.adminUserId ?? null });
    }
    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: { status: payload.status, fulfillmentNotes: notes.length ? (notes as unknown as Prisma.InputJsonValue) : order.fulfillmentNotes },
      include: { user: true, items: { include: { product: true } }, payments: true },
    });
    return { before: order, after: updated };
  }

  async addNote(orderId: string, note: string, adminUserId?: string | null) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');
    const notes = Array.isArray(order.fulfillmentNotes) ? (order.fulfillmentNotes as any[]) : [];
    notes.push({ at: new Date().toISOString(), note, adminUserId: adminUserId ?? null });
    const updated = await this.prisma.order.update({ where: { id: orderId }, data: { fulfillmentNotes: notes as unknown as Prisma.InputJsonValue }, include: { user: true, items: { include: { product: true } }, payments: true } });
    return { before: order, after: updated };
  }

  async updateTracking(orderId: string, trackingNumber?: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');
    const updated = await this.prisma.order.update({ where: { id: orderId }, data: { trackingNumber: trackingNumber ?? null }, include: { user: true, items: { include: { product: true } }, payments: true } });
    return { before: order, after: updated };
  }

  async batchUpdateStatus(orderIds: string[], payload: { status: string; note?: string; adminUserId?: string | null }) {
    const results = [] as Array<{ before: any; after: any }>;
    for (const id of orderIds) {
      // serial for audit trail clarity
      const result = await this.updateStatus(id, payload);
      results.push(result);
    }
    return results;
  }

  async summary(params: { from?: Date; to?: Date }) {
    const whereRange: Prisma.OrderWhereInput = {};
    if (params.from || params.to) {
      whereRange.createdAt = {};
      if (params.from) (whereRange.createdAt as any).gte = params.from;
      if (params.to) (whereRange.createdAt as any).lte = params.to;
    }

    const orders = await this.prisma.order.findMany({ where: whereRange, select: { id: true, status: true, total: true } });
    const totalsByStatus: Record<string, number> = {};
    let totalRevenue = 0;
    for (const o of orders) {
      totalsByStatus[o.status] = (totalsByStatus[o.status] ?? 0) + 1;
      totalRevenue += o.total ?? 0;
    }

    const outstandingCount = (totalsByStatus['pending'] ?? 0) + (totalsByStatus['processing'] ?? 0);
    const readyForPickupCount = (totalsByStatus['ready'] ?? 0) + (totalsByStatus['ready_for_pickup'] ?? 0);
    const fulfilledCount = totalsByStatus['fulfilled'] ?? 0;
    const averageOrderValue = orders.length ? Math.round(totalRevenue / orders.length) : 0;

    return {
      totalsByStatus,
      totalRevenue,
      averageOrderValue,
      outstandingCount,
      readyForPickupCount,
      fulfilledCount,
    };
  }
}
