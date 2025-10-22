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

export type OnboardingAuthorizationErrorCode = "missing" | "invalid";

export type OnboardingAuthorizationResultContract =
  | { ok: true; token: string }
  | { ok: false; code: OnboardingAuthorizationErrorCode };

export interface OnboardingSessionPublicContract {
  sessionId: string;
  agentId: string;
  createdAt: string;
  mock?: boolean;
}

export type OnboardingSessionSuccessContract = {
  ok: true;
  session: OnboardingSessionPublicContract;
  fromMock: boolean;
};

export type OnboardingSessionErrorContract = {
  ok: false;
  status: number;
  error: string;
  message?: string;
};

export type OnboardingSessionResultContract =
  | OnboardingSessionSuccessContract
  | OnboardingSessionErrorContract;

export type OnboardingReplySuccessContract = {
  ok: true;
  reply: string;
  fromMock: boolean;
  raw: unknown;
};

export type OnboardingReplyErrorContract = {
  ok: false;
  status: number;
  error: string;
  message?: string;
  detail?: string;
};

export type OnboardingReplyResultContract =
  | OnboardingReplySuccessContract
  | OnboardingReplyErrorContract;
