import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma, OnboardingStatus, type OnboardingSession as PrismaOnboardingSession, type User } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service.js';
import { OnboardingAgentService } from './onboarding.agent.js';
import {
  describePhoneValidation,
  normalizeInternationalPhoneNumber,
} from './phone.util.js';
import type {
  AgentGeneratedMessage,
  MessageContent,
  StoredMessage,
  StoredMessageRole,
} from './types.js';
import type {
  OnboardingMessageDto,
  OnboardingSessionDto,
} from '@rayon/contracts/onboarding';

const MAX_AGENT_ITERATIONS = 4;

@Injectable()
export class OnboardingService {
  private readonly logger = new Logger(OnboardingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly agent: OnboardingAgentService,
  ) {}

  async createSession(locale?: string): Promise<OnboardingSessionDto> {
    const user = await this.prisma.user.create({
      data: {
        status: 'onboarding',
        locale: locale ?? 'rw',
      },
    });

    const session = await this.prisma.onboardingSession.create({
      data: {
        userId: user.id,
      },
    });

    await this.runAgentLoop(session.id);

    return this.getSession(session.id);
  }

  async getSession(sessionId: string): Promise<OnboardingSessionDto> {
    const session = await this.prisma.onboardingSession.findUnique({
      where: { id: sessionId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!session) {
      throw new NotFoundException('Onboarding session not found');
    }

    return {
      id: session.id,
      status: session.status,
      userId: session.userId,
      createdAt: session.createdAt.toISOString(),
      updatedAt: session.updatedAt.toISOString(),
      messages: session.messages.map((message) => this.toDto(message)),
    };
  }

  async sendMessage(sessionId: string, message: string): Promise<OnboardingSessionDto> {
    const trimmed = message.trim();
    if (!trimmed) {
      throw new BadRequestException('Message cannot be empty');
    }

    await this.ensureSession(sessionId);

    await this.prisma.onboardingMessage.create({
      data: {
        sessionId,
        role: 'user',
        content: {
          type: 'text',
          text: trimmed,
        },
      },
    });

    await this.runAgentLoop(sessionId);

    return this.getSession(sessionId);
  }

  private async ensureSession(sessionId: string) {
    const exists = await this.prisma.onboardingSession.findUnique({
      where: { id: sessionId },
      select: { id: true },
    });
    if (!exists) {
      throw new NotFoundException('Onboarding session not found');
    }
  }

  private async runAgentLoop(sessionId: string) {
    for (let attempt = 0; attempt < MAX_AGENT_ITERATIONS; attempt += 1) {
      const session = await this.prisma.onboardingSession.findUnique({
        where: { id: sessionId },
        include: {
          user: true,
        },
      });

      if (!session) {
        throw new NotFoundException('Onboarding session not found');
      }

      const history = await this.fetchHistory(sessionId);

      let turn;
      try {
        turn = await this.agent.generateTurn({ status: session.status }, history);
      } catch (error) {
        this.logger.error('Onboarding agent failed', error as Error);
        await this.prisma.onboardingMessage.create({
          data: {
            sessionId,
            role: 'assistant',
            content: {
              type: 'text',
              text: 'Ndakubabarira, something went wrong for a moment. Could you repeat that or send your number again?',
            },
          },
        });
        break;
      }

      if (!turn.messages.length) {
        break;
      }

      let invokedTool = false;

      for (const msg of turn.messages) {
        const stored = await this.prisma.onboardingMessage.create({
          data: {
            sessionId,
            role: 'assistant',
            content: this.serializeAgentMessage(msg),
          },
        });

        if (msg.type === 'tool_call') {
          invokedTool = true;
          await this.handleToolCall(session, msg);
        }
      }

      if (!invokedTool) {
        break;
      }
    }
  }

  private async fetchHistory(sessionId: string): Promise<StoredMessage[]> {
    const records = await this.prisma.onboardingMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
    });

    return records
      .map((record) => {
        const content = record.content as MessageContent | null;
        if (!content || !('type' in content)) {
          return null;
        }
        return {
          id: record.id,
          role: record.role as StoredMessageRole,
          content,
          createdAt: record.createdAt,
        } satisfies StoredMessage;
      })
      .filter((value): value is StoredMessage => value !== null);
  }

