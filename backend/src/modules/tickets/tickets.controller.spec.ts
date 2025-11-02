import { Test, TestingModule } from '@nestjs/testing';
import { FastifyRequest } from 'fastify';

import { TicketsController } from './tickets.controller.js';
import { TicketsService } from './tickets.service.js';

const createMockRequest = (userId: string) => ({
  adminUser: { id: userId },
  adminPermissions: new Set(['ticket:order:view']),
  adminSession: { id: 'session', expiresAt: new Date().toISOString() },
}) as unknown as FastifyRequest;

describe('TicketsController', () => {
  let controller: TicketsController;
  const ticketsService = {
    createPendingOrder: jest.fn(),
    listOrdersForUser: jest.fn(),
    getOrderReceipt: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TicketsController],
      providers: [
        { provide: TicketsService, useValue: ticketsService },
      ],
    }).compile();

    controller = module.get(TicketsController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('creates checkout order', async () => {
    ticketsService.createPendingOrder = jest.fn().mockResolvedValue({ orderId: 'order-1' });
    const payload = { matchId: 'match-1', items: [], channel: 'mtn' } as any;
    const result = await controller.checkout(payload);

    expect(ticketsService.createPendingOrder).toHaveBeenCalledWith(payload);
    expect(result).toEqual({ data: { orderId: 'order-1' } });
  });

  it('lists user orders', async () => {
    ticketsService.listOrdersForUser = jest.fn().mockResolvedValue([{ id: 'order-1' }]);

    const result = await controller.listOrders('user-1');

    expect(ticketsService.listOrdersForUser).toHaveBeenCalledWith('user-1');
    expect(result).toEqual({ data: [{ id: 'order-1' }] });
  });

  it('returns receipt', async () => {
    ticketsService.getOrderReceipt = jest.fn().mockResolvedValue({ id: 'order-1', total: 1000 });

    const result = await controller.orderReceipt('order-1', 'user-1');

    expect(ticketsService.getOrderReceipt).toHaveBeenCalledWith('order-1', 'user-1');
    expect(result.data.total).toBe(1000);
  });
});
