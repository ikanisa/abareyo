import { NextResponse } from 'next/server';

import { fetchTranslationsPage } from '@/services/admin/translations';

import { requireAdmin } from '../_lib/session';

const parseQuery = (request: Request) => {
  const url = new URL(request.url);
  const lang = url.searchParams.get('lang') ?? 'en';
  const page = Math.max(Number(url.searchParams.get('page') ?? '1'), 1);
  const pageSize = Math.min(Math.max(Number(url.searchParams.get('pageSize') ?? '50'), 1), 200);
  const search = url.searchParams.get('search') ?? undefined;
  return { lang, page, pageSize, search };
};

export const GET = async (request: Request) => {
  const result = await requireAdmin(request, { permission: 'i18n.update' });
  if ('response' in result) {
    return result.response;
  }

  try {
    const { lang, page, pageSize, search } = parseQuery(request);
    const { data, total } = await fetchTranslationsPage(lang, page, pageSize, search);
    return NextResponse.json({
      status: 'ok',
      data,
      meta: { page, pageSize, total },
    });
  } catch (error) {
    console.error('Failed to load translations', error);
    return NextResponse.json({ message: 'Failed to load translations' }, { status: 500 });
  }
};
