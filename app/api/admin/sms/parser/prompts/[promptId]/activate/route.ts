import { NextResponse } from 'next/server';

import { writeAuditLog } from '@/app/api/admin/_lib/audit';
import { requireAdmin } from '@/app/api/admin/_lib/session';
import { respondWithSupabaseNotConfigured } from '@/app/admin/api/_lib/http';
import { AdminServiceClientUnavailableError } from '@/services/admin/service-client';
import { activateSmsParserPrompt } from '@/services/admin/sms';

type RouteParams = {
  params: {
    promptId: string;
  };
};

export const POST = async (request: Request, { params }: RouteParams) => {
  const session = await requireAdmin(request, { permission: 'sms:parser:update' });
  if ('response' in session) {
    return session.response;
  }

  const promptId = params.promptId;
  if (!promptId) {
    return NextResponse.json({ message: 'promptId is required' }, { status: 400 });
  }

  try {
    const prompt = await activateSmsParserPrompt(promptId);
    await writeAuditLog({
      adminId: session.context.user.id,
      action: 'sms.parser.prompt.activate',
      entityType: 'sms_parser_prompt',
      entityId: prompt.id,
      request,
      context: { version: prompt.version },
    });
    return NextResponse.json({ data: prompt });
  } catch (error) {
    if (error instanceof AdminServiceClientUnavailableError) {
      return respondWithSupabaseNotConfigured();
    }
    if (error instanceof Error && error.message === 'prompt_not_found') {
      return NextResponse.json({ message: 'Prompt not found' }, { status: 404 });
    }
    console.error('admin.sms.prompt_activate_failed', error);
    return NextResponse.json({ message: 'Failed to activate parser prompt' }, { status: 500 });
  }
};
