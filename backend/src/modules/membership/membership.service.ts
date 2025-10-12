import { Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { PrismaService } from '../../prisma/prisma.service.js';
import { MembershipUpgradeDto } from './dto/membership-upgrade.dto.js';

@Injectable()
export class MembershipService implements OnModuleInit {
  private readonly logger = new Logger(MembershipService.name);
  private readonly environment: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.environment = this.configService.get<string>('app.env', 'development');
  }

  onModuleInit() {
    const issues: string[] = [];
    const mtn = this.configService.get<string>('payments.mtnPayCode', '').trim();
    const airtel = this.configService.get<string>('payments.airtelPayCode', '').trim();

    if (!this.isValidShortcode(mtn)) {
      issues.push('MTN_MOMO_PAY_CODE');
    }
    if (!this.isValidShortcode(airtel)) {
      issues.push('AIRTEL_MONEY_PAY_CODE');
    }

    if (issues.length > 0) {
      const message = `Missing or invalid payment shortcode configuration: ${issues.join(', ')}`;
      if (this.environment === 'production') {
        throw new Error(message);
      }
      this.logger.warn(message);
    }
  }

  async listPlans() {
    return this.prisma.membershipPlan.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' },
    });
  }

  async getStatus(userId: string) {
    const membership = await this.prisma.membership.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { plan: true, payments: true },
    });

    if (!membership) {
      return null;
    }

    return membership;
  }

  async upgrade(dto: MembershipUpgradeDto) {
    const plan = await this.prisma.membershipPlan.findUnique({ where: { id: dto.planId } });
    if (!plan || !plan.isActive) {
      throw new NotFoundException('Membership plan not found');
    }

    // Ensure user exists (guest-first approach)
    await this.prisma.user.upsert({
      where: { id: dto.userId },
      update: {},
      create: {
        id: dto.userId,
        locale: 'rw',
      },
    });

    const existing = await this.prisma.membership.findFirst({
      where: {
        userId: dto.userId,
        planId: dto.planId,
        status: { in: ['pending', 'active'] },
      },
    });

    if (existing) {
      return {
        status: existing.status,
        membershipId: existing.id,
        message: existing.status === 'active' ? 'Membership already active' : 'Membership payment pending',
      };
    }

    const ussdCode = this.buildUssdString(dto.channel, plan.price);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    const membership = await this.prisma.membership.create({
      data: {
        userId: dto.userId,
        planId: dto.planId,
        status: 'pending',
        payments: {
          create: {
            kind: 'membership',
            amount: plan.price,
            status: 'pending',
          },
        },
      },
      include: { payments: true },
    });

    return {
      membershipId: membership.id,
      paymentId: membership.payments[0]?.id,
      plan,
      ussdCode,
      amount: plan.price,
      expiresAt: expiresAt.toISOString(),
    };
  }

  private buildUssdString(channel: 'mtn' | 'airtel', amount: number) {
    const payments = this.configService.get('payments');
    const shortcodeRaw = channel === 'airtel' ? payments.airtelPayCode : payments.mtnPayCode;
    const shortcode = this.isValidShortcode(shortcodeRaw) ? shortcodeRaw : '';
    const formattedAmount = Math.max(amount, 0);
    const hash = '%23';
    return `*182*1*${shortcode}*${formattedAmount}${hash}`;
  }

  private isValidShortcode(value: string | undefined | null) {
    return typeof value === 'string' && /^[0-9]{3,}$/u.test(value.trim());
  }
}
