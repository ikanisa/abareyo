import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes, randomUUID } from 'crypto';

import type { TicketAnalyticsContract } from '@rayon/contracts';

import { PrismaService } from '../../prisma/prisma.service.js';
import { RealtimeService } from '../realtime/realtime.service.js';
import { MetricsService } from '../metrics/metrics.service.js';
import { TicketCheckoutDto } from './dto/create-checkout.dto.js';
import { InitiateTransferDto } from './dto/initiate-transfer.dto.js';
import { ClaimTransferDto } from './dto/claim-transfer.dto.js';
import { RotatePassDto } from './dto/rotate-pass.dto.js';

const DEFAULT_ZONE_CAPACITY: Record<string, number> = {
  VIP: 150,
  REGULAR: 1800,
  GENERAL: 3200,
};

const DEFAULT_ZONE_PRICING: Record<string, number> = {
  VIP: 25000,
  REGULAR: 8000,
  GENERAL: 5000,
};

@Injectable()
export class TicketsService {
  private readonly logger = new Logger(TicketsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly realtime: RealtimeService,
    private readonly metrics: MetricsService,
  ) {}

  async createPendingOrder(dto: TicketCheckoutDto) {
    const match = await this.prisma.match.findUnique({ where: { id: dto.matchId } });
    if (!match) {
      throw new NotFoundException('Match not found');
    }
    if (['finished', 'postponed'].includes(match.status)) {
      throw new BadRequestException('Tickets are not available for this match');
    }

    const normalizedChannel: 'mtn' | 'airtel' = dto.channel === 'airtel' ? 'airtel' : 'mtn';
    const now = new Date();

    const aggregated = new Map<string, { quantity: number; price: number }>();
    dto.items.forEach((item) => {
      const expectedPrice = DEFAULT_ZONE_PRICING[item.zone];
      if (!expectedPrice) {
        throw new BadRequestException(`Zone ${item.zone} is not available`);
      }
      if (item.price !== expectedPrice) {
        throw new BadRequestException(`Price mismatch for zone ${item.zone}`);
      }
      const current = aggregated.get(item.zone) ?? { quantity: 0, price: expectedPrice };
      aggregated.set(item.zone, {
        quantity: current.quantity + item.quantity,
        price: expectedPrice,
      });
    });

    const activeOrders = await this.prisma.ticketOrderItem.groupBy({
      by: ['zone'],
      where: {
        order: {
          matchId: dto.matchId,
          OR: [
            { status: 'paid' },
            { status: 'pending', expiresAt: { gt: now } },
          ],
        },
      },
      _sum: { quantity: true },
    });

    aggregated.forEach(({ quantity }, zone) => {
      const capacity = DEFAULT_ZONE_CAPACITY[zone];
      if (!capacity) {
        throw new BadRequestException(`Zone ${zone} is not configured for ticketing`);
      }
      const sold = activeOrders.find((entry) => entry.zone === zone)?._sum.quantity ?? 0;
      if (sold + quantity > capacity) {
        const remaining = Math.max(capacity - sold, 0);
        throw new BadRequestException(`Only ${remaining} seats remain in ${zone}`);
      }
    });

    const total = dto.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const expiresAt = new Date(now.getTime() + 5 * 60 * 1000);
    const ussdCode = this.buildUssdString(normalizedChannel, total);

    let userId: string | undefined;
    if (dto.userId) {
      await this.ensureUser(dto.userId);
      userId = dto.userId;
    }

    const result = await this.prisma.ticketOrder.create({
      data: {
        id: randomUUID(),
        matchId: dto.matchId,
        total,
        status: 'pending',
        ussdCode,
        expiresAt,
        userId,
        items: {
          create: dto.items.map((item) => ({
            zone: item.zone,
            price: item.price,
            quantity: item.quantity,
          })),
        },
        payments: {
          create: {
            kind: 'ticket',
            amount: total,
            status: 'pending',
            metadata: {
              channel: normalizedChannel,
              contactName: dto.contactName ?? null,
              contactPhone: dto.contactPhone ?? null,
            },
          },
        },
      },
      include: {
        payments: true,
      },
    });

    const orderId = result.id;
    const paymentId = result.payments[0]?.id;

    return {
      orderId,
      total,
      ussdCode,
      expiresAt: expiresAt.toISOString(),
      paymentId,
    };
  }

