import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { FastifyRequest } from 'fastify';

import { AdminSessionGuard } from '../rbac/admin-session.guard.js';
import { AdminPermissionsGuard } from '../rbac/admin-permissions.guard.js';
import { RequireAdminPermissions } from '../rbac/permissions.decorator.js';
import { AdminFeatureFlagsService } from './admin-feature-flags.service.js';

@Controller('admin/feature-flags')
@UseGuards(AdminSessionGuard, AdminPermissionsGuard)
export class AdminFeatureFlagsController {
  constructor(private readonly service: AdminFeatureFlagsService) {}

  @Get()
  @RequireAdminPermissions('featureflag:update')
  async list() {
    const data = await this.service.list();
    return { data };
  }

  @Post()
  @RequireAdminPermissions('featureflag:update')
  async upsert(
    @Body() body: { key: string; enabled: boolean; description?: string },
    @Req() request: FastifyRequest,
  ) {
    const data = await this.service.upsert(body, request.adminUser?.id ?? null);
    return { status: 'ok', data };
  }
}

