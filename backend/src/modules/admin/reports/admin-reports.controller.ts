import { Controller, Get, Query, UseGuards } from '@nestjs/common';

import { AdminSessionGuard } from '../rbac/admin-session.guard.js';
import { AdminPermissionsGuard } from '../rbac/admin-permissions.guard.js';
import { RequireAdminPermissions } from '../rbac/permissions.decorator.js';
import { AdminReportsService } from './admin-reports.service.js';

@Controller('admin/reports')
@UseGuards(AdminSessionGuard, AdminPermissionsGuard)
export class AdminReportsController {
  constructor(private readonly service: AdminReportsService) {}

  @Get('overview')
  @RequireAdminPermissions('reports:view')
  async overview(@Query('from') from?: string, @Query('to') to?: string) {
    const range = { from: from ? new Date(from) : undefined, to: to ? new Date(to) : undefined } as const;
    const data = await this.service.overview({ from: range.from, to: range.to });
    return { data: { ...data, range: { from: range.from?.toISOString() ?? null, to: range.to?.toISOString() ?? null } } };
  }
}

