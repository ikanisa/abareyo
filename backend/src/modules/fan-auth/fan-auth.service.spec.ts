import { ConfigService } from '@nestjs/config';

import { FanAuthService } from './fan-auth.service.js';

describe('FanAuthService', () => {
  const prisma = createMockPrisma();

  const config = new ConfigService({
    app: { env: 'test' },
    fan: {
      session: {
        cookieName: 'fan_session',
        secret: 'secret',
        ttlHours: 24,
      },
    },
  });

  const service = new FanAuthService(prisma as any, config as any);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a session from completed onboarding', async () => {
    const onboardingSession = {
      id: 'onboarding-1',
      userId: 'user-1',
      status: 'completed',
      user: {
        id: 'user-1',
        status: 'onboarding',
        locale: 'rw',
        whatsappNumber: '+250700000001',
        momoNumber: '+250780000001',
      },
    };

    (prisma.onboardingSession.findUnique as jest.Mock).mockResolvedValue(onboardingSession);
    (prisma.fanSession.create as jest.Mock).mockResolvedValue({ id: 'fan-session-1', userId: 'user-1', expiresAt: new Date(Date.now() + 1000) });
    (prisma.fanSession.findUniqueOrThrow as jest.Mock).mockResolvedValue({
      id: 'fan-session-1',
      userId: 'user-1',
      expiresAt: new Date(Date.now() + 1000),
      user: onboardingSession.user,
    });
    (prisma.onboardingSession.findFirst as jest.Mock).mockResolvedValue({ status: 'completed' });

    const result = await service.finalizeFromOnboarding('onboarding-1', { ip: '1.1.1.1', userAgent: 'jest' });

    expect(prisma.onboardingSession.findUnique).toHaveBeenCalledWith({
      where: { id: 'onboarding-1' },
      include: { user: true },
    });
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { status: 'active' },
    });
    expect(prisma.fanSession.create).toHaveBeenCalled();
    expect(result.user.id).toBe('user-1');
    expect(result.onboardingStatus).toBe('completed');
  });

  it('returns null for revoked or expired sessions', async () => {
    (prisma.fanSession.findUnique as jest.Mock).mockResolvedValue({
      id: 'fan-session-2',
      userId: 'user-1',
      revoked: true,
    });

    const result = await service.getActiveSession('fan-session-2');
    expect(result).toBeNull();
  });

  it('returns payload for active session', async () => {
    const future = new Date(Date.now() + 10_000);
    (prisma.fanSession.findUnique as jest.Mock).mockResolvedValue({
      id: 'fan-session-3',
      userId: 'user-1',
      revoked: false,
      expiresAt: future,
    });
    (prisma.fanSession.findUniqueOrThrow as jest.Mock).mockResolvedValue({
      id: 'fan-session-3',
      userId: 'user-1',
      expiresAt: future,
      user: {
        id: 'user-1',
        status: 'active',
        locale: 'rw',
        whatsappNumber: null,
        momoNumber: null,
      },
    });
    (prisma.onboardingSession.findFirst as jest.Mock).mockResolvedValue({ status: 'collecting_profile' });

    const result = await service.getActiveSession('fan-session-3');
    expect(result?.session.id).toBe('fan-session-3');
    expect(result?.onboardingStatus).toBe('collecting_profile');
  });
});

function createMockPrisma() {
  return {
    onboardingSession: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
    },
    fanSession: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    user: {
      update: jest.fn(),
    },
  };
}
