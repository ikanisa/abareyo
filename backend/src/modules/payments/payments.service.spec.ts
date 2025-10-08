import { PaymentsService } from './payments.service';
import type { PrismaService } from '../../prisma/prisma.service';
import type { TicketsService } from '../tickets/tickets.service';
import type { RealtimeService } from '../realtime/realtime.service';
import type { ConfigService } from '@nestjs/config';

describe('PaymentsService – processParsedSms', () => {
  const createService = () => {
    const prismaMock = {
      payment: {
        findFirst: jest.fn(),
        update: jest.fn(),
        create: jest.fn(),
        findUnique: jest.fn(),
      },
      smsParsed: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      ticketOrder: {
        update: jest.fn(),
      },
      ticketPass: {
        findMany: jest.fn(),
      },
      order: {
        update: jest.fn(),
      },
      fundDonation: {
        update: jest.fn(),
      },
      membership: {
        update: jest.fn(),
      },
      smsRaw: {
        update: jest.fn(),
        findUnique: jest.fn(),
      },
    } as unknown as PrismaService;

    const ticketsServiceMock = {
      issuePassesForOrder: jest.fn().mockResolvedValue([]),
    } as unknown as TicketsService;

    const realtimeMock = {
      notifyTicketOrderConfirmed: jest.fn(),
      notifyGateScan: jest.fn(),
      notifyMembershipActivated: jest.fn(),
      notifyShopOrderConfirmed: jest.fn(),
      notifyDonationConfirmed: jest.fn(),
      notifyPaymentForManualReview: jest.fn(),
    } as unknown as RealtimeService;

    const configMock = {
      get: jest.fn((key: string) => (key === 'sms.parserConfidenceThreshold' ? 0.65 : undefined)),
    } as unknown as ConfigService;

    const service = new PaymentsService(prismaMock, ticketsServiceMock, realtimeMock, configMock);

    return {
      service,
      prismaMock,
      ticketsServiceMock,
      realtimeMock,
    };
  };

  it('confirms ticket payments when confidence is high and a pending order matches', async () => {
    const { service, prismaMock, ticketsServiceMock, realtimeMock } = createService();

    const parsedId = 'parsed-1';
    (prismaMock.smsParsed.findUnique as jest.Mock).mockResolvedValue({
      id: parsedId,
      amount: 1000,
      currency: 'RWF',
      confidence: 0.9,
      ref: 'RS-123',
    });

    const candidatePayment = {
      id: 'pay-1',
      amount: 1000,
      currency: 'RWF',
      kind: 'ticket',
      status: 'pending',
      smsParsedId: null,
      metadata: null,
      orderId: 'order-1',
      order: { id: 'order-1' },
    };

    (prismaMock.payment.findFirst as jest.Mock)
      .mockResolvedValueOnce(candidatePayment)
      .mockResolvedValue(null);

    (prismaMock.payment.update as jest.Mock).mockResolvedValue({
      ...candidatePayment,
      status: 'confirmed',
    });

    (prismaMock.ticketPass.findMany as jest.Mock).mockResolvedValue([{ id: 'pass-1', zone: 'VIP' }]);

    const result = await service.processParsedSms(parsedId);

    expect(result).toMatchObject({ status: 'confirmed', orderId: 'order-1' });
    expect(prismaMock.ticketOrder.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'order-1' } }),
    );
    expect(ticketsServiceMock.issuePassesForOrder).toHaveBeenCalledWith('order-1');
    expect(realtimeMock.notifyTicketOrderConfirmed).toHaveBeenCalledWith(
      expect.objectContaining({ orderId: 'order-1' }),
    );
  });

  it('routes to manual review when confidence is below the threshold', async () => {
    const { service, prismaMock, realtimeMock } = createService();

    const parsedId = 'parsed-low';
    (prismaMock.smsParsed.findUnique as jest.Mock).mockResolvedValue({
      id: parsedId,
      amount: 5000,
      currency: 'RWF',
      confidence: 0.2,
      ref: 'RS-LOW',
    });

    (prismaMock.payment.findFirst as jest.Mock).mockResolvedValue(null);

    (prismaMock.payment.create as jest.Mock).mockResolvedValue({
      id: 'manual-1',
      amount: 5000,
      currency: 'RWF',
    });

    const result = await service.processParsedSms(parsedId);

    expect(result).toMatchObject({ status: 'manual_review', reason: 'low_confidence' });
    expect(prismaMock.payment.create).toHaveBeenCalled();
    expect(realtimeMock.notifyPaymentForManualReview).toHaveBeenCalledWith(
      expect.objectContaining({ smsParsedId: parsedId }),
    );
  });
});
