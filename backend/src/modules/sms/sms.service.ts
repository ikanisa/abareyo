import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { PrismaService } from '../../prisma/prisma.service.js';
import { PaymentsService } from '../payments/payments.service.js';
import { RealtimeService } from '../realtime/realtime.service.js';
import { SmsWebhookDto, SmsWebhookMeta } from './sms.dto.js';
import { SmsQueueService } from './sms.queue.js';
import { ManualSmsResolution } from '../admin/sms/dto/manual-dismiss.dto.js';
import type { Prisma } from '@prisma/client';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly webhookToken?: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly queue: SmsQueueService,
    private readonly realtime: RealtimeService,
    private readonly payments: PaymentsService,
  ) {
    this.webhookToken = this.configService.get<string>('sms.webhookToken');
  }

  validateWebhookToken(token?: string) {
    return Boolean(token && this.webhookToken && token === this.webhookToken);
  }

  async handleInboundSms(payload: SmsWebhookDto, meta: SmsWebhookMeta) {
    const receivedAt = payload.receivedAt ? new Date(payload.receivedAt) : new Date();

    const record = await this.prisma.smsRaw.create({
      data: {
        text: payload.text,
        fromMsisdn: payload.from ?? 'unknown',
        toMsisdn: payload.to ?? null,
        receivedAt,
        metadata: {
          modemId: meta.modemId,
          simSlot: meta.simSlot,
        },
        ingestStatus: 'received',
      },
    });

    this.logger.debug(`SMS stored (${record.id}) – queued for parsing`);
    await this.queue.enqueue({ smsId: record.id });

    this.realtime.notifySmsReceived({
      smsId: record.id,
      from: record.fromMsisdn,
      receivedAt: record.receivedAt.toISOString(),
    });
    return record.id;
  }

  async listRecentSms(limit = 50) {
    return this.prisma.smsRaw.findMany({
      orderBy: { receivedAt: 'desc' },
      take: limit,
      include: { parsed: true },
    });
  }

  async listManualReviewSms(limit = 50) {
    const items = await this.prisma.smsRaw.findMany({
      where: { ingestStatus: 'manual_review' },
      orderBy: { receivedAt: 'desc' },
      take: limit,
      include: { parsed: true },
    });

    return items.map((item) => ({
      ...item,
      parsed: item.parsed
        ? {
            ...item.parsed,
            confidence: Number(item.parsed.confidence),
          }
        : null,
    }));
  }

  async attachSmsToPayment(smsId: string, paymentId: string) {
    const result = await this.payments.attachSmsToPayment(paymentId, smsId);
    this.logger.log(`SMS ${smsId} manually attached to payment ${paymentId}`);
    return result;
  }

  async retryManualSms(smsId: string) {
    const sms = await this.prisma.smsRaw.findUnique({
      where: { id: smsId },
      include: { parsed: true },
    });
    if (!sms) {
      throw new NotFoundException('SMS not found');
    }

    const metadata =
      typeof sms.metadata === 'object' && sms.metadata !== null
        ? { ...(sms.metadata as Record<string, unknown>) }
        : {};
    if ('adminResolution' in metadata) {
      delete (metadata as Record<string, unknown>).adminResolution;
    }

    const updated = await this.prisma.smsRaw.update({
      where: { id: smsId },
      data: {
        ingestStatus: 'received',
        metadata: metadata as unknown as Prisma.InputJsonValue,
      },
      include: { parsed: true },
    });

    await this.queue.enqueue({ smsId }, { removeOnComplete: true });
    return updated;
  }

  async dismissManualSms({
    smsId,
    resolution,
    note,
    adminUserId,
  }: {
    smsId: string;
    resolution: ManualSmsResolution;
    note?: string;
    adminUserId: string | null;
  }) {
    const sms = await this.prisma.smsRaw.findUnique({
      where: { id: smsId },
      include: { parsed: true },
    });
    if (!sms) {
      throw new NotFoundException('SMS not found');
    }

    const metadata =
      typeof sms.metadata === 'object' && sms.metadata !== null
        ? { ...(sms.metadata as Record<string, unknown>) }
        : {};

    (metadata as Record<string, unknown>).adminResolution = {
      status: resolution,
      note: note ?? null,
      resolvedBy: adminUserId,
      resolvedAt: new Date().toISOString(),
    };

    const ingestStatus = resolution === ManualSmsResolution.LINKED_ELSEWHERE ? 'parsed' : 'error';

    const updated = await this.prisma.smsRaw.update({
      where: { id: smsId },
      data: {
        ingestStatus,
        metadata: metadata as unknown as Prisma.InputJsonValue,
      },
      include: { parsed: true },
    });

    return updated;
  }

  async getQueueOverview() {
    return this.queue.getOverview();
  }
}
