import { BadRequestException, NotFoundException } from '@nestjs/common';

import { AdminOrdersService } from './admin-orders.service';

describe('AdminOrdersService', () => {
  const mockPrisma = {
    $transaction: jest.fn((operations: Array<Promise<unknown>>) => Promise.all(operations)),
    ticketOrder: {
      count: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    order: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    fundDonation: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
  } as const;

  const service = new AdminOrdersService(mockPrisma as any);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('listTicketOrders', () => {
    it('applies pagination, status, and search filters', async () => {
      const orders = [{ id: 'order-1' }];
      (mockPrisma.ticketOrder.count as jest.Mock).mockResolvedValue(1);
      (mockPrisma.ticketOrder.findMany as jest.Mock).mockResolvedValue(orders);

      const result = await service.listTicketOrders({ page: 2, pageSize: 10, status: 'paid', search: 'ABC' });

      expect(mockPrisma.ticketOrder.count).toHaveBeenCalledWith({
        where: {
          status: 'paid',
          OR: [
            { id: { contains: 'ABC', mode: 'insensitive' } },
            { user: { is: { email: { contains: 'ABC', mode: 'insensitive' } } } },
            { user: { is: { phoneMask: { contains: 'ABC', mode: 'insensitive' } } } },
            { ussdCode: { contains: 'ABC', mode: 'insensitive' } },
          ],
        },
      });
      expect(mockPrisma.ticketOrder.findMany).toHaveBeenCalledWith({
        where: expect.any(Object),
        orderBy: { createdAt: 'desc' },
        skip: 10,
        take: 10,
        include: {
          user: { select: { id: true, email: true, phoneMask: true } },
          match: { select: { id: true, opponent: true, kickoff: true, venue: true } },
          payments: true,
        },
      });
      expect(result.meta).toEqual({ page: 2, pageSize: 10, total: 1 });
      expect(result.data).toEqual(orders);
    });
  });

  describe('markTicketOrderRefunded', () => {
    const baseOrder = {
      id: 'order-1',
      status: 'paid',
      payments: [{ metadata: { foo: 'bar' } }],
    };

    it('throws when order missing', async () => {
      (mockPrisma.ticketOrder.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.markTicketOrderRefunded('missing', 'admin-1')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws when already cancelled', async () => {
      (mockPrisma.ticketOrder.findUnique as jest.Mock).mockResolvedValue({ ...baseOrder, status: 'cancelled' });

      await expect(service.markTicketOrderRefunded('order-1', 'admin-1')).rejects.toBeInstanceOf(BadRequestException);
    });

    it('cancels order and flags payments for manual review', async () => {
      const updatedOrder = { ...baseOrder, status: 'cancelled', payments: [] };
      (mockPrisma.ticketOrder.findUnique as jest.Mock).mockResolvedValue(baseOrder);
      (mockPrisma.ticketOrder.update as jest.Mock).mockResolvedValue(updatedOrder);

      const result = await service.markTicketOrderRefunded('order-1', 'admin-1');

      expect(mockPrisma.ticketOrder.update).toHaveBeenCalledWith({
        where: { id: 'order-1' },
        data: {
          status: 'cancelled',
          payments: {
            updateMany: {
              where: {},
              data: expect.objectContaining({
                status: 'manual_review',
                metadata: expect.objectContaining({
                  adminRefundedBy: 'admin-1',
                }),
              }),
            },
          },
        },
        include: expect.any(Object),
      });
      expect(result).toEqual(updatedOrder);
    });
  });
});
