export type OnboardingMessageRole = 'user' | 'assistant' | 'tool';

export type OnboardingMessageKind = 'text' | 'tool_call' | 'tool_result';

export interface OnboardingMessageDto {
  id: string;
  role: OnboardingMessageRole;
  kind: OnboardingMessageKind;
  text?: string;
  callId?: string;
  toolName?: string;
  arguments?: Record<string, unknown>;
  payload?: Record<string, unknown>;
  createdAt: string;
}

export interface OnboardingSessionDto {
  id: string;
  status: 'collecting_profile' | 'awaiting_confirmation' | 'completed';
  userId: string;
  createdAt: string;
  updatedAt: string;
  messages: OnboardingMessageDto[];
}

export interface StartOnboardingSessionRequest {
  locale?: string;
}

export interface SendOnboardingMessageRequest {
  message: string;
}