  private serializeAgentMessage(message: AgentGeneratedMessage): MessageContent {
    if (message.type === 'text') {
      return { type: 'text', text: message.text };
    }

    return {
      type: 'tool_call',
      name: message.name,
      callId: message.callId,
      arguments: message.arguments,
    };
  }

  private async handleToolCall(
    session: PrismaOnboardingSession & { user: User },
    message: Extract<AgentGeneratedMessage, { type: 'tool_call' }>,
  ) {
    if (message.name !== 'collect_contact_info') {
      await this.prisma.onboardingMessage.create({
        data: {
          sessionId: session.id,
          role: 'tool',
          content: {
            type: 'tool_result',
            name: message.name,
            callId: message.callId,
            payload: { ignored: true },
          },
        },
      });
      return;
    }

    const whatsappRaw = this.extractString(message.arguments, ['whatsapp_number', 'whatsappNumber']);
    const momoRaw = this.extractString(message.arguments, ['momo_number', 'momoNumber']);
    const confirmationNote = this.extractString(message.arguments, ['confirmation_note', 'note']);

    const payload: Record<string, unknown> = {};
    const errors: string[] = [];

    const normalizedInputs: Partial<Record<'whatsappNumber' | 'momoNumber', string>> = {};

    if (whatsappRaw) {
      const result = normalizeInternationalPhoneNumber(whatsappRaw);
      if (result.normalized) {
        normalizedInputs.whatsappNumber = result.normalized;
        payload.whatsappNumber = result.normalized;
      } else {
        const messageText = describePhoneValidation(result.reason);
        payload.whatsappError = messageText;
        errors.push(`WhatsApp: ${messageText}`);
      }
    }

    if (momoRaw) {
      const result = normalizeInternationalPhoneNumber(momoRaw);
      if (result.normalized) {
        normalizedInputs.momoNumber = result.normalized;
        payload.momoNumber = result.normalized;
      } else {
        const messageText = describePhoneValidation(result.reason);
        payload.momoError = messageText;
        errors.push(`MoMo: ${messageText}`);
      }
    }

    if (confirmationNote) {
      payload.confirmationNote = confirmationNote;
    }

    const candidateUsers = new Map<string, { field: 'whatsappNumber' | 'momoNumber'; value: string }>();

    if (normalizedInputs.whatsappNumber) {
      const existing = await this.prisma.user.findUnique({
        where: { whatsappNumber: normalizedInputs.whatsappNumber },
      });
      if (existing) {
        candidateUsers.set(existing.id, {
          field: 'whatsappNumber',
          value: normalizedInputs.whatsappNumber,
        });
      }
    }

    if (normalizedInputs.momoNumber) {
      const existing = await this.prisma.user.findUnique({
        where: { momoNumber: normalizedInputs.momoNumber },
      });
      if (existing) {
        const previous = candidateUsers.get(existing.id);
        if (!previous) {
          candidateUsers.set(existing.id, {
            field: 'momoNumber',
            value: normalizedInputs.momoNumber,
          });
        }
      }
    }

    if (candidateUsers.size > 1) {
      payload.conflict = 'WhatsApp and MoMo numbers belong to different profiles. Please confirm which one is correct.';
      payload.errors = errors;
      await this.recordToolResult(session.id, message, payload);
      return;
    }

    let targetUserId = session.userId;
    let targetUser = session.user;

    if (candidateUsers.size === 1) {
      const [existingUserId] = candidateUsers.keys();
      if (existingUserId !== session.userId) {
        const existingUser = await this.prisma.user.findUnique({ where: { id: existingUserId } });
        if (existingUser) {
          await this.prisma.onboardingSession.update({
            where: { id: session.id },
            data: { userId: existingUserId },
          });
          await this.prisma.user.update({
            where: { id: session.userId },
            data: { status: 'merged' },
          });
          targetUserId = existingUser.id;
          targetUser = existingUser;
          session.userId = existingUser.id;
          session.user = existingUser;
          payload.linkedExistingUser = existingUser.id;
        }
      }
    }

    const updateData: Prisma.UserUpdateInput = {};

    if (normalizedInputs.whatsappNumber && targetUser.whatsappNumber !== normalizedInputs.whatsappNumber) {
      updateData.whatsappNumber = normalizedInputs.whatsappNumber;
    }

    if (normalizedInputs.momoNumber && targetUser.momoNumber !== normalizedInputs.momoNumber) {
      updateData.momoNumber = normalizedInputs.momoNumber;
    }

    let updatedUser = targetUser;

    if (Object.keys(updateData).length > 0) {
      updatedUser = await this.prisma.user.update({
        where: { id: targetUserId },
        data: updateData,
      });
      session.user = updatedUser;
    }

    const nextStatus = this.computeStatus(updatedUser);
    if (nextStatus !== session.status) {
      const refreshed = await this.prisma.onboardingSession.update({
        where: { id: session.id },
        data: { status: nextStatus },
      });
      session.status = refreshed.status;
    }

    if (nextStatus === OnboardingStatus.completed && updatedUser.status !== 'active') {
      updatedUser = await this.prisma.user.update({
        where: { id: session.userId },
        data: { status: 'active' },
      });
      session.user = updatedUser;
    } else if (nextStatus === OnboardingStatus.awaiting_confirmation && updatedUser.status !== 'onboarding') {
      updatedUser = await this.prisma.user.update({
        where: { id: session.userId },
        data: { status: 'onboarding' },
      });
      session.user = updatedUser;
    }

    if (errors.length) {
      payload.errors = errors;
    }

    payload.userId = session.userId;
    payload.onboardingStatus = session.status;

    if (Object.keys(payload).length === 2 && !errors.length && !normalizedInputs.whatsappNumber && !normalizedInputs.momoNumber) {
      payload.message = 'No new contact info captured';
    }

    await this.recordToolResult(session.id, message, payload);
  }

