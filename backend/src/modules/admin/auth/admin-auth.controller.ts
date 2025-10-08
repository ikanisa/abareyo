import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FastifyReply, FastifyRequest } from 'fastify';

import { AdminAuthService } from './admin-auth.service.js';
import { AdminLoginDto } from './admin-auth.dto.js';
import { LoginRateLimiterService } from './login-rate-limiter.service.js';
import { AdminSessionGuard } from '../rbac/admin-session.guard.js';

@Controller('admin')
export class AdminAuthController {
  private readonly isProd: boolean;

  constructor(
    private readonly adminAuthService: AdminAuthService,
    private readonly rateLimiter: LoginRateLimiterService,
    private readonly configService: ConfigService,
  ) {
    this.isProd = this.configService.get<string>('app.env', 'development') === 'production';
  }

  @Post('auth/login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() body: AdminLoginDto,
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    const rateKey = `${body.email.toLowerCase()}|${request.ip ?? 'unknown'}`;
    await this.rateLimiter.registerAttempt(rateKey);

    const adminUser = await this.adminAuthService.validateCredentials(body.email, body.password);
    await this.rateLimiter.reset(rateKey);

    const session = await this.adminAuthService.createSession(adminUser.id, {
      ip: request.ip,
      userAgent: request.headers['user-agent'] as string | undefined,
    });

    const activeSession = await this.adminAuthService.getActiveSession(session.id);
    if (!activeSession) {
      throw new Error('Failed to initialize admin session.');
    }

    const maxAgeSeconds = Math.floor(this.adminAuthService.cookieTtlMs / 1000);
    const cookieDomain = this.adminAuthService.cookieDomain;
    reply.setCookie(this.adminAuthService.cookieName, session.id, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: this.isProd,
      maxAge: maxAgeSeconds,
      ...(cookieDomain ? { domain: cookieDomain } : {}),
    });

    const permissions = Array.from(activeSession.permissionKeys).sort();

    return {
      data: {
        user: this.adminAuthService.mapAdminPayload(activeSession.session.adminUser),
        permissions,
      },
    };
  }

  @Post('auth/logout')
  @UseGuards(AdminSessionGuard)
  @HttpCode(HttpStatus.OK)
  async logout(@Req() request: FastifyRequest, @Res({ passthrough: true }) reply: FastifyReply) {
    const sessionId = request.cookies?.[this.adminAuthService.cookieName];
    if (sessionId) {
      await this.adminAuthService.revokeSession(sessionId);
    }

    reply.clearCookie(this.adminAuthService.cookieName, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: this.isProd,
      ...(this.adminAuthService.cookieDomain ? { domain: this.adminAuthService.cookieDomain } : {}),
    });

    return { status: 'ok' };
  }

  @Get('me')
  @UseGuards(AdminSessionGuard)
  async me(@Req() request: FastifyRequest) {
    const permissions = Array.from(request.adminPermissions ?? []).sort();
    return {
      data: {
        user: request.adminUser,
        permissions,
        session: request.adminSession,
      },
    };
  }
}
