import { BadRequestException } from '@nestjs/common';
import { TicketsService } from './tickets.service';
import type { PrismaService } from '../../prisma/prisma.service';
import type { ConfigService } from '@nestjs/config';
import type { RealtimeService } from '../realtime/realtime.service';

const createService = () => {
  const prismaMock = {
    ticketOrder: {
      groupBy: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
    },
    payment: {
      findMany: jest.fn(),
      groupBy: jest.fn(),
      update: jest.fn(),
    },
    match: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    ticketOrderItem: {
      groupBy: jest.fn(),
    },
    user: {
      upsert: jest.fn(),
    },
  } as unknown as PrismaService;

  const configMock = {
    get: jest.fn((key: string) => {
      if (key === 'payments') {
        return { mtnPayCode: '0000', airtelPayCode: '1111' };
      }
      return undefined;
    }),
  } as unknown as ConfigService;

  const realtimeMock = {
    notifyTicketOrderConfirmed: jest.fn(),
  } as unknown as RealtimeService;

  const service = new TicketsService(prismaMock, configMock, realtimeMock);

  return {
    service,
    prismaMock,
    configMock,
    realtimeMock,
  };
};

describe('TicketsService – analytics', () => {
  it('aggregates revenue, order statuses, and match metrics', async () => {
    const { service, prismaMock } = createService();

    const now = new Date('2025-02-05T10:00:00Z');

    (prismaMock.ticketOrder.groupBy as jest.Mock).mockResolvedValue([
      { status: 'paid', _count: { _all: 3 } },
      { status: 'pending', _count: { _all: 2 } },
    ]);

    (prismaMock.payment.findMany as jest.Mock).mockResolvedValue([
      { amount: 25000, confirmedAt: now, createdAt: now, orderId: 'order-1' },
      { amount: 16000, confirmedAt: now, createdAt: now, orderId: 'order-2' },
    ]);

    (prismaMock.payment.groupBy as jest.Mock).mockResolvedValue([
      { status: 'confirmed', _count: { _all: 2 } },
      { status: 'pending', _count: { _all: 1 } },
    ]);

    (prismaMock.match.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'match-1',
        opponent: 'APR FC',
        kickoff: now,
        venue: 'Amahoro Stadium',
        ticketOrders: [
          {
            status: 'paid',
            items: [
              { quantity: 2 },
              { quantity: 1 },
            ],
            payments: [{ amount: 25000 }],
          },
        ],
      },
      {
        id: 'match-2',
        opponent: 'Police FC',
        kickoff: now,
        venue: 'Bugesera',
        ticketOrders: [
          {
            status: 'pending',
            items: [{ quantity: 1 }],
            payments: [],
          },
          {
            status: 'paid',
            items: [{ quantity: 3 }],
            payments: [{ amount: 16000 }],
          },
        ],
      },
    ]);

    const analytics = await service.analytics();

    expect(analytics.totals).toMatchObject({
      revenue: 41000,
      orders: 5,
      paid: 3,
      pending: 2,
      averageOrderValue: 8200,
    });

    expect(analytics.recentSales).toEqual([
      { date: '2025-02-05', revenue: 41000, orders: 2 },
    ]);

    expect(analytics.matchBreakdown).toHaveLength(2);
    const firstMatch = analytics.matchBreakdown.find((match) => match.matchId === 'match-1');
    expect(firstMatch).toMatchObject({
      opponent: 'APR FC',
      totalRevenue: 25000,
      seatsSold: 3,
      paidOrders: 1,
    });

    expect(analytics.paymentStatus).toEqual([
      { status: 'confirmed', count: 2 },
      { status: 'pending', count: 1 },
    ]);
  });
});

describe('TicketsService – checkout flow', () => {
  it('creates an order when seats are available and attaches metadata', async () => {
    const { service, prismaMock } = createService();

    (prismaMock.match.findUnique as jest.Mock).mockResolvedValue({ id: 'match-1', status: 'scheduled' });
    (prismaMock.ticketOrderItem.groupBy as jest.Mock).mockResolvedValue([{ zone: 'VIP', _sum: { quantity: 10 } }]);
    (prismaMock.ticketOrder.create as jest.Mock).mockResolvedValue({ id: 'order-1', payments: [{ id: 'payment-1' }] });
    (prismaMock.user.upsert as jest.Mock).mockResolvedValue({ id: 'user-1' });

    const result = await service.createPendingOrder({
      matchId: 'match-1',
      channel: 'mtn',
      userId: 'user-1',
      contactName: 'Test Fan',
      contactPhone: '0780000000',
      items: [
        {
          zone: 'VIP',
          quantity: 2,
          price: 25000,
        },
      ],
    });

    expect(result).toMatchObject({ orderId: 'order-1', paymentId: 'payment-1', total: 50000 });
    expect(prismaMock.user.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'user-1' } }),
    );
    expect(prismaMock.ticketOrder.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user-1',
          payments: expect.objectContaining({
            create: expect.objectContaining({
              metadata: expect.objectContaining({ contactName: 'Test Fan', contactPhone: '0780000000' }),
            }),
          }),
        }),
      }),
    );
  });

  it('throws when requested quantity exceeds capacity', async () => {
    const { service, prismaMock } = createService();

    (prismaMock.match.findUnique as jest.Mock).mockResolvedValue({ id: 'match-1', status: 'scheduled' });
    (prismaMock.ticketOrderItem.groupBy as jest.Mock).mockResolvedValue([{ zone: 'VIP', _sum: { quantity: 150 } }]);

    await expect(
      service.createPendingOrder({
        matchId: 'match-1',
        items: [
          {
            zone: 'VIP',
            quantity: 1,
            price: 25000,
          },
        ],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prismaMock.ticketOrder.create).not.toHaveBeenCalled();
  });
});

describe('TicketsService – cancelPendingOrder', () => {
  it('marks order as cancelled and updates pending payments', async () => {
    const { service, prismaMock } = createService();

    (prismaMock.ticketOrder.findUnique as jest.Mock).mockResolvedValue({
      id: 'order-1',
      userId: 'user-1',
      status: 'pending',
      payments: [
        { id: 'payment-1', status: 'pending', kind: 'ticket', metadata: null },
        { id: 'payment-2', status: 'confirmed', kind: 'ticket', metadata: null },
      ],
    });

    (prismaMock.payment.update as jest.Mock).mockResolvedValue({ id: 'payment-1' });
    (prismaMock.ticketOrder.update as jest.Mock).mockResolvedValue({ id: 'order-1', status: 'cancelled' });

    const result = await service.cancelPendingOrder('order-1', 'user-1');

    expect(result).toEqual({ id: 'order-1', status: 'cancelled' });
    expect(prismaMock.payment.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'payment-1' }, data: expect.objectContaining({ status: 'failed' }) }),
    );
    expect(prismaMock.ticketOrder.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'order-1' }, data: { status: 'cancelled' } }),
    );
  });
});
