import 'reflect-metadata';

jest.mock('@nestjs/common', () => {
  const actual = jest.requireActual('@nestjs/common');

  const createNoopDecorator = () =>
    (...args: unknown[]) => {
      if (args.length >= 2) {
        const [value, context] = args;
        if (typeof context === 'object' && context !== null && 'kind' in (context as Record<string, unknown>)) {
          return value;
        }
        return args[2];
      }

      return (value: unknown) => value;
    };

  return {
    ...actual,
    Controller: () => createNoopDecorator(),
    Get: () => createNoopDecorator(),
    Post: () => createNoopDecorator(),
    UseGuards: () => createNoopDecorator(),
    HttpCode: () => createNoopDecorator(),
    Req: () => createNoopDecorator(),
    Res: () => createNoopDecorator(),
    Query: () => createNoopDecorator(),
    Param: () => createNoopDecorator(),
    Body: () => createNoopDecorator(),
  };
});

import { AdminOrdersController } from './admin-orders.controller.js';

describe('AdminOrdersController', () => {
  const buildOrder = (overrides?: Partial<Record<string, unknown>>) => ({
    id: 'order-1',
    status: 'paid',
    user: { id: 'user-1', phoneMask: '+250***' },
    match: {
      id: 'match-1',
      opponent: 'APR',
      kickoff: new Date('2024-01-01T00:00:00Z'),
      venue: 'Amahoro',
      status: 'scheduled',
    },
    items: [],
    payments: [
      {
        id: 'payment-1',
        amount: 2000,
        metadata: {},
      },
    ],
    passes: [],
    ...overrides,
  });

  it('records an audit entry when refunding a ticket order', async () => {
    const beforeOrder = buildOrder();
    const afterOrder = buildOrder({ status: 'cancelled', payments: [{ id: 'payment-1', amount: 2000, metadata: {} }] });

    const ordersService = {
      getTicketOrder: jest.fn().mockResolvedValueOnce(beforeOrder).mockResolvedValueOnce(afterOrder),
      markTicketOrderRefunded: jest.fn().mockResolvedValue(afterOrder),
    };
    const auditService = {
      record: jest.fn().mockResolvedValue(undefined),
    };

    const controller = new AdminOrdersController(ordersService as any, auditService as any);

    const request = {
      adminUser: { id: 'admin-1' },
      adminPermissions: new Set(['ticket:order:refund']),
      ip: '127.0.0.1',
      headers: { 'user-agent': 'jest' },
    } as any;

    await controller.refundOrder('order-1', request);

    expect(auditService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        adminUserId: 'admin-1',
        action: 'ticket-order.refund',
        entityType: 'ticket_order',
        entityId: 'order-1',
      }),
    );
    expect(ordersService.markTicketOrderRefunded).toHaveBeenCalledWith('order-1', 'admin-1');
  });
});
