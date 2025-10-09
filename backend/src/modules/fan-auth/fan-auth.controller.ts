import { BadRequestException, Body, Controller, Get, HttpCode, HttpStatus, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FastifyReply, FastifyRequest } from 'fastify';

import { FanAuthService } from './fan-auth.service.js';
import { FanSessionGuard } from './fan-session.guard.js';

class FinalizeOnboardingDto {
  sessionId!: string;
}

@Controller('auth/fan')
export class FanAuthController {
  private readonly isProd: boolean;

  constructor(private readonly fanAuthService: FanAuthService, private readonly configService: ConfigService) {
    this.isProd = this.configService.get<string>('app.env', 'development') === 'production';
  }

  @Post('from-onboarding')
  @HttpCode(HttpStatus.CREATED)
  async finalizeOnboarding(
    @Body() body: FinalizeOnboardingDto,
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    if (!body.sessionId) {
      throw new BadRequestException('sessionId is required');
    }
    const result = await this.fanAuthService.finalizeFromOnboarding(body.sessionId, {
      ip: request.ip,
      userAgent: request.headers['user-agent'] as string | undefined,
    });

    this.setFanCookie(reply, result.session.id);
    return { data: result };
  }

  @Post('logout')
  @UseGuards(FanSessionGuard)
  async logout(@Req() request: FastifyRequest, @Res({ passthrough: true }) reply: FastifyReply) {
    const sessionId = request.cookies?.[this.fanAuthService.cookieName];
    if (sessionId) {
      await this.fanAuthService.revokeSession(sessionId);
    }
    this.clearCookie(reply);
    return { status: 'ok' };
  }

  @Get('me')
  @UseGuards(FanSessionGuard)
  async me(@Req() request: FastifyRequest) {
    return {
      data: {
        user: request.fanUser,
        session: request.fanSession,
        onboardingStatus: request.fanOnboardingStatus,
      },
    };
  }

  private setFanCookie(reply: FastifyReply, sessionId: string) {
    const maxAgeSeconds = Math.floor(this.fanAuthService.cookieTtlMs / 1000);
    reply.setCookie(this.fanAuthService.cookieName, sessionId, {
      ...this.fanAuthService.cookieBaseOptions,
      maxAge: maxAgeSeconds,
    });
  }

  private clearCookie(reply: FastifyReply) {
    reply.clearCookie(this.fanAuthService.cookieName, this.fanAuthService.cookieBaseOptions);
  }
}