  async issuePassesForOrder(orderId: string) {
    const order = await this.prisma.ticketOrder.findUnique({
      where: { id: orderId },
      include: { items: true, passes: true },
    });

    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    if (order.passes.length) {
      return [];
    }

    const createdTokens: { passId: string; token: string }[] = [];

    for (const item of order.items) {
      for (let i = 0; i < item.quantity; i += 1) {
        const token = randomBytes(8).toString('hex');
        const hash = this.hashToken(token);
        const pass = await this.prisma.ticketPass.create({
          data: {
            orderId: order.id,
            zone: item.zone,
            gate: item.gate ?? item.zone,
            qrTokenHash: hash,
          },
        });
        createdTokens.push({ passId: pass.id, token });
      }
    }

    return createdTokens;
  }

  async verifyPassToken(token: string, options?: { dryRun?: boolean; stewardId?: string }) {
    const hash = this.hashToken(token);
    const pass = await this.prisma.ticketPass.findUnique({
      where: { qrTokenHash: hash },
      include: {
        order: {
          select: {
            id: true,
            matchId: true,
          },
        },
      },
    });

    if (!pass) {
      return { status: 'not_found' as const };
    }

    if (pass.state !== 'active') {
      if (!options?.dryRun) {
        await this.prisma.gateScan.create({
          data: {
            passId: pass.id,
            stewardId: options?.stewardId ?? null,
            result: pass.state,
          },
        });
        this.realtime.notifyGateScan({
          passId: pass.id,
          result: pass.state,
          gate: pass.gate,
          stewardId: options?.stewardId ?? null,
        });
        this.metrics.recordGateScan({
          matchId: pass.order.matchId,
          gate: pass.gate ?? 'Unassigned',
          result: pass.state,
        });
        await this.emitGateMetricsForMatch(pass.order.matchId);
      }
      return { status: pass.state as 'used' | 'refunded', passId: pass.id };
    }

    if (!options?.dryRun) {
      await this.prisma.ticketPass.update({
        where: { id: pass.id },
        data: { state: 'used', consumedAt: new Date() },
      });
      await this.prisma.gateScan.create({
        data: {
          passId: pass.id,
          stewardId: options?.stewardId ?? null,
          result: 'verified',
        },
      });
      this.realtime.notifyGateScan({
        passId: pass.id,
        result: 'verified',
        gate: pass.gate,
        stewardId: options?.stewardId ?? null,
      });
      this.metrics.recordGateScan({
        matchId: pass.order.matchId,
        gate: pass.gate ?? 'Unassigned',
        result: 'verified',
      });
      await this.emitGateMetricsForMatch(pass.order.matchId);
    }

    return {
      status: 'verified' as const,
      passId: pass.id,
      orderId: pass.orderId,
      zone: pass.zone,
    };
  }

  async getOrderSnapshot(orderId: string) {
    const order = await this.prisma.ticketOrder.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        passes: true,
        payments: true,
        match: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    return order;
  }

  async getTicketCatalog() {
    const now = new Date();
    const matches = await this.prisma.match.findMany({
      orderBy: { kickoff: 'asc' },
      include: {
        ticketOrders: {
          where: {
            OR: [
              { status: 'paid' },
              { status: 'pending', expiresAt: { gt: now } },
            ],
          },
          include: { items: true },
        },
      },
    });

    return matches.map((match) => {
      const zoneUsage = new Map<string, number>();
      match.ticketOrders.forEach((order) => {
        order.items.forEach((item) => {
          const current = zoneUsage.get(item.zone) ?? 0;
          zoneUsage.set(item.zone, current + item.quantity);
        });
      });

      const zones = Object.entries(DEFAULT_ZONE_CAPACITY).map(([zone, capacity]) => {
        const sold = zoneUsage.get(zone) ?? 0;
        const price = DEFAULT_ZONE_PRICING[zone] ?? 0;
        const remaining = Math.max(capacity - sold, 0);
        return {
          zone,
          price,
          capacity,
          remaining,
          gate: zone,
        };
      });

      return {
        id: match.id,
        opponent: match.opponent,
        kickoff: match.kickoff.toISOString(),
        venue: match.venue,
        competition: match.competition ?? null,
        status: match.status,
        zones,
      };
    });
  }

