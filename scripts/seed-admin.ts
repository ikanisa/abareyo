import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  process.exit(1);
}

const client = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const PERMISSIONS = [
  { key: 'dashboard:view', description: 'View operational dashboards and KPIs' },
  { key: 'match.manage', description: 'Create and update match operations data' },
  { key: 'orders.read', description: 'View ticket and shop orders' },
  { key: 'orders.refund', description: 'Refund ticket and shop orders' },
  { key: 'shop.manage', description: 'Manage shop catalog and orders' },
  { key: 'sms.attach', description: 'Attach inbound SMS to payments' },
  { key: 'admin.manage', description: 'Manage admin users and roles' },
  { key: 'i18n.update', description: 'Manage bilingual translations for RW/EN' },
];

async function upsertPermissions() {
  for (const permission of PERMISSIONS) {
    await client.from('permissions').upsert(permission, { onConflict: 'key' }).throwOnError();
  }
}

async function ensureRole(name: string) {
  const { data, error } = await client
    .from('admin_roles')
    .upsert({ name }, { onConflict: 'name' })
    .select()
    .single();
  if (error || !data) {
    throw new Error(error?.message ?? 'Failed to upsert admin role');
  }
  return data;
}

async function ensureUser(email: string, displayName: string) {
  const { data, error } = await client
    .from('admin_users')
    .upsert(
      {
        email,
        display_name: displayName,
        password_hash: '$2b$12$PLACEHOLDER',
        status: 'active',
      },
      { onConflict: 'email' },
    )
    .select()
    .single();
  if (error || !data) {
    throw new Error(error?.message ?? 'Failed to upsert admin user');
  }
  return data;
}

async function linkPermissionsToRole(roleId: string) {
  const { data: permissions, error } = await client
    .from('permissions')
    .select('id, key')
    .in(
      'key',
      PERMISSIONS.map((entry) => entry.key),
    );
  if (error) throw error;

  for (const perm of permissions ?? []) {
    await client
      .from('roles_permissions')
      .upsert({ role_id: roleId, permission_id: perm.id }, { onConflict: 'role_id,permission_id' })
      .throwOnError();
  }
}

async function linkUserToRole(userId: string, roleId: string) {
  await client
    .from('admin_users_roles')
    .upsert({ admin_user_id: userId, role_id: roleId }, { onConflict: 'admin_user_id,role_id' })
    .throwOnError();
}

async function main() {
  await upsertPermissions();
  const role = await ensureRole('SYSTEM_ADMIN');
  const user = await ensureUser('admin@gikundiro.app', 'System Admin');
  await linkPermissionsToRole(role.id);
  await linkUserToRole(user.id, role.id);
  console.log('Seeded admin role and user');
}

main().catch((error) => {
  console.error('Failed to seed admin data', error);
  process.exit(1);
});
