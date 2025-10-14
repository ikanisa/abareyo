import { NextResponse } from 'next/server';

import { requireAdmin } from '@/app/api/admin/_lib/session';

export const GET = async (request: Request) => {
  const result = await requireAdmin(request);
  if ('response' in result) {
    return result.response;
  }

  return NextResponse.json({ status: 'ok', data: result.context });
};
