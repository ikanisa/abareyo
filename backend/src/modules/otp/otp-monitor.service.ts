import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { OtpAbuseService, type OtpBlacklistEntry } from './otp-abuse.service.js';
import { OtpStore } from './otp.store.js';

const EVENT_LIMIT = 100;

export type OtpSendEvent = {
  kind: 'send';
  phoneHash: string;
  channel: string;
  locale?: string;
  ip?: string | null;
  status: 'delivered' | 'rate_limited' | 'blocked' | 'error';
  reason?: string;
  templateApproved: boolean;
};

export type OtpVerifyEvent = {
  kind: 'verify';
  phoneHash: string;
  ip?: string | null;
  status: 'success' | 'failed' | 'expired' | 'locked';
  reason?: string;
};

export type OtpDashboardSummary = {
  summary: {
    sent: number;
    delivered: number;
    blocked: number;
    rateLimited: number;
    verified: number;
    failed: number;
  };
  redis: ReturnType<OtpStore['getRedisStatus']>;
  template: {
    name: string;
    namespace: string;
    locale: string;
    approved: boolean;
    rateLimitApproval?: string;
  };
  rateLimits: {
    windowSeconds: number;
    maxPerPhone: number;
    maxPerIp: number;
    cooldownSeconds: number;
    verifyWindowSeconds: number;
    maxVerifyAttempts: number;
  };
  events: Array<
    (OtpSendEvent | OtpVerifyEvent) & {
      occurredAt: string;
    }
  >;
  blacklist: {
    phone: OtpBlacklistEntry[];
    ip: OtpBlacklistEntry[];
  };
};

@Injectable()
export class OtpMonitorService {
  private readonly counters = new Map<string, number>();

  constructor(
    private readonly store: OtpStore,
    private readonly abuseService: OtpAbuseService,
    private readonly configService: ConfigService,
  ) {}

  async recordSend(event: OtpSendEvent) {
    this.increment('sent');
    if (event.status === 'delivered') {
      this.increment('delivered');
    }
    if (event.status === 'blocked') {
      this.increment('blocked');
    }
    if (event.status === 'rate_limited') {
      this.increment('rateLimited');
    }

    await this.store.pushEvent({ ...event, kind: 'send' }, EVENT_LIMIT);
  }

  async recordVerification(event: OtpVerifyEvent) {
    if (event.status === 'success') {
      this.increment('verified');
    } else {
      this.increment('failed');
    }
    await this.store.pushEvent({ ...event, kind: 'verify' }, EVENT_LIMIT);
  }

  async getDashboard(): Promise<OtpDashboardSummary> {
    const redis = this.store.getRedisStatus();
    const template = {
      name: this.configService.get<string>('otp.whatsappTemplate.name', 'fan_otp'),
      namespace: this.configService.get<string>('otp.whatsappTemplate.namespace', ''),
      locale: this.configService.get<string>('otp.whatsappTemplate.locale', 'en'),
      approved: Boolean(this.configService.get<boolean>('otp.whatsappTemplate.approved', false)),
      rateLimitApproval: this.configService.get<string>('otp.whatsappTemplate.rateLimitApproval') ?? undefined,
    };
    const rateLimits = {
      windowSeconds: this.configService.get<number>('otp.rateLimits.windowSeconds', 900) ?? 900,
      maxPerPhone: this.configService.get<number>('otp.rateLimits.maxPerPhone', 5) ?? 5,
      maxPerIp: this.configService.get<number>('otp.rateLimits.maxPerIp', 15) ?? 15,
      cooldownSeconds: this.configService.get<number>('otp.rateLimits.cooldownSeconds', 60) ?? 60,
      verifyWindowSeconds: this.configService.get<number>('otp.rateLimits.verifyWindowSeconds', 900) ?? 900,
      maxVerifyAttempts: this.configService.get<number>('otp.rateLimits.maxVerifyAttempts', 5) ?? 5,
    };

    const eventsRaw = await this.store.listEvents(EVENT_LIMIT);
    const events = eventsRaw.map((entry) => ({
      ...(entry as Record<string, unknown>),
      occurredAt: new Date((entry as { timestamp?: number }).timestamp ?? Date.now()).toISOString(),
    })) as OtpDashboardSummary['events'];

    const [phone, ip] = await Promise.all([
      this.abuseService.listPhoneBlacklist(),
      this.abuseService.listIpBlacklist(),
    ]);

    return {
      summary: {
        sent: this.getCounter('sent'),
        delivered: this.getCounter('delivered'),
        blocked: this.getCounter('blocked'),
        rateLimited: this.getCounter('rateLimited'),
        verified: this.getCounter('verified'),
        failed: this.getCounter('failed'),
      },
      redis,
      template,
      rateLimits,
      events,
      blacklist: { phone, ip },
    };
  }

  private increment(key: string, amount = 1) {
    const current = this.counters.get(key) ?? 0;
    this.counters.set(key, current + amount);
  }

  private getCounter(key: string) {
    return this.counters.get(key) ?? 0;
  }
}
