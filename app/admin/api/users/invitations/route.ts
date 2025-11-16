import type { User } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';

import { recordAudit } from '@/app/admin/api/_lib/audit';
import { adminLogger } from '@/app/admin/api/_lib/logger';
import { respond, respondWithError, respondWithSupabaseNotConfigured } from '@/app/admin/api/_lib/http';
import { AdminAuthError, requireAdminSession } from '@/app/admin/api/_lib/session';
import { AdminServiceClientUnavailableError, withAdminServiceClient } from '@/services/admin/service-client';

const REQUIRED_PERMISSIONS = ['admin.module.users', 'admin:user:crud'];
const ADMIN_INVITE_FLAG = 'admin_console_invite';

type InvitePayload = {
  email?: string;
  displayName?: string;
  rolePreset?: string;
  note?: string;
};

type InviteActionPayload = {
  user_id?: string;
  email?: string;
};

type AdminInviteResponse = {
  id: string;
  email: string;
  status: 'pending' | 'accepted';
  invitedAt: string | null;
  confirmedAt: string | null;
  lastSignInAt: string | null;
  rolePreset: string | null;
  invitedBy: string | null;
};

const normalizeInvite = (user: User): AdminInviteResponse => {
  const userMetadata = (user.user_metadata ?? {}) as Record<string, unknown>;
  const appMetadata = (user.app_metadata ?? {}) as Record<string, unknown>;
  const rolePreset =
    (Array.isArray(appMetadata.admin_roles) && appMetadata.admin_roles[0]) ||
    (typeof userMetadata.admin_role_preset === 'string' ? userMetadata.admin_role_preset : null);

  const invitedBy =
    (typeof userMetadata.invited_by_admin_email === 'string' && userMetadata.invited_by_admin_email) ||
    (typeof userMetadata.invited_by_admin_id === 'string' && userMetadata.invited_by_admin_id) ||
    null;

  return {
    id: user.id,
    email: user.email ?? 'unknown',
    status: user.email_confirmed_at ? 'accepted' : 'pending',
    invitedAt: user.created_at ?? null,
    confirmedAt: user.email_confirmed_at ?? null,
    lastSignInAt: user.last_sign_in_at ?? null,
    rolePreset: rolePreset ?? null,
    invitedBy,
  };
};

const buildInviteMetadata = (payload: InvitePayload, session: Awaited<ReturnType<typeof requireAdminSession>>) => ({
  [ADMIN_INVITE_FLAG]: true,
  display_name: payload.displayName ?? null,
  admin_role_preset: payload.rolePreset ?? null,
  invited_by_admin_id: session.user.id,
  invited_by_admin_email: session.user.email,
  note: payload.note ?? null,
});

