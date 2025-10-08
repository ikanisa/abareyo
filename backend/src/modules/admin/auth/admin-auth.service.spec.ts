import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { AdminAuthService } from './admin-auth.service.js';

jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
}));

const { compare } = jest.requireMock('bcryptjs') as { compare: jest.Mock };

const createMockPrisma = () => ({
  adminUser: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  adminSession: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
  rolePermission: {
    findMany: jest.fn(),
  },
});

describe('AdminAuthService', () => {
  const configService = {
    get: jest.fn((key: string, defaultValue?: unknown) => {
      switch (key) {
        case 'admin.session.cookieName':
          return 'admin_session';
        case 'admin.session.ttlHours':
          return 1;
        default:
          return defaultValue;
      }
    }),
  };

  const mockPrisma = createMockPrisma();
  const service = new AdminAuthService(mockPrisma as any, configService as any);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateCredentials', () => {
    const baseUser = {
      id: 'admin-id',
      email: 'admin@example.com',
      displayName: 'Admin',
      passwordHash: 'hash',
      status: 'active',
    } as const;

    it('returns admin user when credentials are valid', async () => {
      (mockPrisma.adminUser.findUnique as jest.Mock).mockResolvedValue(baseUser);
      compare.mockResolvedValue(true);

      const result = await service.validateCredentials('Admin@example.com ', 'super-secret');

      expect(mockPrisma.adminUser.findUnique).toHaveBeenCalledWith({ where: { email: 'admin@example.com' } });
      expect(compare).toHaveBeenCalledWith('super-secret', baseUser.passwordHash);
      expect(result).toEqual(baseUser);
    });

    it('throws Unauthorized when user not found', async () => {
      (mockPrisma.adminUser.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.validateCredentials('missing@example.com', 'pwd')).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('throws Forbidden when account inactive', async () => {
      (mockPrisma.adminUser.findUnique as jest.Mock).mockResolvedValue({ ...baseUser, status: 'disabled' });

      await expect(service.validateCredentials('admin@example.com', 'pwd')).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('throws Unauthorized when password mismatch', async () => {
      (mockPrisma.adminUser.findUnique as jest.Mock).mockResolvedValue(baseUser);
      compare.mockResolvedValue(false);

      await expect(service.validateCredentials('admin@example.com', 'bad')).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  describe('createSession', () => {
    it('creates session and updates last login', async () => {
      const now = Date.now();
      jest.spyOn(Date, 'now').mockReturnValue(now);
      (mockPrisma.adminSession.create as jest.Mock).mockResolvedValue({
        id: 'session-id',
        adminUserId: 'admin-id',
        expiresAt: new Date(now + 60_000),
      });

      const session = await service.createSession('admin-id', {});

      expect(mockPrisma.adminSession.create).toHaveBeenCalled();
      expect(mockPrisma.adminUser.update).toHaveBeenCalledWith({
        where: { id: 'admin-id' },
        data: { lastLoginAt: new Date(now) },
      });
      expect(session.id).toBe('session-id');
    });
  });

  describe('getActiveSession', () => {
    it('returns null when session revoked', async () => {
      (mockPrisma.adminSession.findUnique as jest.Mock).mockResolvedValue({ revoked: true });

      const result = await service.getActiveSession('session-id');
      expect(result).toBeNull();
    });

    it('returns session payload with permissions', async () => {
      const future = new Date(Date.now() + 60_000);
      (mockPrisma.adminSession.findUnique as jest.Mock).mockResolvedValue({
        id: 'session-id',
        revoked: false,
        expiresAt: future,
        adminUser: {
          id: 'admin-id',
          email: 'admin@example.com',
          displayName: 'Admin',
          status: 'active',
          roles: [
            {
              roleId: 'role-id',
              role: { name: 'SYSTEM_ADMIN' },
            },
          ],
        },
      });
      (mockPrisma.rolePermission.findMany as jest.Mock).mockResolvedValue([
        { permission: { key: 'ticket:order:view' } },
      ]);

      const result = await service.getActiveSession('session-id');

      expect(result?.user.roles).toEqual(['SYSTEM_ADMIN']);
      expect(result?.permissionKeys.has('ticket:order:view')).toBe(true);
    });
  });
});
