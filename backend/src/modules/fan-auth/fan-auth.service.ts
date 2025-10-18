import { Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { OnboardingStatus } from '@prisma/client';
import type { User as SupabaseUser } from '@supabase/supabase-js';

import { PrismaService } from '../../prisma/prisma.service.js';
import { SupabaseFanAuthService } from './supabase-fan-auth.service.js';

const HOURS_TO_MS = 60 * 60 * 1000;

export type FanUserSummary = {
  id: string;
  status: string;
  locale: string;
  whatsappNumber?: string | null;
  momoNumber?: string | null;
};

export type FanSessionPayload = {
  session: { id: string; expiresAt: string | null };
  user: FanUserSummary;
  onboardingStatus: OnboardingStatus;
};

@Injectable()
export class FanAuthService {
  private readonly logger = new Logger(FanAuthService.name);

  private readonly isProd: boolean;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly supabaseFanAuthService: SupabaseFanAuthService,
  ) {
    this.isProd = this.configService.get<string>('app.env', 'development') === 'production';
  }

  get cookieName() {
    return this.configService.get<string>('fan.session.cookieName', 'fan_session');
  }

  get cookieTtlMs() {
    const hours = this.configService.get<number>('fan.session.ttlHours', 24 * 30);
    return (hours ?? 24 * 30) * HOURS_TO_MS;
  }

  get cookieDomain() {
    return this.configService.get<string>('fan.session.cookieDomain');
  }

  get cookieBaseOptions() {
    return {
      path: '/',
      httpOnly: true,
      sameSite: 'lax' as const,
      secure: this.isProd,
      ...(this.cookieDomain ? { domain: this.cookieDomain } : {}),
    };
  }

  async finalizeFromOnboarding(sessionId: string, metadata: { ip?: string; userAgent?: string }) {
    const onboardingSession = await this.prisma.onboardingSession.findUnique({
      where: { id: sessionId },
      include: { user: true },
    });

    if (!onboardingSession) {
      throw new NotFoundException('Onboarding session not found');
    }

    if (onboardingSession.status !== 'completed') {
      throw new UnauthorizedException('Onboarding session is not completed yet');
    }

    const userId = onboardingSession.userId;
    if (onboardingSession.user.status !== 'active') {
      await this.prisma.user.update({
        where: { id: userId },
        data: { status: 'active' },
      });
    }

    const fanSession = await this.createSession(userId, metadata);

    return this.composePayload(fanSession.id);
  }

  async loginWithSupabaseToken(accessToken: string, metadata: { ip?: string; userAgent?: string }) {
    if (!this.supabaseFanAuthService.isEnabled) {
      throw new UnauthorizedException('Supabase authentication is not available.');
    }

    const supabaseUser = await this.supabaseFanAuthService.getUserFromAccessToken(accessToken);
    await this.ensureUserFromSupabaseUser(supabaseUser);
    await this.ensureCompletedOnboarding(supabaseUser.id);

    const fanSession = await this.createSession(supabaseUser.id, metadata);
    return this.composePayload(fanSession.id);
  }

  async createSession(userId: string, metadata: { ip?: string; userAgent?: string }) {
    const now = Date.now();
    const expiresAt = new Date(now + this.cookieTtlMs);

    const session = await this.prisma.fanSession.create({
      data: {
        userId,
        expiresAt,
        ip: metadata.ip,
        userAgent: metadata.userAgent,
      },
    });

    return session;
  }

  async revokeSession(sessionId: string) {
    await this.prisma.fanSession.updateMany({
      where: { id: sessionId, revoked: false },
      data: { revoked: true, expiresAt: new Date() },
    });
  }

  async getActiveSession(sessionId: string): Promise<FanSessionPayload | null> {
    const session = await this.prisma.fanSession.findUnique({
      where: { id: sessionId },
      include: {
        user: true,
      },
    });

    if (!session || session.revoked) {
      return null;
    }

    if (session.expiresAt && session.expiresAt.getTime() < Date.now()) {
      await this.prisma.fanSession.update({
        where: { id: session.id },
        data: { revoked: true },
      });
      return null;
    }

    return this.composePayload(session.id);
  }

  async composePayload(sessionId: string): Promise<FanSessionPayload> {
    const session = await this.prisma.fanSession.findUniqueOrThrow({
      where: { id: sessionId },
      include: {
        user: true,
      },
    });

    const onboarding = await this.prisma.onboardingSession.findFirst({
      where: { userId: session.userId },
      orderBy: { updatedAt: 'desc' },
      select: { status: true },
    });

    return {
      session: {
        id: session.id,
        expiresAt: session.expiresAt ? session.expiresAt.toISOString() : null,
      },
      user: this.mapUser(session.user),
      onboardingStatus: (onboarding?.status ?? 'collecting_profile') as OnboardingStatus,
    };
  }

  mapUser(user: { id: string; locale: string; status: string; whatsappNumber: string | null; momoNumber: string | null }): FanUserSummary {
    return {
      id: user.id,
      locale: user.locale,
      status: user.status,
      whatsappNumber: user.whatsappNumber,
      momoNumber: user.momoNumber,
    };
  }

  private async ensureUserFromSupabaseUser(supabaseUser: SupabaseUser) {
    const userId = supabaseUser.id;
    if (!userId) {
      throw new UnauthorizedException('Supabase user is missing an ID.');
    }

    const locale =
      typeof supabaseUser.user_metadata?.locale === 'string' && supabaseUser.user_metadata.locale.trim().length > 0
        ? supabaseUser.user_metadata.locale
        : 'rw';

    await this.prisma.user.upsert({
      where: { id: userId },
      create: {
        id: userId,
        locale,
        status: 'active',
      },
      update: {
        locale,
        status: 'active',
      },
    });
  }

  private async ensureCompletedOnboarding(userId: string) {
    const latest = await this.prisma.onboardingSession.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: { status: true },
    });

    if (latest?.status === 'completed') {
      return;
    }

    await this.prisma.onboardingSession.create({
      data: { userId, status: 'completed' },
    });
  }
}
