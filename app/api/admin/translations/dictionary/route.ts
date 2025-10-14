import { NextResponse } from 'next/server';

import { fetchDictionary } from '@/services/admin/translations';

import { requireAdmin } from '../../_lib/session';

export const GET = async (request: Request) => {
  const result = await requireAdmin(request, { permission: 'i18n.update' });
  if ('response' in result) {
    return result.response;
  }

  const url = new URL(request.url);
  const lang = url.searchParams.get('lang') ?? 'en';
  const prefix = url.searchParams.get('prefix') ?? undefined;

  try {
    const dictionary = await fetchDictionary(lang, prefix);
    return NextResponse.json({ status: 'ok', data: dictionary });
  } catch (error) {
    console.error('Failed to load translation dictionary', error);
    return NextResponse.json({ message: 'Failed to load dictionary' }, { status: 500 });
  }
};
