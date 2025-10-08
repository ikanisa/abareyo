import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue, Worker, QueueEvents, JobsOptions, Job } from 'bullmq';

import { PrismaService } from '../../prisma/prisma.service.js';
import { PaymentsService } from '../payments/payments.service.js';
import { RealtimeService } from '../realtime/realtime.service.js';
import { SmsParserService } from './sms.parser.js';

export interface SmsParseJob {
  smsId: string;
}

@Injectable()
export class SmsQueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SmsQueueService.name);
  private queue!: Queue<SmsParseJob>;
  private worker?: Worker<SmsParseJob>;
  private events?: QueueEvents;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly parser: SmsParserService,
    private readonly payments: PaymentsService,
    private readonly realtime: RealtimeService,
  ) {}

  onModuleInit() {
    const connection = { url: this.configService.get<string>('redis.url') ?? 'redis://localhost:6379' };
    this.queue = new Queue<SmsParseJob>('sms-parse', { connection });
    this.events = new QueueEvents('sms-parse', { connection });

    this.worker = new Worker<SmsParseJob>('sms-parse', (job) => this.handleJob(job), {
      connection,
      concurrency: 2,
    });

    this.worker.on('failed', (job, err) => {
      this.logger.error(`SMS parse job failed ${job?.id}`, err);
    });

    this.events.on('completed', ({ jobId }) => this.logger.debug(`SMS parse job completed ${jobId}`));

    this.logger.log('SMS parser queue initialized');
  }

  async enqueue(job: SmsParseJob, options?: JobsOptions) {
    if (!this.queue) {
      this.logger.warn('Queue not initialised yet');
      return;
    }
    await this.queue.add('parse', job, { attempts: 3, backoff: { type: 'exponential', delay: 2000 }, ...options });
  }

  private async handleJob(job: Job<SmsParseJob>) {
    const sms = await this.prisma.smsRaw.findUnique({ where: { id: job.data.smsId } });
    if (!sms) {
      this.logger.warn(`SMS ${job.data.smsId} missing`);
      return;
    }

    try {
      const parsed = await this.parser.parse({
        id: sms.id,
        text: sms.text,
        fromMsisdn: sms.fromMsisdn,
        toMsisdn: sms.toMsisdn,
      });
      if (!parsed) {
        await this.prisma.smsRaw.update({
          where: { id: sms.id },
          data: { ingestStatus: 'error' },
        });
        this.logger.warn(`SMS ${sms.id} could not be parsed`);
        return;
      }

      const parsedRecord = await this.prisma.smsParsed.upsert({
        where: { smsId: sms.id },
        update: {
          amount: parsed.amount,
          currency: parsed.currency,
          payerMask: parsed.payerMask,
          ref: parsed.ref,
          timestamp: parsed.timestamp ? new Date(parsed.timestamp) : new Date(),
          confidence: parsed.confidence,
          parserVersion: parsed.parserVersion,
        },
        create: {
          smsId: sms.id,
          amount: parsed.amount,
          currency: parsed.currency,
          payerMask: parsed.payerMask,
          ref: parsed.ref,
          timestamp: parsed.timestamp ? new Date(parsed.timestamp) : new Date(),
          confidence: parsed.confidence,
          parserVersion: parsed.parserVersion,
        },
      });

      this.realtime.notifySmsParsed({
        smsId: sms.id,
        parsedId: parsedRecord.id,
        amount: parsedRecord.amount,
        confidence: Number(parsedRecord.confidence),
      });

      const outcome = await this.payments.processParsedSms(parsedRecord.id);

      if (outcome.status === 'manual_review') {
        await this.prisma.smsRaw.update({
          where: { id: sms.id },
          data: { ingestStatus: 'manual_review' },
        });
      } else if (outcome.status === 'confirmed') {
        await this.prisma.smsRaw.update({
          where: { id: sms.id },
          data: { ingestStatus: 'parsed' },
        });
      } else if (outcome.status === 'missing_parsed') {
        await this.prisma.smsRaw.update({
          where: { id: sms.id },
          data: { ingestStatus: 'error' },
        });
      }
    } catch (error) {
      this.logger.error(`Failed to process SMS ${sms.id}`, error as Error);
      await this.prisma.smsRaw.update({
        where: { id: sms.id },
        data: { ingestStatus: 'error' },
      });
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.worker?.close();
    await this.events?.close();
    await this.queue?.close();
  }
}
