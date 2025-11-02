import { Controller, Get, UseGuards } from '@nestjs/common';

import { TicketsService } from '../../tickets/tickets.service.js';
import { AdminSessionGuard } from '../rbac/admin-session.guard.js';
import { AdminPermissionsGuard } from '../rbac/admin-permissions.guard.js';
import { RequireAdminPermissions } from '../rbac/permissions.decorator.js';

@Controller('admin/tickets')
@UseGuards(AdminSessionGuard, AdminPermissionsGuard)
export class AdminTicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Get('gate/history')
  @RequireAdminPermissions('gate:update')
  async gateHistory() {
    const data = await this.ticketsService.listGateHistory();
    return { data };
  }

  @Get('analytics')
  @RequireAdminPermissions('ticket:order:view')
  async analytics() {
    const data = await this.ticketsService.analytics();
    return { data };
  }
}

