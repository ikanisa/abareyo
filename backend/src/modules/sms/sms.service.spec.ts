import { Prisma } from '@prisma/client';

import { SmsService } from './sms.service';

describe('SmsService', () => {
  const createService = () => {
    const configService = {
      get: jest.fn((key: string) => {
        if (key === 'sms.webhookToken') return 'hook-token';
        if (key === 'redis.url') return undefined;
        return undefined;
      }),
    };
    const prisma = {
      smsRaw: {
        findMany: jest.fn(),
      },
    };
    const queue = {
      enqueue: jest.fn(),
    };
    const realtime = {
      notifySmsReceived: jest.fn(),
      notifySmsParsed: jest.fn(),
    };
    const payments = {
      attachSmsToPayment: jest.fn(),
    };

    const service = new SmsService(
      configService as any,
      prisma as any,
      queue as any,
      realtime as any,
      payments as any,
    );

    return { service, prisma, payments };
  };

  describe('listManualReviewSms', () => {
    it('normalizes parsed confidence and limits results', async () => {
      const { service, prisma } = createService();
      const records = [
        {
          id: 'sms-1',
          receivedAt: new Date(),
          ingestStatus: 'manual_review',
          parsed: {
            id: 'parsed-1',
            confidence: 0.73 as unknown as Prisma.Decimal,
          },
        },
        {
          id: 'sms-2',
          receivedAt: new Date(),
          ingestStatus: 'manual_review',
          parsed: null,
        },
      ];
      (prisma.smsRaw.findMany as jest.Mock).mockResolvedValue(records);

      const result = await service.listManualReviewSms(25);

      expect(prisma.smsRaw.findMany).toHaveBeenCalledWith({
        where: { ingestStatus: 'manual_review' },
        orderBy: { receivedAt: 'desc' },
        take: 25,
        include: { parsed: true },
      });
      expect(result[0].parsed?.confidence).toBeCloseTo(0.73);
      expect(typeof result[0].parsed?.confidence).toBe('number');
      expect(result[1].parsed).toBeNull();
    });
  });

  describe('attachSmsToPayment', () => {
    it('delegates to payments service and returns outcome', async () => {
      const { service, payments } = createService();
      (payments.attachSmsToPayment as jest.Mock).mockResolvedValue({ status: 'ok' });

      const response = await service.attachSmsToPayment('sms-123', 'payment-456');

      expect(payments.attachSmsToPayment).toHaveBeenCalledWith('payment-456', 'sms-123');
      expect(response).toEqual({ status: 'ok' });
    });
  });
});