  async listActivePasses(userId: string) {
    const passes = await this.prisma.ticketPass.findMany({
      where: {
        state: 'active',
        order: {
          userId,
          status: 'paid',
        },
      },
      orderBy: { updatedAt: 'desc' },
      include: {
        order: {
          include: {
            match: true,
          },
        },
      },
    });

    return passes.map((pass) => ({
      passId: pass.id,
      matchId: pass.order?.matchId ?? '',
      matchOpponent: pass.order?.match?.opponent ?? 'TBD',
      kickoff: pass.order?.match?.kickoff?.toISOString?.() ?? new Date().toISOString(),
      zone: pass.zone,
      gate: pass.gate,
      updatedAt: pass.updatedAt.toISOString(),
    }));
  }

  async rotatePassToken(dto: RotatePassDto) {
    const pass = await this.prisma.ticketPass.findUnique({
      where: { id: dto.passId },
      include: {
        order: true,
      },
    });

    if (!pass || !pass.order || pass.order.userId !== dto.userId) {
      throw new NotFoundException('Pass not found for user');
    }

    if (pass.state !== 'active') {
      throw new NotFoundException('Only active passes can be rotated');
    }

    const token = randomBytes(8).toString('hex');
    const hash = this.hashToken(token);
    const rotatedAt = new Date();

    await this.prisma.ticketPass.update({
      where: { id: pass.id },
      data: {
        qrTokenHash: hash,
        updatedAt: rotatedAt,
      },
    });

    return {
      passId: pass.id,
      token,
      rotatedAt: rotatedAt.toISOString(),
      validForSeconds: 120,
    };
  }

