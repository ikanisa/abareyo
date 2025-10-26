import { NextResponse } from 'next/server';

import { requireAdmin } from '@/app/api/admin/_lib/session';
import { respondWithSupabaseNotConfigured } from '@/app/admin/api/_lib/http';
import { AdminServiceClientUnavailableError } from '@/services/admin/service-client';
import { testSmsParser } from '@/services/admin/sms';

export const POST = async (request: Request) => {
  const session = await requireAdmin(request, { permission: 'sms:parser:update' });
  if ('response' in session) {
    return session.response;
  }

  let body: { text?: string; promptId?: string; promptBody?: string } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ message: 'Invalid JSON payload' }, { status: 400 });
  }

  if (!body.text || body.text.trim().length === 0) {
    return NextResponse.json({ message: 'text is required' }, { status: 400 });
  }

  try {
    const result = await testSmsParser({
      text: body.text,
      promptId: body.promptId,
      promptBody: body.promptBody,
    });
    return NextResponse.json({ data: result });
  } catch (error) {
    if (error instanceof AdminServiceClientUnavailableError) {
      return respondWithSupabaseNotConfigured();
    }
    console.error('admin.sms.parser_test_failed', error);
    return NextResponse.json({ message: 'Parser test failed' }, { status: 500 });
  }
};
