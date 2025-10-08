import { randomUUID } from 'node:crypto';

import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { compare } from 'bcryptjs';

import { PrismaService } from '../../prisma/prisma.service.js';

const HOURS_TO_MS = 60 * 60 * 1000;

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
    const adminUser = await this.prisma.adminUser.findUnique({ where: { email: normalizedEmail } });

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
