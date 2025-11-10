import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { FastifyRequest, FastifyReply } from 'fastify';

import { AdminAuthService } from '../auth/admin-auth.service.js';
import { normalizeAdminPermissions, ReadonlyAdminPermissionSet } from './admin-permission-set.js';

@Injectable()
export class AdminSessionGuard implements CanActivate {
  private readonly cookieName: string;
  private readonly isProd: boolean;

  constructor(
    private readonly adminAuthService: AdminAuthService,
    configService: ConfigService,
  ) {
    this.cookieName = configService.get<string>('admin.session.cookieName', 'admin_session');
    this.isProd = configService.get<string>('app.env', 'development') === 'production';
  }

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const reply = context.switchToHttp().getResponse<FastifyReply>();

    const sessionId = request.cookies?.[this.cookieName];
    if (!sessionId || typeof sessionId !== 'string') {
      throw new UnauthorizedException('Admin session missing');
    }

    const result = await this.adminAuthService.getActiveSession(sessionId);
    if (!result) {
      this.clearCookie(reply);
      throw new UnauthorizedException('Admin session invalid or expired');
    }

    const { session, permissionKeys, user } = result;
    request.adminUser = user;

    let normalizedPermissions: ReadonlyAdminPermissionSet;
    try {
      normalizedPermissions = normalizeAdminPermissions(permissionKeys);
    } catch (error) {
      this.clearCookie(reply);
      throw new UnauthorizedException('Admin session invalid or expired');
    }

    Object.defineProperty(request, 'adminPermissions', {
      configurable: false,
      enumerable: false,
      writable: false,
      value: normalizedPermissions,
    });
    request.adminSession = {
      id: session.id,
      expiresAt: session.expiresAt?.toISOString() ?? null,
    };

    return true;
  }

  private clearCookie(reply: FastifyReply) {
    reply.clearCookie(this.cookieName, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: this.isProd,
    });
  }
}
