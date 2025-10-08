import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class WalletService {
  constructor(private readonly prisma: PrismaService) {}

  async getTransactions(userId: string) {
    return this.prisma.payment.findMany({
      where: {
        OR: [
          { order: { userId } },
          { membership: { userId } },
          { donation: { userId } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      include: {
        order: true,
        membership: true,
        donation: true,
      },
      take: 50,
    });
  }

  async getSummary(userId: string) {
    const [pending, confirmed] = await Promise.all([
      this.prisma.payment.aggregate({
        _sum: { amount: true },
        where: {
          status: 'pending',
          OR: [
            { order: { userId } },
            { membership: { userId } },
            { donation: { userId } },
          ],
        },
      }),
      this.prisma.payment.aggregate({
        _sum: { amount: true },
        where: {
          status: 'confirmed',
          OR: [
            { order: { userId } },
            { membership: { userId } },
            { donation: { userId } },
          ],
        },
      }),
    ]);

    return {
      pending: pending._sum.amount ?? 0,
      confirmed: confirmed._sum.amount ?? 0,
    };
  }
}
