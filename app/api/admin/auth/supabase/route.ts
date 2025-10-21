import { NextResponse } from 'next/server';

import { writeAuditLog } from '@/app/api/admin/_lib/audit';
import { createAdminSession, fetchAdminContextForToken, withSessionCookie } from '@/app/api/admin/_lib/session';
import { respondWithSupabaseNotConfigured } from '@/app/admin/api/_lib/http';
import { AdminServiceClientUnavailableError, withAdminServiceClient } from '@/services/admin/service-client';

export const POST = async (request: Request) => {
  let body: { accessToken?: string };

  try {
    body = (await request.json()) as { accessToken?: string };
  } catch {
    return NextResponse.json({ message: 'Invalid payload' }, { status: 400 });
  }

  const accessToken = body.accessToken?.trim();
  if (!accessToken) {
    return NextResponse.json({ message: 'Access token required' }, { status: 400 });
  }

  try {
    return await withAdminServiceClient(async (client) => {
      const { data: userResponse, error: authError } = await client.auth.getUser(accessToken);
      if (authError || !userResponse?.user?.email) {
        return NextResponse.json({ message: 'Invalid Supabase credentials' }, { status: 401 });
      }

      const email = userResponse.user.email.toLowerCase();
      const { data: adminUser, error: adminError } = await client
        .from('admin_users')
        .select('id, email, display_name, status')
        .eq('email', email)
        .maybeSingle();

      if (adminError || !adminUser) {
        return NextResponse.json({ message: 'Admin user not found' }, { status: 403 });
      }

      if (adminUser.status !== 'active') {
        return NextResponse.json({ message: 'Admin user is disabled' }, { status: 403 });
      }

      const { token, session } = await createAdminSession(adminUser.id);

      await client
        .from('admin_users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', adminUser.id);

      const context = await fetchAdminContextForToken(token);

      await writeAuditLog({
        adminId: adminUser.id,
        action: 'admin.login',
        entityType: 'admin_user',
        entityId: adminUser.id,
        request,
      });

      const response = NextResponse.json({ status: 'ok', data: context });
      return withSessionCookie(response, token, session.expires_at ?? null);
    });
  } catch (error) {
    if (error instanceof AdminServiceClientUnavailableError) {
      return respondWithSupabaseNotConfigured();
    }
    console.error('admin.auth.supabase_failed', error);
    return NextResponse.json({ message: 'Failed to authenticate admin' }, { status: 500 });
  }
};