  async listGateHistory(limit = 50) {
    return this.prisma.gateScan.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        pass: {
          include: {
            order: {
              select: { matchId: true, userId: true },
            },
          },
        },
      },
    });
  }

  async listOrdersForUser(userId: string) {
    const orders = await this.prisma.ticketOrder.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        items: true,
        payments: true,
        match: true,
      },
    });

    return orders.map((order) => ({
      id: order.id,
      status: order.status,
      total: order.total,
      createdAt: order.createdAt.toISOString(),
      expiresAt: order.expiresAt.toISOString(),
      ussdCode: order.ussdCode,
      smsRef: order.smsRef ?? null,
      match: order.match
        ? {
            id: order.match.id,
            opponent: order.match.opponent,
            kickoff: order.match.kickoff.toISOString(),
            venue: order.match.venue,
          }
        : null,
      items: order.items.map((item) => ({
        id: item.id,
        zone: item.zone,
        quantity: item.quantity,
        price: item.price,
      })),
      payments: order.payments.map((payment) => ({
        id: payment.id,
        status: payment.status,
        amount: payment.amount,
        createdAt: payment.createdAt.toISOString(),
      })),
    }));
  }

  async cancelPendingOrder(orderId: string, userId: string) {
    const order = await this.prisma.ticketOrder.findUnique({
      where: { id: orderId },
      include: {
        payments: true,
      },
    });

    if (!order || order.userId !== userId) {
      throw new NotFoundException('Order not found');
    }

    if (order.status !== 'pending') {
      throw new BadRequestException('Only pending orders can be cancelled');
    }

    await Promise.all(
      order.payments
        .filter((payment) => payment.kind === 'ticket' && payment.status === 'pending')
        .map((payment) => {
          const baseMeta =
            typeof payment.metadata === 'object' && payment.metadata !== null && !Array.isArray(payment.metadata)
              ? (payment.metadata as Record<string, unknown>)
              : {};
          return this.prisma.payment.update({
            where: { id: payment.id },
            data: {
              status: 'failed',
              metadata: { ...baseMeta, cancelledBy: 'user' } as unknown as import('@prisma/client').Prisma.InputJsonValue,
            },
          });
        }),
    );

    const updated = await this.prisma.ticketOrder.update({
      where: { id: order.id },
      data: { status: 'cancelled' },
    });

    return {
      id: updated.id,
      status: updated.status,
    };
  }

  async getOrderReceipt(orderId: string, userId: string) {
    const order = await this.prisma.ticketOrder.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        payments: true,
        match: true,
        passes: true,
      },
    });

    if (!order || order.userId !== userId) {
      throw new NotFoundException('Order not found');
    }

    return {
      id: order.id,
      status: order.status,
      total: order.total,
      createdAt: order.createdAt.toISOString(),
      expiresAt: order.expiresAt.toISOString(),
      smsRef: order.smsRef ?? null,
      ussdCode: order.ussdCode,
      match: order.match
        ? {
            id: order.match.id,
            opponent: order.match.opponent,
            kickoff: order.match.kickoff.toISOString(),
            venue: order.match.venue,
          }
        : null,
      items: order.items.map((item) => ({
        id: item.id,
        zone: item.zone,
        quantity: item.quantity,
        price: item.price,
      })),
      payments: order.payments.map((payment) => ({
        id: payment.id,
        status: payment.status,
        amount: payment.amount,
        confirmedAt: payment.confirmedAt?.toISOString() ?? null,
        createdAt: payment.createdAt.toISOString(),
        metadata: payment.metadata ?? null,
      })),
      passes: order.passes.map((pass) => ({
        id: pass.id,
        zone: pass.zone,
        gate: pass.gate,
        state: pass.state,
        updatedAt: pass.updatedAt.toISOString(),
        transferredToUserId: pass.transferredToUserId ?? null,
      })),
    };
  }

  async analytics(): Promise<TicketAnalyticsContract> {
    const [ordersByStatus, ticketPayments, paymentStatusCounts, matches] = await Promise.all([
      this.prisma.ticketOrder.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
      this.prisma.payment.findMany({
        where: { kind: 'ticket', status: 'confirmed' },
        select: { amount: true, confirmedAt: true, createdAt: true, orderId: true },
      }),
      this.prisma.payment.groupBy({
        by: ['status'],
        where: { kind: 'ticket' },
        _count: { _all: true },
      }),
      this.prisma.match.findMany({
        orderBy: { kickoff: 'asc' },
        include: {
          ticketOrders: {
            include: {
              items: true,
              payments: {
                where: { kind: 'ticket', status: 'confirmed' },
                select: { amount: true },
              },
            },
          },
        },
      }),
    ]);

    const statusTotals: Record<string, number> = {
      pending: 0,
      paid: 0,
      cancelled: 0,
      expired: 0,
    };
    let totalOrders = 0;
    ordersByStatus.forEach((entry) => {
      totalOrders += entry._count._all;
      statusTotals[entry.status] = entry._count._all;
    });

    const totalRevenue = ticketPayments.reduce((sum, payment) => sum + payment.amount, 0);
    const averageOrderValue = totalOrders ? Math.round(totalRevenue / totalOrders) : 0;

    const dailyMap = new Map<string, { revenue: number; orders: number }>();
    ticketPayments.forEach((payment) => {
      const timestamp = payment.confirmedAt ?? payment.createdAt;
      const key = timestamp.toISOString().slice(0, 10);
      const current = dailyMap.get(key) ?? { revenue: 0, orders: 0 };
      dailyMap.set(key, {
        revenue: current.revenue + payment.amount,
        orders: current.orders + 1,
      });
    });

    const recentSales = Array.from(dailyMap.entries())
      .sort(([a], [b]) => (a > b ? 1 : a < b ? -1 : 0))
      .slice(-14)
      .map(([date, info]) => ({ date, revenue: info.revenue, orders: info.orders }));

    const matchBreakdown = matches.map((match) => {
      const paidOrders = match.ticketOrders.filter((order) => order.status === 'paid');
      const seatsSold = paidOrders.reduce(
        (sum, order) => sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
        0,
      );
      const matchRevenue = paidOrders.reduce(
        (sum, order) => sum + order.payments.reduce((paySum, payment) => paySum + payment.amount, 0),
        0,
      );
      const capacity = Object.values(DEFAULT_ZONE_CAPACITY).reduce((sum, value) => sum + value, 0);

      return {
        matchId: match.id,
        opponent: match.opponent,
        kickoff: match.kickoff.toISOString(),
        venue: match.venue,
        totalRevenue: matchRevenue,
        paidOrders: paidOrders.length,
        seatsSold,
        capacity,
      };
    });

    const paymentStatus = paymentStatusCounts.map((entry) => ({
      status: entry.status,
      count: entry._count._all,
    }));

    return {
      totals: {
        revenue: totalRevenue,
        orders: totalOrders,
        paid: statusTotals.paid ?? 0,
        pending: statusTotals.pending ?? 0,
        cancelled: statusTotals.cancelled ?? 0,
        expired: statusTotals.expired ?? 0,
        averageOrderValue,
      },
      matchBreakdown,
      recentSales,
      paymentStatus,
    };
  }

  async initiateTransfer(dto: InitiateTransferDto) {
    const pass = await this.prisma.ticketPass.findUnique({
      where: { id: dto.passId },
      include: { order: true },
    });

    if (!pass || !pass.order) {
      throw new NotFoundException('Pass not found');
    }

    if (pass.state !== 'active') {
      throw new NotFoundException('Only active passes can be transferred');
    }

    if (!pass.order.userId || pass.order.userId !== dto.ownerUserId) {
      throw new NotFoundException('Owner mismatch for transfer');
    }

    const transferCode = randomBytes(3).toString('hex').toUpperCase();
    const hash = this.hashToken(transferCode);

    await this.prisma.ticketPass.update({
      where: { id: pass.id },
      data: {
        transferTokenHash: hash,
        transferredToUserId: dto.targetUserId ?? null,
        transferredAt: null,
      },
    });

    return {
      transferCode,
      passId: pass.id,
      targetUserId: dto.targetUserId ?? null,
    };
  }

  async claimTransfer(dto: ClaimTransferDto) {
    const pass = await this.prisma.ticketPass.findUnique({
      where: { id: dto.passId },
      include: { order: true },
    });

    if (!pass || !pass.order) {
      throw new NotFoundException('Pass not found');
    }

    if (!pass.transferTokenHash) {
      throw new NotFoundException('Transfer token expired');
    }

    const providedHash = this.hashToken(dto.transferCode.toUpperCase());
    if (providedHash !== pass.transferTokenHash) {
      throw new NotFoundException('Invalid transfer code');
    }

    if (pass.transferredToUserId && pass.transferredToUserId !== dto.recipientUserId) {
      throw new NotFoundException('Transfer locked to another recipient');
    }

    await this.ensureUser(dto.recipientUserId);

    await this.prisma.ticketPass.update({
      where: { id: pass.id },
      data: {
        transferredToUserId: dto.recipientUserId,
        transferredAt: new Date(),
        transferTokenHash: null,
      },
    });

    return {
      passId: pass.id,
      recipientUserId: dto.recipientUserId,
    };
  }

  private buildUssdString(channel: 'mtn' | 'airtel', amount: number) {
    const payments = this.configService.get('payments');
    const shortcode = channel === 'airtel' ? payments.airtelPayCode : payments.mtnPayCode;
    const formattedAmount = Math.max(amount, 0);
    // Encode # as %23 for tel: links per guard-rails
    const hash = '%23';
    return `*182*1*${shortcode}*${formattedAmount}${hash}`;
  }

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private async ensureUser(userId: string) {
    await this.prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: {
        id: userId,
        locale: 'rw',
      },
    });
  }

  private async emitGateMetricsForMatch(matchId: string) {
    try {
      const scans = await this.prisma.gateScan.findMany({
        where: {
          pass: {
            order: {
              matchId,
            },
          },
        },
        include: {
          pass: {
            select: { gate: true },
          },
        },
      });

      const metricsMap = new Map<string, { total: number; verified: number; rejected: number }>();
      for (const scan of scans) {
        const gate = scan.pass?.gate ?? 'Unassigned';
        const current = metricsMap.get(gate) ?? { total: 0, verified: 0, rejected: 0 };
        current.total += 1;
        if (scan.result === 'verified') {
          current.verified += 1;
        } else {
          current.rejected += 1;
        }
        metricsMap.set(gate, current);
      }

      const snapshot = Array.from(metricsMap.entries()).map(([gate, values]) => ({
        gate,
        total: values.total,
        verified: values.verified,
        rejected: values.rejected,
      }));

      this.realtime.notifyGateMetricsSnapshot({ matchId, metrics: snapshot });
    } catch (error) {
      // Avoid blocking gate scans if aggregation fails; log for observability.
      const err = error as Error;
      this.logger.error(`Failed to emit gate metrics for match ${matchId}: ${err.message}`, err.stack);
    }
  }
}
