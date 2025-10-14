import { NextResponse } from 'next/server';

import { fetchDashboardSnapshot } from '@/services/admin/dashboard';

import { requireAdmin } from '../_lib/session';

export const GET = async (request: Request) => {
  const result = await requireAdmin(request, { permission: 'dashboard:view' });
  if ('response' in result) {
    return result.response;
  }

  try {
    const snapshot = await fetchDashboardSnapshot();
    return NextResponse.json({ status: 'ok', data: snapshot });
  } catch (error) {
    console.error('Failed to build admin dashboard snapshot', error);
    return NextResponse.json({ message: 'Failed to load dashboard metrics' }, { status: 500 });
  }
};
