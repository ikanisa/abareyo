import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

const DEFAULT_BASE_URL = 'https://api.openai.com/v1';

export const OPENAI_FACTORY = Symbol('OPENAI_FACTORY');
export type OpenAiFactory = (options: ConstructorParameters<typeof OpenAI>[0]) => OpenAI;

export class OpenAiUnavailableError extends Error {
  constructor(message = 'OpenAI client is not configured.') {
    super(message);
    this.name = 'OpenAiUnavailableError';
  }
}

export class OpenAiRequestError extends Error {
  readonly status: number;
  readonly detail?: string;

  constructor(message: string, options: { status: number; detail?: string; cause?: unknown }) {
    super(message, { cause: options.cause });
    this.name = 'OpenAiRequestError';
    this.status = options.status;
    this.detail = options.detail;
  }
}

@Injectable()
export class OpenAiService {
  private readonly logger = new Logger(OpenAiService.name);
  private readonly client: OpenAI | null;
  private readonly baseUrl: string;

  constructor(
    private readonly configService: ConfigService,
    @Inject(OPENAI_FACTORY) private readonly openAiFactory: OpenAiFactory,
  ) {
    this.baseUrl = this.normalizeBaseUrl(this.configService.get<string>('openai.baseUrl'));

    const apiKey = this.configService.get<string>('openai.apiKey');
    if (!apiKey) {
      this.logger.warn('OPENAI_API_KEY missing; AI-powered flows will fall back to static responses.');
      this.client = null;
      return;
    }

    this.client = this.openAiFactory({ apiKey, baseURL: this.baseUrl });
  }

  get isEnabled(): boolean {
    return this.client !== null;
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  async responsesCreate<T>(params: Parameters<OpenAI['responses']['create']>[0]): Promise<T> {
    const client = this.requireClient();
    try {
      return (await client.responses.create(params)) as T;
    } catch (error) {
      throw this.handleError('responses.create', error);
    }
  }

  async responsesParse<T>(params: Parameters<OpenAI['responses']['parse']>[0]): Promise<T> {
    const client = this.requireClient();
    try {
      return (await client.responses.parse(params)) as T;
    } catch (error) {
      throw this.handleError('responses.parse', error);
    }
  }

  private requireClient(): OpenAI {
    if (!this.client) {
      throw new OpenAiUnavailableError();
    }
    return this.client;
  }

  private handleError(operation: string, error: unknown): OpenAiRequestError {
    const requestError = this.toRequestError(error);

    if (error instanceof Error) {
      this.logger.error(`OpenAI ${operation} failed`, error);
    } else {
      this.logger.error(`OpenAI ${operation} failed: ${String(error)}`);
    }

    return requestError;
  }

  private toRequestError(error: unknown): OpenAiRequestError {
    if (error && typeof error === 'object') {
      const status = typeof (error as { status?: unknown }).status === 'number' ? (error as { status: number }).status : 502;
      const detail = this.extractDetail(error);
      return new OpenAiRequestError('openai_request_failed', {
        status,
        detail,
        cause: error,
      });
    }

    return new OpenAiRequestError('openai_request_failed', {
      status: 502,
      detail: typeof error === 'string' ? error : undefined,
      cause: error,
    });
  }

  private extractDetail(error: unknown): string | undefined {
    if (error instanceof Error && typeof error.message === 'string') {
      return error.message;
    }

    if (error && typeof error === 'object' && 'error' in error) {
      try {
        return JSON.stringify((error as { error?: unknown }).error);
      } catch {
        return undefined;
      }
    }

    return undefined;
  }

  private normalizeBaseUrl(candidate?: string | null): string {
    const trimmed = candidate?.trim();
    if (!trimmed) {
      return DEFAULT_BASE_URL;
    }

    return trimmed.replace(/\/$/, '');
  }
}
