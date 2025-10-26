import { NextResponse } from 'next/server';

import { writeAuditLog } from '@/app/api/admin/_lib/audit';
import { requireAdmin } from '@/app/api/admin/_lib/session';
import { respondWithSupabaseNotConfigured } from '@/app/admin/api/_lib/http';
import { AdminServiceClientUnavailableError } from '@/services/admin/service-client';
import { createSmsParserPrompt, fetchSmsParserPrompts } from '@/services/admin/sms';

export const GET = async (request: Request) => {
  const session = await requireAdmin(request, { permission: 'sms:parser:update' });
  if ('response' in session) {
    return session.response;
  }

  try {
    const prompts = await fetchSmsParserPrompts();
    return NextResponse.json({ data: prompts });
  } catch (error) {
    if (error instanceof AdminServiceClientUnavailableError) {
      return respondWithSupabaseNotConfigured();
    }
    console.error('admin.sms.prompts_list_failed', error);
    return NextResponse.json({ message: 'Failed to load parser prompts' }, { status: 500 });
  }
};

export const POST = async (request: Request) => {
  const session = await requireAdmin(request, { permission: 'sms:parser:update' });
  if ('response' in session) {
    return session.response;
  }

  let body: { label?: string; body?: string; version?: number } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ message: 'Invalid JSON payload' }, { status: 400 });
  }

  if (!body.label || !body.body) {
    return NextResponse.json({ message: 'label and body are required' }, { status: 400 });
  }

  try {
    const prompt = await createSmsParserPrompt({
      label: body.label,
      body: body.body,
      version: body.version,
      createdById: session.context.user.id,
    });

    await writeAuditLog({
      adminId: session.context.user.id,
      action: 'sms.parser.prompt.create',
      entityType: 'sms_parser_prompt',
      entityId: prompt.id,
      request,
      context: { label: prompt.label, version: prompt.version },
    });

    return NextResponse.json({ data: prompt });
  } catch (error) {
    if (error instanceof AdminServiceClientUnavailableError) {
      return respondWithSupabaseNotConfigured();
    }
    console.error('admin.sms.prompt_create_failed', error);
    return NextResponse.json({ message: 'Failed to create parser prompt' }, { status: 500 });
  }
};
