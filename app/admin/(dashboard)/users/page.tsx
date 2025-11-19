import { cookies } from 'next/headers';

import { AdminUserInvitations, type AdminUserInvite } from '@/components/admin/users/AdminUserInvitations';
import { AdminUsersDirectory } from '@/components/admin/users/AdminUsersDirectory';
import { serverEnv } from '@/config/env';

type InvitationPayload = {
  data?: { invitations?: unknown };
  invitations?: unknown;
};

type DirectoryPayload = {
  data?: { users?: unknown };
  users?: unknown;
};

const fetchJson = async (path: string) => {
  const cookieHeader = cookies().toString();
  const url = new URL(path, `${serverEnv.APP_BASE_URL}/`).toString();
  const response = await fetch(url, { cache: 'no-store', headers: { cookie: cookieHeader } });
  if (!response.ok) {
    throw new Error(`Failed to load ${path}`);
  }
  return response.json();
};

const AdminUsersPage = async () => {
  const [usersPayload, invitesPayload] = await Promise.all([
    fetchJson('/admin/api/users/directory').catch(() => ({ data: { users: [] } })),
    fetchJson('/admin/api/users/invitations').catch(() => ({ data: { invitations: [] } })),
  ]);

  const usersData = usersPayload as DirectoryPayload;
  const invitesData = invitesPayload as InvitationPayload;

  const initialUsers = (usersData.data?.users ?? (usersData.users as unknown[] | undefined) ?? []) as Array<{
    id: string;
    display_name: string | null;
    phone: string | null;
    created_at: string;
  }>;

  const initialInvites = (
    invitesData.data?.invitations ?? (invitesData.invitations as unknown[] | undefined) ?? []
  ) as AdminUserInvite[];

  return (
    <div className="space-y-8">
      <AdminUserInvitations initialInvites={initialInvites} />
      <AdminUsersDirectory initialUsers={initialUsers} />
    </div>
  );
};

export default AdminUsersPage;
