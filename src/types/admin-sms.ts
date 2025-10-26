export type ParsedSmsDetails = {
  id: string;
  amount: number;
  currency: string;
  ref: string;
  confidence: number;
  matchedEntity?: string | null;
  payerMask?: string | null;
};

export type InboundSmsRecord = {
  id: string;
  text: string;
  fromMsisdn: string;
  toMsisdn?: string | null;
  receivedAt: string;
  ingestStatus: 'received' | 'parsed' | 'error' | 'manual_review';
  parsed?: ParsedSmsDetails | null;
};

export type ManualReviewSmsRecord = InboundSmsRecord;

export type ManualReviewPayment = {
  id: string;
  amount: number;
  currency: string;
  status: string;
  kind: string;
  createdAt: string;
  metadata?: Record<string, unknown> | null;
  order?: { id: string; status: string | null } | null;
  membership?: { id: string; plan?: { name: string } | null } | null;
  donation?: { id: string; project?: { title: string } | null } | null;
  smsParsed?: ParsedSmsDetails | null;
};

export type SmsParserPrompt = {
  id: string;
  label: string;
  body: string;
  version: number;
  isActive: boolean;
  createdAt: string;
};

export type SmsParserResult = {
  amount: number;
  currency: string;
  payerMask?: string;
  ref: string;
  timestamp?: string;
  confidence: number;
  parserVersion: string;
};

export type SmsQueuePendingJob = {
  jobId: string;
  smsId: string;
  attemptsMade: number;
  maxAttempts: number;
  state: string;
  enqueuedAt: string;
  lastFailedReason?: string | null;
};

export type SmsQueueOverview = {
  waiting: number;
  delayed: number;
  active: number;
  pending: SmsQueuePendingJob[];
};

export type ManualSmsResolution = 'ignore' | 'linked_elsewhere' | 'duplicate';

