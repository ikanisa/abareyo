import { NextResponse } from 'next/server';

import { requireAdmin } from '@/app/api/admin/_lib/session';
import { respondWithSupabaseNotConfigured } from '@/app/admin/api/_lib/http';
import { AdminServiceClientUnavailableError } from '@/services/admin/service-client';
import { fetchActiveSmsParserPrompt } from '@/services/admin/sms';

export const GET = async (request: Request) => {
  const session = await requireAdmin(request, { permission: 'sms:parser:update' });
  if ('response' in session) {
    return session.response;
  }

  try {
    const prompt = await fetchActiveSmsParserPrompt();
    return NextResponse.json({ data: prompt });
  } catch (error) {
    if (error instanceof AdminServiceClientUnavailableError) {
      return respondWithSupabaseNotConfigured();
    }
    console.error('admin.sms.prompt_active_failed', error);
    return NextResponse.json({ message: 'Failed to load active parser prompt' }, { status: 500 });
  }
};
