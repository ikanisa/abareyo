import { randomUUID } from 'node:crypto';

import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { compare, hash } from 'bcryptjs';

import { PrismaService } from '../../../prisma/prisma.service.js';

const HOURS_TO_MS = 60 * 60 * 1000;

const SYSTEM_ADMIN_ROLE_NAME = 'SYSTEM_ADMIN';
const DEFAULT_PERMISSION_KEYS = [
  'match:create',
  'match:update',
  'match:delete',
  'ticket:price:update',
  'ticket:order:view',
  'ticket:order:refund',
  'ticket:order:resend',
  'order:shop:update',
  'order:shop:view',
  'shop:order:view',
  'shop:order:update',
  'order:donation:export',
  'order:donation:view',
  'sms:attach',
  'sms:retry',
  'sms:view',
  'sms:parser:update',
  'gate:update',
  'membership:plan:create',
  'membership:plan:update',
  'membership:plan:view',
  'membership:member:view',
  'membership:member:update',
  'product:crud',
  'inventory:adjust',
  'fundraising:project:view',
  'fundraising:project:update',
  'fundraising:donation:view',
  'fundraising:donation:update',
  'community:post:schedule',
  'post:moderate',
  'content:page:publish',
  'ussd:template:update',
  'admin:user:crud',
  'admin:role:assign',
  'admin:permission:update',
  'audit:view',
  'featureflag:update',
  'translation:view',
  'translation:update',
  'report:download',
  'reports:view',
];

export type AdminUserSummary = {
  id: string;
  email: string;
  displayName: string;
  status: string;
  roles: string[];
};

@Injectable()
export class AdminAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  get cookieName() {
    return this.configService.get<string>('admin.session.cookieName', 'admin_session');
  }

  get cookieTtlMs() {
    const hours = this.configService.get<number>('admin.session.ttlHours', 24);
    return (hours ?? 24) * HOURS_TO_MS;
  }

  get cookieDomain() {
    return this.configService.get<string>('admin.session.cookieDomain');
  }

  async validateCredentials(email: string, password: string) {
    const normalizedEmail = email.trim().toLowerCase();
    let adminUser = await this.prisma.adminUser.findUnique({ where: { email: normalizedEmail } });

    if (!adminUser) {
      adminUser = await this.bootstrapDefaultAdmin(normalizedEmail, password);
    }

    if (!adminUser) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (adminUser.status !== 'active') {
      throw new ForbiddenException('This admin account is not active.');
    }

    const passwordMatches = await compare(password, adminUser.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return adminUser;
  }

  async findActiveAdminByEmail(email: string) {
    const normalizedEmail = email.trim().toLowerCase();
    let adminUser = await this.prisma.adminUser.findUnique({ where: { email: normalizedEmail } });

    if (!adminUser) {
      const defaultPassword = this.configService.get<string>('admin.defaultAccount.password') ?? '';
      adminUser = await this.bootstrapDefaultAdmin(normalizedEmail, defaultPassword);
    }

    if (!adminUser) {
      throw new UnauthorizedException('No admin account is registered for this email.');
    }

    if (adminUser.status !== 'active') {
      throw new ForbiddenException('This admin account is not active.');
    }

    return adminUser;
  }

  private async bootstrapDefaultAdmin(email: string, password: string) {
    const defaultEmail =
      this.configService.get<string>('admin.defaultAccount.email')?.trim().toLowerCase() ?? '';
    const defaultPassword = this.configService.get<string>('admin.defaultAccount.password');
    const defaultName = this.configService.get<string>('admin.defaultAccount.name') ?? 'System Admin';

    if (!defaultEmail || !defaultPassword || email !== defaultEmail) {
      return null;
    }

    if (password !== defaultPassword) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordHash = await hash(defaultPassword, 10);

    const adminUser = await this.prisma.adminUser.upsert({
      where: { email },
      update: {
        passwordHash,
        displayName: defaultName,
        status: 'active',
      },
      create: {
        email,
        passwordHash,
        displayName: defaultName,
        status: 'active',
      },
    });

    await this.ensureSystemAdminRole(adminUser.id);

    return adminUser;
  }

  private async ensureSystemAdminRole(adminUserId: string) {
    await this.prisma.permission.createMany({
      data: DEFAULT_PERMISSION_KEYS.map((key) => ({ key })),
      skipDuplicates: true,
    });

    const systemAdminRole = await this.prisma.adminRole.upsert({
      where: { name: SYSTEM_ADMIN_ROLE_NAME },
      update: {},
      create: {
        name: SYSTEM_ADMIN_ROLE_NAME,
        description: 'Grants unrestricted access to all admin capabilities.',
      },
    });

    const permissions = await this.prisma.permission.findMany({
      where: { key: { in: DEFAULT_PERMISSION_KEYS } },
      select: { id: true },
    });

    await this.prisma.rolePermission.createMany({
      data: permissions.map((permission) => ({
        roleId: systemAdminRole.id,
        permissionId: permission.id,
      })),
      skipDuplicates: true,
    });

    await this.prisma.adminUsersOnRoles.upsert({
      where: {
        adminUserId_roleId: {
          adminUserId,
          roleId: systemAdminRole.id,
        },
      },
      update: {},
      create: {
        adminUserId,
        roleId: systemAdminRole.id,
      },
    });
  }

  async createSession(adminUserId: string, metadata: { ip?: string; userAgent?: string }) {
    const now = Date.now();
    const expiresAt = new Date(now + this.cookieTtlMs);

    const session = await this.prisma.adminSession.create({
      data: {
        id: randomUUID(),
        adminUserId,
        expiresAt,
        ip: metadata.ip,
        userAgent: metadata.userAgent,
      },
    });

    await this.prisma.adminUser.update({
      where: { id: adminUserId },
      data: { lastLoginAt: new Date(now) },
    });

    return session;
  }

  async revokeSession(sessionId: string) {
    await this.prisma.adminSession.updateMany({
      where: { id: sessionId, revoked: false },
      data: { revoked: true, expiresAt: new Date() },
    });
  }

  async getActiveSession(sessionId: string) {
    const session = await this.prisma.adminSession.findUnique({
      where: { id: sessionId },
      include: {
        adminUser: {
          include: {
            roles: {
              include: {
                role: true,
              },
            },
          },
        },
      },
    });

    if (!session || session.revoked) {
      return null;
    }

    if (session.expiresAt && session.expiresAt.getTime() < Date.now()) {
      await this.prisma.adminSession.update({
        where: { id: session.id },
        data: { revoked: true },
      });
      return null;
    }

    const roleIds = session.adminUser.roles.map((assignment) => assignment.roleId);
    const permissionKeys = new Set<string>();

    if (roleIds.length) {
      const permissions = await this.prisma.rolePermission.findMany({
        where: { roleId: { in: roleIds } },
        include: { permission: true },
      });

      for (const record of permissions) {
        permissionKeys.add(record.permission.key);
      }
    }

    return { session, permissionKeys, user: this.mapAdminPayload(session.adminUser) };
  }

  mapAdminPayload(
    admin: Prisma.AdminUserGetPayload<{ include: { roles: { include: { role: true } } } }>,
  ): AdminUserSummary {
    return {
      id: admin.id,
      email: admin.email,
      displayName: admin.displayName,
      status: admin.status,
      roles: admin.roles.map((assignment) => assignment.role.name),
    };
  }
}
