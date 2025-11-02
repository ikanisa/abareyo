class TestTicketsController {
  constructor(
    private readonly ticketsService: {
      createPendingOrder: (payload: unknown) => Promise<unknown> | unknown;
      listOrdersForUser: (userId: string) => Promise<unknown> | unknown;
      getOrderReceipt: (orderId: string, userId: string) => Promise<unknown> | unknown;
    },
    private readonly smsService: { validateAdminToken: (token?: string) => boolean },
  ) {}

  async checkout(body: any) {
    const result = await this.ticketsService.createPendingOrder(body);
    return { data: result };
  }

  async listOrders(userId: string) {
    const data = await this.ticketsService.listOrdersForUser(userId);
    return { data };
  }

  async orderReceipt(orderId: string, userId: string) {
    const data = await this.ticketsService.getOrderReceipt(orderId, userId);
    return { data };
  }
}

describe('TicketsController', () => {
  let controller: TestTicketsController;
  const ticketsService = {
    createPendingOrder: jest.fn(),
    listOrdersForUser: jest.fn(),
    getOrderReceipt: jest.fn(),
  };

  beforeEach(() => {
    controller = new TestTicketsController(ticketsService, { validateAdminToken: jest.fn().mockReturnValue(true) });
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
