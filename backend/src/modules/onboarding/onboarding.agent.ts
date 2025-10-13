import { randomUUID } from 'node:crypto';

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

import type { AgentGeneratedMessage, AgentTurn, StoredMessage } from './types.js';

type OpenAIResponse = Awaited<ReturnType<OpenAI['responses']['create']>>;

type InputMessage = {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: Array<Record<string, unknown>>;
};

type ResponseContentItem = {
  type?: string;
  text?: string;
  value?: string;
  content?: string;
  name?: string;
  tool_name?: string;
  id?: string;
  call_id?: string;
  tool_call_id?: string;
  arguments?: unknown;
  function?: {
    name?: string;
    arguments?: unknown;
    arguments_json?: unknown;
  };
};

type ResponseMessageBlock = {
  type?: string;
  role?: string;
  content?: ResponseContentItem[];
};

@Injectable()
export class OnboardingAgentService {
  private readonly logger = new Logger(OnboardingAgentService.name);
  private readonly client: OpenAI | null;
  private readonly model: string;
  private readonly systemPrompt: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('openai.apiKey');
    const baseUrl = this.configService.get<string>('openai.baseUrl') ?? undefined;

    if (!apiKey) {
      this.logger.warn('OPENAI_API_KEY missing; onboarding agent responses will fall back to static copy.');
      this.client = null;
    } else {
      this.client = new OpenAI({ apiKey, baseURL: baseUrl });
    }

    this.model = this.configService.get<string>('openai.onboardingModel') ?? 'gpt-4.1-mini';
    this.systemPrompt = [
      'You are GIKUNDIRO, the friendly onboarding assistant for Rayon Sports fans.',
      'Guide new supporters through activating their profile inside the Rayon Sports digital experience.',
      'Collect exactly two pieces of contact information: the fan\'s WhatsApp number and the MoMo number they will use for payments.',
      'ALWAYS validate numbers using the provided tool. Ask clarifying questions before calling the tool if the user input is ambiguous.',
      'Keep the tone welcoming, concise, and supportive. Switch between English and Kinyarwanda greetings when appropriate.',
      'After both numbers are confirmed, congratulate the fan, summarize what was saved, and explain the next steps.',
      'Do not create placeholders for contact details. Never invent information that the user has not provided.',
      'If the fan asks about other features, answer briefly then steer back to capturing the contact details.',
      'Once confirmed, let them know they can go to Community, Tickets, or Fundraising sections directly.',
    ].join(' ');
  }

  get isEnabled() {
    return this.client !== null;
  }

  async generateTurn(sessionContext: { status: string }, history: StoredMessage[]): Promise<AgentTurn> {
    if (!this.client) {
      const copy: AgentGeneratedMessage = {
        role: 'assistant',
        type: 'text',
        text: this.fallbackCopy(sessionContext.status),
      };
      return { messages: [copy] };
    }

    const input: InputMessage[] = [
      {
        role: 'system',
        content: [
          {
            type: 'text',
            text: `${this.systemPrompt} Current onboarding status: ${sessionContext.status}. If both numbers are already captured, thank the fan and wrap up.`,
          },
        ],
      },
      ...history.map<InputMessage>((message) => this.toInputMessage(message)),
    ];

    const response = await this.client.responses.create({
      model: this.model,
      input,
      tools: [this.collectContactTool()],
    });

    return this.parseResponse(response);
  }

  private fallbackCopy(status: string) {
    if (status === 'completed') {
      return 'Murakoze! Your profile is ready. If you need anything else, let us know.';
    }
    return 'Hello! Our onboarding agent is momentarily offline. Please send your WhatsApp number and your MoMo number so we can link your future payments to your account.';
  }

  private toInputMessage(message: StoredMessage): InputMessage {
    if (message.content.type === 'text') {
      return {
        role: message.role,
        content: [
          {
            type: 'text',
            text: message.content.text,
          },
        ],
      };
    }

    if (message.content.type === 'tool_call') {
      return {
        role: 'assistant',
        content: [
          {
            type: 'tool_call',
            id: message.content.callId,
            name: message.content.name,
            arguments: JSON.stringify(message.content.arguments ?? {}),
          },
        ],
      };
    }

    // tool_result
    return {
      role: 'tool',
      content: [
          {
            type: 'tool_result',
            tool_call_id: message.content.callId,
            output: JSON.stringify(message.content.payload ?? {}),
          },
      ],
    };
  }

  private collectContactTool() {
    return {
      type: 'function',
      function: {
        name: 'collect_contact_info',
        description:
          'Store validated contact information after the fan confirms it. Only call when a WhatsApp number or MoMo number has been clearly provided or confirmed.',
        parameters: {
          type: 'object',
          properties: {
            whatsapp_number: {
              type: 'string',
              description: 'Fan WhatsApp phone number in international (E.164) format, including + country code.',
            },
            momo_number: {
              type: 'string',
              description: 'Fan MoMo (mobile money) number in international (E.164) format, including + country code.',
            },
            confirmation_note: {
              type: 'string',
              description: 'Optional short note on how the fan confirmed the details.',
            },
          },
          additionalProperties: false,
        },
      },
    };
  }

  private parseResponse(response: OpenAIResponse): AgentTurn {
    const messages: AgentGeneratedMessage[] = [];

    const blocks = (response as { output?: ResponseMessageBlock[] }).output ?? [];
    for (const block of blocks) {
      if (block?.type !== 'message' || block?.role !== 'assistant') {
        continue;
      }

      const contentItems = block.content ?? [];
      for (const item of contentItems) {
        if (item?.type === 'output_text' || item?.type === 'text') {
          const text = this.extractText(item);
          if (text) {
            messages.push({ role: 'assistant', type: 'text', text });
          }
        } else if (item?.type === 'tool_call' || item?.type === 'function_call') {
          const name: string = item.name ?? item.tool_name ?? item.function?.name ?? 'collect_contact_info';
          const callId: string = item.id ?? item.call_id ?? item.tool_call_id ?? randomUUID();
          const argsRaw = item.arguments ?? item.function?.arguments ?? item.function?.arguments_json;
          const args = this.safeParseArgs(argsRaw);
          messages.push({
            role: 'assistant',
            type: 'tool_call',
            name,
            callId,
            arguments: args,
          });
        }
      }
    }

    const outputText = (response as { output_text?: string }).output_text;
    if (!messages.length && typeof outputText === 'string' && outputText.trim().length > 0) {
      messages.push({
        role: 'assistant',
        type: 'text',
        text: outputText,
      });
    }

    return { messages };
  }

  private extractText(item: ResponseContentItem) {
    if (typeof item?.text === 'string') {
      return item.text;
    }
    if (typeof item?.value === 'string') {
      return item.value;
    }
    if (typeof item?.content === 'string') {
      return item.content;
    }
    return undefined;
  }

  private safeParseArgs(raw: unknown): Record<string, unknown> {
    if (!raw) {
      return {};
    }
    if (typeof raw === 'object') {
      return raw as Record<string, unknown>;
    }
    if (typeof raw === 'string') {
      try {
        return JSON.parse(raw);
      } catch (error) {
        this.logger.warn(`Unable to parse tool call arguments: ${(error as Error).message}`);
        return {};
      }
    }
    return {};
  }
}
