import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';

import { FanAuthService } from './fan-auth.service.js';

@Injectable()
export class FanSessionGuard implements CanActivate {
  constructor(private readonly fanAuthService: FanAuthService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const reply = context.switchToHttp().getResponse<FastifyReply>();
    const sessionId = request.cookies?.[this.fanAuthService.cookieName];

    if (!sessionId || typeof sessionId !== 'string') {
      this.clearCookie(reply);
      throw new UnauthorizedException('Fan session missing');
    }

    const session = await this.fanAuthService.getActiveSession(sessionId);
    if (!session) {
      this.clearCookie(reply);
      throw new UnauthorizedException('Fan session invalid or expired');
    }

    request.fanUser = session.user;
    request.fanSession = session.session;
    request.fanOnboardingStatus = session.onboardingStatus;

    return true;
  }

  private clearCookie(reply: FastifyReply) {
    reply.clearCookie(this.fanAuthService.cookieName, this.fanAuthService.cookieBaseOptions);
  }
}
