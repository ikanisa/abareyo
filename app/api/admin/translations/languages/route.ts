import { NextResponse } from 'next/server';

import { listTranslationLanguages } from '@/services/admin/translations';

import { requireAdmin } from '../../_lib/session';

export const GET = async (request: Request) => {
  const result = await requireAdmin(request, { permission: 'i18n.update' });
  if ('response' in result) {
    return result.response;
  }

  try {
    const languages = await listTranslationLanguages();
    return NextResponse.json({ status: 'ok', data: languages });
  } catch (error) {
    console.error('Failed to list translation languages', error);
    return NextResponse.json({ message: 'Failed to list languages' }, { status: 500 });
  }
};
