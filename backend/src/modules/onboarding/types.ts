import type { OnboardingStatus } from '@prisma/client';

export type StoredMessageRole = 'user' | 'assistant' | 'tool';

export type MessageContent =
  | {
      type: 'text';
      text: string;
    }
  | {
      type: 'tool_call';
      name: string;
      callId: string;
      arguments: Record<string, unknown>;
    }
  | {
      type: 'tool_result';
      name: string;
      callId: string;
      payload: Record<string, unknown>;
    };

export type StoredMessage = {
  id: string;
  role: StoredMessageRole;
  content: MessageContent;
  createdAt: Date;
};

export type AgentGeneratedMessage =
  | {
      role: 'assistant';
      type: 'text';
      text: string;
    }
  | {
      role: 'assistant';
      type: 'tool_call';
      name: string;
      callId: string;
      arguments: Record<string, unknown>;
    };

export type AgentTurn = {
  messages: AgentGeneratedMessage[];
};

export type SessionSummary = {
  id: string;
  status: OnboardingStatus;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
};