export async function GET() {
  try {
    await requireAdminSession(REQUIRED_PERMISSIONS);

    return await withAdminServiceClient(async (supabase) => {
      const list = await supabase.auth.admin.listUsers();
      if (list.error) throw list.error;

      const invites = (list.data?.users ?? [])
        .filter((user) => Boolean((user.user_metadata as Record<string, unknown>)?.[ADMIN_INVITE_FLAG]))
        .map(normalizeInvite)
        .sort((a: AdminInviteResponse, b: AdminInviteResponse) => {
          if (!a.invitedAt || !b.invitedAt) return 0;
          return new Date(b.invitedAt).getTime() - new Date(a.invitedAt).getTime();
        });

      adminLogger.info('users.invites.list', { count: invites.length });
      return respond({ invitations: invites });
    });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return respondWithError(error.message, 'Permission denied', error.status);
    }
    if (error instanceof AdminServiceClientUnavailableError) {
      return respondWithSupabaseNotConfigured();
    }
    adminLogger.error('users.invites.list_failed', { error: (error as Error).message });
    return respondWithError('invite_list_failed', 'Unable to load invitations', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdminSession(REQUIRED_PERMISSIONS);
    const payload = (await request.json()) as InvitePayload;

    if (!payload?.email) {
      return respondWithError('invite_email_required', 'Email is required', 400);
    }

    return await withAdminServiceClient(async (supabase) => {
      const metadata = buildInviteMetadata(payload, session);
      const response = await supabase.auth.admin.inviteUserByEmail(payload.email!, {
        data: metadata,
      });

      if (response.error) throw response.error;

      const user = response.data?.user;

      if (user?.id) {
        await supabase.auth.admin.updateUserById(user.id, {
          app_metadata: {
            admin_roles: payload.rolePreset ? [payload.rolePreset] : undefined,
            invited_via: 'admin-console',
          },
          user_metadata: metadata,
        });
      }

      if (user) {
        await recordAudit(supabase, {
          action: 'users.invite',
          entityType: 'auth_user',
          entityId: user.id,
          before: null,
          after: { email: user.email, metadata },
          userId: session.user.id,
          ip: session.ip,
          userAgent: session.userAgent,
        });
      }

      const invite = user ? normalizeInvite(user) : null;
      adminLogger.info('users.invites.created', { admin: session.user.id, email: payload.email });
      return respond({ invitation: invite }, 201);
    });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return respondWithError(error.message, 'Permission denied', error.status);
    }
    if (error instanceof AdminServiceClientUnavailableError) {
      return respondWithSupabaseNotConfigured();
    }
    adminLogger.error('users.invites.create_failed', { error: (error as Error).message });
    return respondWithError('invite_creation_failed', 'Unable to send invitation', 500);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireAdminSession(REQUIRED_PERMISSIONS);
    const payload = (await request.json()) as InviteActionPayload;

    if (!payload?.user_id) {
      return respondWithError('invite_id_required', 'Invite user id is required', 400);
    }

    return await withAdminServiceClient(async (supabase) => {
      const existing = await supabase.auth.admin.getUserById(payload.user_id!);
      if (existing.error) throw existing.error;

      const email = payload.email ?? existing.data?.user?.email;
      if (!email) {
        return respondWithError('invite_email_missing', 'Email is required to resend an invite', 400);
      }

      const metadata = {
        ...((existing.data?.user?.user_metadata ?? {}) as Record<string, unknown>),
        [ADMIN_INVITE_FLAG]: true,
        resend_requested_at: new Date().toISOString(),
      };

      const response = await supabase.auth.admin.inviteUserByEmail(email, { data: metadata });
      if (response.error) throw response.error;

      const invite = response.data?.user ? normalizeInvite(response.data.user) : null;

      await recordAudit(supabase, {
        action: 'users.invite.resend',
        entityType: 'auth_user',
        entityId: payload.user_id!,
        before: null,
        after: { email, metadata },
        userId: session.user.id,
        ip: session.ip,
        userAgent: session.userAgent,
      });

      adminLogger.info('users.invites.resent', { admin: session.user.id, email });
      return respond({ invitation: invite });
    });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return respondWithError(error.message, 'Permission denied', error.status);
    }
    if (error instanceof AdminServiceClientUnavailableError) {
      return respondWithSupabaseNotConfigured();
    }
    adminLogger.error('users.invites.resend_failed', { error: (error as Error).message });
    return respondWithError('invite_resend_failed', 'Unable to resend invite', 500);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await requireAdminSession(REQUIRED_PERMISSIONS);
    const payload = (await request.json()) as InviteActionPayload;

    if (!payload?.user_id) {
      return respondWithError('invite_id_required', 'Invite user id is required', 400);
    }

    return await withAdminServiceClient(async (supabase) => {
      const existing = await supabase.auth.admin.getUserById(payload.user_id!);
      if (existing.error) throw existing.error;

      await supabase.auth.admin.deleteUser(payload.user_id!);

      await recordAudit(supabase, {
        action: 'users.invite.revoke',
        entityType: 'auth_user',
        entityId: payload.user_id!,
        before: { email: existing.data?.user?.email },
        after: null,
        userId: session.user.id,
        ip: session.ip,
        userAgent: session.userAgent,
      });

      adminLogger.info('users.invites.revoked', { admin: session.user.id, invite: payload.user_id });
      return respond({ status: 'revoked' });
    });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return respondWithError(error.message, 'Permission denied', error.status);
    }
    if (error instanceof AdminServiceClientUnavailableError) {
      return respondWithSupabaseNotConfigured();
    }
    adminLogger.error('users.invites.revoke_failed', { error: (error as Error).message });
    return respondWithError('invite_revoke_failed', 'Unable to revoke invite', 500);
  }
}
