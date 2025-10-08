import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { PrismaService } from '../../prisma/prisma.service.js';
import { RealtimeService } from '../realtime/realtime.service.js';
import { TicketsService } from '../tickets/tickets.service.js';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly confidenceThreshold: number;
  private readonly paymentInclude = {
    order: { include: { items: true } },
    membership: { include: { plan: true } },
    donation: { include: { project: true } },
    smsParsed: true,
  } as const;

  constructor(
    private readonly prisma: PrismaService,
    private readonly ticketsService: TicketsService,
    private readonly realtime: RealtimeService,
    private readonly configService: ConfigService,
  ) {
    const threshold = this.configService.get<number>('sms.parserConfidenceThreshold');
    this.confidenceThreshold = typeof threshold === 'number' && !Number.isNaN(threshold) ? threshold : 0.65;
  }

  async markPaymentAsConfirmed(paymentId: string) {
    const payment = await this.prisma.payment.update({
      where: { id: paymentId },
      data: { status: 'confirmed', confirmedAt: new Date() },
    });

    this.logger.log(`Payment ${paymentId} confirmed`);
    return payment;
  }

  async processParsedSms(smsParsedId: string) {
    const parsed = await this.prisma.smsParsed.findUnique({
      where: { id: smsParsedId },
    });

    if (!parsed) {
      this.logger.warn(`Parsed SMS ${smsParsedId} not found`);
      return { status: 'missing_parsed' as const };
    }

    const lowConfidence = this.isLowConfidence(parsed.confidence);

    const candidateOrder = (await this.prisma.payment.findFirst({
      where: {
        status: 'pending',
        smsParsedId: null,
        amount: parsed.amount,
        kind: 'ticket',
        order: { status: 'pending' },
      },
      orderBy: { createdAt: 'asc' },
      include: this.paymentInclude,
    })) as PaymentWithRelations | null;

    if (candidateOrder?.order) {
      return this.handleTicketMatch(candidateOrder, parsed, { lowConfidence });
    }

    const candidateMembership = (await this.prisma.payment.findFirst({
      where: {
        status: 'pending',
        smsParsedId: null,
        amount: parsed.amount,
        kind: 'membership',
        membership: { status: 'pending' },
      },
      orderBy: { createdAt: 'asc' },
      include: this.paymentInclude,
    })) as PaymentWithRelations | null;

    if (candidateMembership?.membership) {
      return this.handleMembershipMatch(candidateMembership, parsed, { lowConfidence });
    }

    const candidateShop = (await this.prisma.payment.findFirst({
      where: {
        status: 'pending',
        smsParsedId: null,
        amount: parsed.amount,
        kind: 'shop',
        order: { status: 'pending' },
      },
      orderBy: { createdAt: 'asc' },
      include: this.paymentInclude,
    })) as PaymentWithRelations | null;

    if (candidateShop?.order) {
      return this.handleShopMatch(candidateShop, parsed, { lowConfidence });
    }

    const candidateDonation = (await this.prisma.payment.findFirst({
      where: {
        status: 'pending',
        smsParsedId: null,
        amount: parsed.amount,
        kind: 'donation',
        donation: { status: 'pending' },
      },
      orderBy: { createdAt: 'asc' },
      include: this.paymentInclude,
    })) as PaymentWithRelations | null;

    if (candidateDonation?.donation) {
      return this.handleDonationMatch(candidateDonation, parsed, { lowConfidence });
    }

    if (lowConfidence) {
      this.logger.warn(
        `Low confidence (${Number(parsed.confidence ?? 0)}) for SMS ${parsed.id}; manual review required despite no direct match`,
      );
      const manualRecord = await this.createManualReviewRecord(parsed, 'low_confidence');
      return {
        status: 'manual_review' as const,
        reason: 'low_confidence' as const,
        manualPaymentId: manualRecord.id,
      };
    }

    this.logger.warn(
      `No pending entity matched amount RWF ${parsed.amount} for SMS ${parsed.id}; routing to manual review`,
    );
    const manualRecord = await this.createManualReviewRecord(parsed, 'no_match');
    return { status: 'manual_review' as const, reason: 'no_match' as const, manualPaymentId: manualRecord.id };
  }

  private async handleTicketMatch(
    payment: PaymentWithRelations,
    parsed: { id: string; amount: number; currency: string; ref: string; confidence?: unknown },
    options?: { lowConfidence?: boolean },
  ) {
    if (options?.lowConfidence) {
      const updated = await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'manual_review',
          smsParsedId: parsed.id,
          metadata: {
            ...(payment.metadata ?? {}),
            ref: parsed.ref,
            manualReason: 'low_confidence',
          },
        },
        include: this.paymentInclude,
      });

      await this.prisma.smsParsed.update({
        where: { id: parsed.id },
        data: { matchedEntity: `candidate:order:${updated.order?.id ?? 'unknown'}` },
      });

      this.realtime.notifyPaymentForManualReview({
        smsParsedId: parsed.id,
        amount: updated.amount,
      });

      return {
        status: 'manual_review' as const,
        reason: 'low_confidence' as const,
        paymentId: updated.id,
      };
    }

    return this.confirmTicketPayment(payment, parsed);
  }

  private async confirmTicketPayment(
    payment: PaymentWithRelations,
    parsed: { id: string; amount: number; currency: string; ref: string },
  ) {
    const updatedPayment = await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'confirmed',
        smsParsedId: parsed.id,
        confirmedAt: new Date(),
        metadata: {
          ...(payment.metadata ?? {}),
          ref: parsed.ref,
        },
      },
      include: this.paymentInclude,
    });

    const orderId = payment.order?.id ?? payment.orderId;
    if (!orderId) {
      throw new BadRequestException('Ticket payment missing order context');
    }

    await this.prisma.ticketOrder.update({
      where: { id: orderId },
      data: {
        status: 'paid',
        smsRef: parsed.ref,
      },
    });

    await this.ticketsService.issuePassesForOrder(orderId);
    const passRecords = await this.prisma.ticketPass.findMany({
      where: { orderId },
      select: { id: true, zone: true },
    });

    await this.prisma.smsParsed.update({
      where: { id: parsed.id },
      data: { matchedEntity: `order:${orderId}` },
    });

    this.logger.log(`Order ${orderId} confirmed via SMS ${parsed.id}`);

    this.realtime.notifyTicketOrderConfirmed({
      orderId,
      paymentId: updatedPayment.id,
      passes: passRecords.map((record) => ({ passId: record.id, zone: record.zone })),
    });

    return {
      status: 'confirmed' as const,
      paymentId: updatedPayment.id,
      orderId,
      passes: passRecords,
    };
  }

  private async handleMembershipMatch(
    payment: PaymentWithRelations,
    parsed: { id: string; currency: string; ref: string; confidence?: unknown },
    options?: { lowConfidence?: boolean },
  ) {
    if (options?.lowConfidence) {
      const updated = await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'manual_review',
          smsParsedId: parsed.id,
          metadata: {
            ...(payment.metadata ?? {}),
            ref: parsed.ref,
            manualReason: 'low_confidence',
          },
        },
        include: this.paymentInclude,
      });

      await this.prisma.smsParsed.update({
        where: { id: parsed.id },
        data: { matchedEntity: `candidate:membership:${updated.membership?.id ?? 'unknown'}` },
      });

      this.realtime.notifyPaymentForManualReview({
        smsParsedId: parsed.id,
        amount: updated.amount,
      });

      return {
        status: 'manual_review' as const,
        reason: 'low_confidence' as const,
        paymentId: updated.id,
      };
    }

    return this.confirmMembershipPayment(payment, parsed);
  }

  private async confirmMembershipPayment(
    payment: PaymentWithRelations,
    parsed: { id: string; currency: string; ref: string },
  ) {
    const updatedPayment = await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'confirmed',
        smsParsedId: parsed.id,
        confirmedAt: new Date(),
        metadata: {
          ...(payment.metadata ?? {}),
          ref: parsed.ref,
        },
      },
      include: this.paymentInclude,
    });

    const membership = updatedPayment.membership!;

    const start = new Date();
    const expire = new Date(start.getTime() + 365 * 24 * 60 * 60 * 1000);

    await this.prisma.membership.update({
      where: { id: membership.id },
      data: {
        status: 'active',
        startedAt: start,
        expiresAt: expire,
      },
    });

    await this.prisma.smsParsed.update({
      where: { id: parsed.id },
      data: { matchedEntity: `membership:${membership.id}` },
    });

    this.logger.log(`Membership ${membership.id} activated via SMS ${parsed.id}`);

    this.realtime.notifyMembershipActivated({
      membershipId: membership.id,
      validUntil: expire.toISOString(),
    });

    return {
      status: 'confirmed' as const,
      paymentId: updatedPayment.id,
      membershipId: membership.id,
      validUntil: expire.toISOString(),
    };
  }

  private async handleShopMatch(
    payment: PaymentWithRelations,
    parsed: { id: string; currency: string; ref: string; confidence?: unknown },
    options?: { lowConfidence?: boolean },
  ) {
    if (options?.lowConfidence) {
      const updated = await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'manual_review',
          smsParsedId: parsed.id,
          metadata: {
            ...(payment.metadata ?? {}),
            ref: parsed.ref,
            manualReason: 'low_confidence',
          },
        },
        include: this.paymentInclude,
      });

      await this.prisma.smsParsed.update({
        where: { id: parsed.id },
        data: { matchedEntity: `candidate:order:${updated.order?.id ?? 'unknown'}` },
      });

      this.realtime.notifyPaymentForManualReview({
        smsParsedId: parsed.id,
        amount: updated.amount,
      });

      return {
        status: 'manual_review' as const,
        reason: 'low_confidence' as const,
        paymentId: updated.id,
      };
    }

    return this.confirmShopPayment(payment, parsed);
  }

  private async confirmShopPayment(
    payment: PaymentWithRelations,
    parsed: { id: string; currency: string; ref: string },
  ) {
    const updatedPayment = await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'confirmed',
        smsParsedId: parsed.id,
        confirmedAt: new Date(),
        metadata: {
          ...(payment.metadata ?? {}),
          ref: parsed.ref,
        },
      },
      include: this.paymentInclude,
    });

    const orderId = payment.order?.id ?? payment.orderId;
    if (!orderId) {
      throw new BadRequestException('Shop payment missing order context');
    }

    await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'confirmed',
      },
    });

    await this.prisma.smsParsed.update({
      where: { id: parsed.id },
      data: { matchedEntity: `order:${orderId}` },
    });

    this.logger.log(`Shop order ${orderId} confirmed via SMS ${parsed.id}`);

    this.realtime.notifyShopOrderConfirmed({
      orderId,
      paymentId: updatedPayment.id,
    });

    return {
      status: 'confirmed' as const,
      paymentId: updatedPayment.id,
      orderId,
    };
  }

  private async handleDonationMatch(
    payment: PaymentWithRelations,
    parsed: { id: string; currency: string; ref: string; confidence?: unknown },
    options?: { lowConfidence?: boolean },
  ) {
    if (options?.lowConfidence) {
      const updated = await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'manual_review',
          smsParsedId: parsed.id,
          metadata: {
            ...(payment.metadata ?? {}),
            ref: parsed.ref,
            manualReason: 'low_confidence',
          },
        },
        include: this.paymentInclude,
      });

      await this.prisma.smsParsed.update({
        where: { id: parsed.id },
        data: { matchedEntity: `candidate:donation:${updated.donation?.id ?? 'unknown'}` },
      });

      this.realtime.notifyPaymentForManualReview({
        smsParsedId: parsed.id,
        amount: updated.amount,
      });

      return {
        status: 'manual_review' as const,
        reason: 'low_confidence' as const,
        paymentId: updated.id,
      };
    }

    return this.confirmDonationPayment(payment, parsed);
  }

  private async confirmDonationPayment(
    payment: PaymentWithRelations,
    parsed: { id: string; currency: string; ref: string },
  ) {
    const updatedPayment = await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'confirmed',
        smsParsedId: parsed.id,
        confirmedAt: new Date(),
        metadata: {
          ...(payment.metadata ?? {}),
          ref: parsed.ref,
        },
      },
      include: this.paymentInclude,
    });

    const donation = updatedPayment.donation!;

    await this.prisma.fundDonation.update({
      where: { id: donation.id },
      data: {
        status: 'confirmed',
      },
    });

    await this.prisma.smsParsed.update({
      where: { id: parsed.id },
      data: { matchedEntity: `donation:${donation.id}` },
    });

    this.logger.log(`Fundraising donation ${donation.id} confirmed via SMS ${parsed.id}`);

    this.realtime.notifyDonationConfirmed({
      donationId: donation.id,
      paymentId: updatedPayment.id,
    });

    return {
      status: 'confirmed' as const,
      paymentId: updatedPayment.id,
      donationId: donation.id,
    };
  }

  async listManualReviewPayments(limit = 50) {
    const payments = await this.prisma.payment.findMany({
      where: { status: 'manual_review' },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: this.paymentInclude,
    });

    return payments.map((payment) => ({
      ...payment,
      smsParsed: payment.smsParsed
        ? {
            ...payment.smsParsed,
            confidence: Number(payment.smsParsed.confidence ?? 0),
          }
        : null,
    })) as PaymentWithRelations[];
  }

  async attachSmsToPayment(paymentId: string, smsId: string) {
    const sms = await this.prisma.smsRaw.findUnique({
      where: { id: smsId },
      include: { parsed: true },
    });

    if (!sms) {
      throw new NotFoundException('SMS not found');
    }

    if (!sms.parsed) {
      throw new BadRequestException('SMS has no parsed payload to attach');
    }

    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: this.paymentInclude,
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.status === 'confirmed') {
      throw new BadRequestException('Payment already confirmed');
    }

    if (payment.smsParsedId && payment.smsParsedId !== sms.parsed.id) {
      throw new BadRequestException('Payment is linked to a different SMS');
    }

    const paymentWithRelations = payment as PaymentWithRelations;

    let result;
    switch (payment.kind) {
      case 'ticket':
        if (!payment.order) {
          throw new BadRequestException('Ticket payment missing order context');
        }
        result = await this.confirmTicketPayment(paymentWithRelations, sms.parsed);
        break;
      case 'membership':
        if (!payment.membership) {
          throw new BadRequestException('Membership payment missing membership data');
        }
        result = await this.confirmMembershipPayment(paymentWithRelations, sms.parsed);
        break;
      case 'shop':
        if (!payment.order) {
          throw new BadRequestException('Shop payment missing order context');
        }
        result = await this.confirmShopPayment(paymentWithRelations, sms.parsed);
        break;
      case 'donation':
        if (!payment.donation) {
          throw new BadRequestException('Donation payment missing donation record');
        }
        result = await this.confirmDonationPayment(paymentWithRelations, sms.parsed);
        break;
      default:
        throw new BadRequestException(`Unsupported payment kind ${payment.kind}`);
    }

    await this.prisma.smsRaw.update({
      where: { id: sms.id },
      data: { ingestStatus: 'parsed' },
    });

    return result;
  }

  private isLowConfidence(value: unknown) {
    const numeric = Number(value ?? 0);
    return Number.isFinite(numeric) && numeric < this.confidenceThreshold;
  }

  private async createManualReviewRecord(
    parsed: { id: string; amount: number; currency: string; ref: string },
    reason: 'no_match' | 'low_confidence',
  ) {
    const manualPayment = await this.prisma.payment.create({
      data: {
        kind: 'ticket',
        amount: parsed.amount,
        currency: parsed.currency,
        status: 'manual_review',
        smsParsedId: parsed.id,
        metadata: { ref: parsed.ref, manualReason: reason },
      },
    });

    await this.prisma.smsParsed.update({
      where: { id: parsed.id },
      data: { matchedEntity: null },
    });

    this.realtime.notifyPaymentForManualReview({
      smsParsedId: parsed.id,
      amount: manualPayment.amount,
    });

    return manualPayment;
  }
}

type PaymentWithRelations = {
  id: string;
  amount: number;
  currency: string;
  kind: 'ticket' | 'membership' | 'shop' | 'donation';
  status: string;
  smsParsedId: string | null;
  metadata: Record<string, unknown> | null;
  orderId?: string | null;
  membershipId?: string | null;
  donationId?: string | null;
  order?: { id: string } | null;
  membership?: { id: string } | null;
  donation?: { id: string } | null;
  smsParsed?: { id: string; confidence?: number; ref?: string } | null;
};
