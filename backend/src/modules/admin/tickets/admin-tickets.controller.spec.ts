import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';

import { TicketsService } from '../../tickets/tickets.service.js';
import { AdminPermissionsGuard } from '../rbac/admin-permissions.guard.js';
import { AdminSessionGuard } from '../rbac/admin-session.guard.js';
import { REQUIRED_ADMIN_PERMISSIONS_KEY } from '../rbac/permissions.decorator.js';
import { AdminTicketsController } from './admin-tickets.controller.js';

describe('AdminTicketsController', () => {
  let controller: AdminTicketsController;
  const ticketsService = {
    listGateHistory: jest.fn(),
    analytics: jest.fn(),
  } satisfies Partial<TicketsService> as TicketsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminTicketsController],
      providers: [{ provide: TicketsService, useValue: ticketsService }],
    }).compile();

    controller = module.get(AdminTicketsController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('uses admin session and permission guards', () => {
    const guards = Reflect.getMetadata('__guards__', AdminTicketsController) ?? [];

    expect(guards).toEqual(expect.arrayContaining([AdminSessionGuard, AdminPermissionsGuard]));
  });

  it('requires gate:update permission for gate history', async () => {
    ticketsService.listGateHistory = jest.fn().mockResolvedValue([{ id: 'scan-1' }]);

    const metadata = Reflect.getMetadata(
      REQUIRED_ADMIN_PERMISSIONS_KEY,
      AdminTicketsController.prototype.gateHistory,
    ) as string[];

    expect(metadata).toEqual(expect.arrayContaining(['gate:update']));

    const response = await controller.gateHistory();
    expect(response.data).toEqual([{ id: 'scan-1' }]);
  });

  it('requires ticket:order:view permission for analytics', async () => {
    ticketsService.analytics = jest.fn().mockResolvedValue({ matches: [] });

    const metadata = Reflect.getMetadata(
      REQUIRED_ADMIN_PERMISSIONS_KEY,
      AdminTicketsController.prototype.analytics,
    ) as string[];

    expect(metadata).toEqual(expect.arrayContaining(['ticket:order:view']));

    const response = await controller.analytics();
    expect(response.data).toEqual({ matches: [] });
  });
});
