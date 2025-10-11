import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

import { PrismaService } from '../../prisma/prisma.service.js';

export interface ParsedSmsResult {
  amount: number;
  currency: string;
  payerMask?: string;
  ref: string;
  timestamp?: string;
  confidence: number;
  parserVersion: string;
}

type SmsInput = {
  id: string;
  text: string;
  fromMsisdn: string | null;
  toMsisdn: string | null;
};

@Injectable()
export class SmsParserService {
  private readonly logger = new Logger(SmsParserService.name);
  private readonly client: OpenAI | null;
  private readonly model = 'gpt-4o-mini';

  constructor(private readonly configService: ConfigService, private readonly prisma: PrismaService) {
    const apiKey = this.configService.get<string>('openai.apiKey');
    this.client = apiKey
      ? new OpenAI({ apiKey, baseURL: this.configService.get<string>('openai.baseUrl') })
      : null;
  }

  async parseWithAi(sms: SmsInput, options?: { promptBody?: string; promptId?: string }): Promise<ParsedSmsResult | null> {
    if (!this.client) {
      this.logger.warn('OpenAI API key missing; falling back to heuristic parser');
      return null;
    }

    try {
      const prompt = await this.resolvePrompt(options);
      const input = prompt ? `SYSTEM:\n${prompt}\n\nUSER:\n${sms.text}` : sms.text;

      const response = await this.client.responses.parse({
        model: this.model,
        input,
        schema: {
          name: 'momo_payment_receipt',
          schema: {
            type: 'object',
            properties: {
              amount: { type: 'integer' },
              currency: { type: 'string' },
              payer_mask: { type: 'string' },
              ref: { type: 'string' },
              timestamp: { type: 'string' },
              confidence: { type: 'number' },
            },
            required: ['amount', 'currency', 'ref', 'confidence'],
          },
        },
      });

      const output = (response.output[0] as { parsed?: Record<string, unknown> } | undefined)?.parsed ?? null;
      if (!output) {
        this.logger.warn('Empty OpenAI response for SMS');
        return null;
      }

      const currency = typeof output.currency === 'string' ? output.currency : 'RWF';
      const payerMask = typeof output.payer_mask === 'string' ? output.payer_mask : undefined;
      const reference = typeof output.ref === 'string' ? output.ref : 'UNKNOWN';
      const timestamp = typeof output.timestamp === 'string' ? output.timestamp : undefined;
      const confidence = Number(output.confidence ?? 0.5);

      const parserVersion = options?.promptId
        ? `openai:${this.model}:prompt:${options.promptId}`
        : prompt
          ? `openai:${this.model}:prompt:custom`
          : `openai:${this.model}`;

      return {
        amount: Number(output.amount ?? 0),
        currency,
        payerMask,
        ref: reference,
        timestamp,
        confidence,
        parserVersion,
      };
    } catch (error) {
      this.logger.error('OpenAI parser failed', error as Error);
      return null;
    }
  }

  parseHeuristically(sms: SmsInput): ParsedSmsResult | null {
    const amountMatch = sms.text.match(/([\d,.]+)\s*(RWF|FRW|RF)/i);
    const refMatch = sms.text.match(/Ref(?:erence)?[:\s]+([A-Z0-9-]+)/i);

    if (!amountMatch) {
      return null;
    }

    const amount = Number(amountMatch[1].replace(/[,]/g, ''));
    const currency = amountMatch[2]?.toUpperCase() ?? 'RWF';

    return {
      amount,
      currency,
      payerMask: sms.fromMsisdn ? sms.fromMsisdn.slice(0, -3).padEnd(sms.fromMsisdn.length, '*') : undefined,
      ref: refMatch ? refMatch[1] : 'UNKNOWN',
      confidence: 0.45,
      parserVersion: 'heuristic:v1',
    };
  }

  async parse(sms: SmsInput): Promise<ParsedSmsResult | null> {
    const aiResult = await this.parseWithAi(sms);
    if (aiResult) {
      return aiResult;
    }

    return this.parseHeuristically(sms);
  }

  async parseSample(text: string, options?: { promptBody?: string; promptId?: string }) {
    const sms: SmsInput = {
      id: 'sample',
      text,
      fromMsisdn: null,
      toMsisdn: null,
    };

    const result = await this.parseWithAi(sms, options);
    return result ?? this.parseHeuristically(sms);
  }

  private async resolvePrompt(options?: { promptBody?: string; promptId?: string }) {
    if (options?.promptBody) {
      return options.promptBody;
    }

    if (options?.promptId) {
      const prompt = await this.prisma.smsParserPrompt.findUnique({
        where: { id: options.promptId },
      });
      return prompt?.body ?? null;
    }

    const active = await this.prisma.smsParserPrompt.findFirst({
      where: { isActive: true },
      orderBy: { version: 'desc' },
    });

    return active?.body ?? null;
  }
}