  private computeStatus(user: User): OnboardingStatus {
    if (user.whatsappNumber && user.momoNumber) {
      return OnboardingStatus.completed;
    }
    if (user.whatsappNumber || user.momoNumber) {
      return OnboardingStatus.awaiting_confirmation;
    }
    return OnboardingStatus.collecting_profile;
  }

  private extractString(source: Record<string, unknown>, keys: string[]): string | undefined {
    for (const key of keys) {
      const value = source[key];
      if (typeof value === 'string' && value.trim().length > 0) {
        return value.trim();
      }
    }
    return undefined;
  }

  private async recordToolResult(
    sessionId: string,
    message: Extract<AgentGeneratedMessage, { type: 'tool_call' }>,
    payload: Record<string, unknown>,
  ) {
    await this.prisma.onboardingMessage.create({
      data: {
        sessionId,
        role: 'tool',
        content: {
          type: 'tool_result',
          name: message.name,
          callId: message.callId,
          payload,
        },
      },
    });
  }

  private toDto(message: { id: string; role: string; content: Prisma.JsonValue; createdAt: Date }): OnboardingMessageDto {
    const content = message.content as MessageContent | null;

    const base = {
      id: message.id,
      role: message.role as StoredMessageRole,
      createdAt: message.createdAt.toISOString(),
      kind: content?.type ?? 'text',
    } as OnboardingMessageDto;

    if (!content) {
      return base;
    }

    if (content.type === 'text') {
      return {
        ...base,
        text: content.text,
      };
    }

    if (content.type === 'tool_call') {
      return {
        ...base,
        callId: content.callId,
        toolName: content.name,
        arguments: content.arguments,
      };
    }

    return {
      ...base,
      callId: content.callId,
      toolName: content.name,
      payload: content.payload,
    };
  }
}
