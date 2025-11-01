export type OtpBlacklistEntry = {
  value: string;
  masked: string;
  source: 'config' | 'runtime';
  note?: string | null;
};

export type OtpSendEvent = {
  kind: 'send';
  occurredAt: string;
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
  occurredAt: string;
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
  redis: {
    healthy: boolean;
    mode: 'redis' | 'memory';
    lastError: string | null;
  };
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
  events: Array<OtpSendEvent | OtpVerifyEvent>;
  blacklist: {
    phone: OtpBlacklistEntry[];
    ip: OtpBlacklistEntry[];
  };
};
