import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query, Req, UseGuards } from '@nestjs/common';
import { FastifyRequest } from 'fastify';

import { AdminSessionGuard } from '../rbac/admin-session.guard.js';
import { AdminPermissionsGuard } from '../rbac/admin-permissions.guard.js';
import { RequireAdminPermissions } from '../rbac/permissions.decorator.js';
import { AdminMembershipService } from './admin-membership.service.js';
import { AdminAuditService } from '../audit/admin-audit.service.js';

@Controller('admin/membership')
@UseGuards(AdminSessionGuard, AdminPermissionsGuard)
export class AdminMembershipController {
  constructor(
    private readonly service: AdminMembershipService,
    private readonly audit: AdminAuditService,
  ) {}

  @Get('plans')
  @RequireAdminPermissions('membership:plan:view')
  async listPlans() {
    const data = await this.service.listPlans();
    return { data };
  }

  @Post('plans')
  @RequireAdminPermissions('membership:plan:update')
  async upsertPlan(
    @Body()
    body: { id?: string; name: string; slug: string; price: number; perks: string[]; isActive?: boolean },
    @Req() req: FastifyRequest,
  ) {
    const before = body.id ? await this.service.listPlans().then((list) => list.find((p) => p.id === body.id) ?? null) : null;
    const data = await this.service.upsertPlan(body);
    await this.audit.record({
      adminUserId: req.adminUser?.id ?? null,
      action: body.id ? 'membership.plan.update' : 'membership.plan.create',
      entityType: 'membership_plan',
      entityId: data.id,
      before,
      after: data,
      ip: req.ip,
      userAgent: req.headers['user-agent'] as string | undefined,
    });
    return { data };
  }

  @Get('members')
  @RequireAdminPermissions('membership:member:view')
  async listMembers(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('status') status?: string,
    @Query('planId') planId?: string,
    @Query('search') search?: string,
  ) {
    const { data, meta } = await this.service.listMembers({
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
      status,
      planId,
      search,
    });
    return { data, meta };
  }

  @Post('members/:membershipId/status')
  @RequireAdminPermissions('membership:member:update')
  async updateMemberStatus(
    @Param('membershipId', ParseUUIDPipe) membershipId: string,
    @Body() body: { status: string; autoRenew?: boolean },
    @Req() req: FastifyRequest,
  ) {
    const before = await this.service.listMembers({ page: 1, pageSize: 1 }).then((r) => r.data.find((m) => m.id === membershipId) ?? null);
    const data = await this.service.updateMemberStatus(membershipId, body);
    await this.audit.record({
      adminUserId: req.adminUser?.id ?? null,
      action: 'membership.member.update',
      entityType: 'membership',
      entityId: membershipId,
      before,
      after: data,
      ip: req.ip,
      userAgent: req.headers['user-agent'] as string | undefined,
    });
    return { status: 'ok', data };
  }
}

