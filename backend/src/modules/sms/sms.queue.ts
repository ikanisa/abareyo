import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue, Worker, QueueEvents, JobsOptions, Job } from 'bullmq';

import { PrismaService } from '../../prisma/prisma.service.js';
import { PaymentsService } from '../payments/payments.service.js';
import { RealtimeService } from '../realtime/realtime.service.js';
import { SmsParserService } from './sms.parser.js';
import { MetricsService } from '../metrics/metrics.service.js';

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
    private readonly metrics: MetricsService,
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
    void this.refreshQueueDepth();
  }

  async enqueue(job: SmsParseJob, options?: JobsOptions) {
    if (!this.queue) {
      this.logger.warn('Queue not initialised yet');
      return;
    }
    await this.queue.add('parse', job, { attempts: 3, backoff: { type: 'exponential', delay: 2000 }, ...options });
    await this.refreshQueueDepth();
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
    } finally {
      await this.refreshQueueDepth();
    }
  }

  async onModuleDestroy() {
    await this.worker?.close();
    await this.events?.close();
    await this.queue?.close();
    this.metrics.setSmsQueueDepth('sms-parse', 0);
  }

  private async refreshQueueDepth() {
    if (!this.queue) {
      return;
    }
    try {
      const waiting = await this.queue.getWaitingCount();
      const delayed = await this.queue.getDelayedCount();
      this.metrics.setSmsQueueDepth('sms-parse', waiting + delayed);
    } catch (error) {
      this.logger.debug(`Failed to compute queue depth: ${(error as Error).message}`);
    }
  }

  async getOverview(limit = 20) {
    if (!this.queue) {
      return { waiting: 0, delayed: 0, active: 0, pending: [] as Array<Record<string, unknown>> };
    }

    const [waiting, delayed, active] = await Promise.all([
      this.queue.getWaitingCount(),
      this.queue.getDelayedCount(),
      this.queue.getActiveCount(),
    ]);

    const jobs = await this.queue.getJobs(['waiting', 'delayed'], 0, Math.max(limit - 1, 0));
    const states = await Promise.all(jobs.map((job) => job.getState()));

    const pending = jobs.map((job, index) => ({
      jobId: job.id ?? '',
      smsId: job.data.smsId,
      attemptsMade: job.attemptsMade,
      maxAttempts: job.opts.attempts ?? 3,
      state: states[index],
      enqueuedAt: new Date(job.timestamp).toISOString(),
      lastFailedReason: job.failedReason ?? null,
    }));

    return { waiting, delayed, active, pending };
  }
}
