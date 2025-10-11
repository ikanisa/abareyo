import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query, Req, UseGuards } from '@nestjs/common';
import { FastifyRequest } from 'fastify';

import { AdminSessionGuard } from '../rbac/admin-session.guard.js';
import { AdminPermissionsGuard } from '../rbac/admin-permissions.guard.js';
import { RequireAdminPermissions } from '../rbac/permissions.decorator.js';
import { AdminFundraisingService } from './admin-fundraising.service.js';
import { AdminAuditService } from '../audit/admin-audit.service.js';

@Controller('admin/fundraising')
@UseGuards(AdminSessionGuard, AdminPermissionsGuard)
export class AdminFundraisingController {
  constructor(
    private readonly service: AdminFundraisingService,
    private readonly audit: AdminAuditService,
  ) {}

  @Get('projects')
  @RequireAdminPermissions('fundraising:project:view')
  async listProjects(@Query('status') status?: string, @Query('search') search?: string) {
    const data = await this.service.listProjects({ status, search });
    return { data, meta: { page: 1, pageSize: data.length, total: data.length } };
  }

  @Post('projects')
  @RequireAdminPermissions('fundraising:project:update')
  async upsertProject(
    @Body()
    body: { id?: string; title: string; description?: string; goal: number; progress: number; status?: string; coverImage?: string },
    @Req() req: FastifyRequest,
  ) {
    const data = await this.service.upsertProject(body);
    await this.audit.record({
      adminUserId: req.adminUser?.id ?? null,
      action: body.id ? 'fundraising.project.update' : 'fundraising.project.create',
      entityType: 'fund_project',
      entityId: data.id,
      after: JSON.parse(JSON.stringify(data)) as any,
      ip: req.ip,
      userAgent: (req as any).headers?.['user-agent'] as string | undefined,
    });
    return { data };
  }

  @Get('donations')
  @RequireAdminPermissions('fundraising:donation:view')
  async listDonations(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('status') status?: string,
    @Query('projectId') projectId?: string,
    @Query('search') search?: string,
  ) {
    const { data, meta } = await this.service.listDonations({
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
      status,
      projectId,
      search,
    });
    return { data, meta };
  }

  @Post('donations/:donationId/status')
  @RequireAdminPermissions('fundraising:donation:update')
  async updateDonationStatus(
    @Param('donationId', ParseUUIDPipe) donationId: string,
    @Body() body: { status: string; note?: string },
    @Req() req: FastifyRequest,
  ) {
    const data = await this.service.updateDonationStatus(donationId, body);
    await this.audit.record({
      adminUserId: req.adminUser?.id ?? null,
      action: 'fundraising.donation.update-status',
      entityType: 'fund_donation',
      entityId: donationId,
      after: JSON.parse(JSON.stringify(data)) as any,
      ip: req.ip,
      userAgent: (req as any).headers?.['user-agent'] as string | undefined,
    });
    return { status: 'ok', data };
  }

  @Get('summary')
  @RequireAdminPermissions('fundraising:donation:view')
  async summary(@Query('from') from?: string, @Query('to') to?: string) {
    const range = { from: from ? new Date(from) : undefined, to: to ? new Date(to) : undefined } as const;
    const data = await this.service.summary({ from: range.from, to: range.to });
    return { data: { ...data, range: { from: range.from?.toISOString() ?? null, to: range.to?.toISOString() ?? null } } };
  }

  @Get('donations/export')
  @RequireAdminPermissions('fundraising:donation:view')
  async exportDonations(
    @Query('status') status?: string,
    @Query('projectId') projectId?: string,
    @Query('search') search?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const { data } = await this.service.listDonations({ page: 1, pageSize: 1000, status, projectId, search });
    const start = from ? new Date(from) : undefined;
    const end = to ? new Date(to) : undefined;
    const filtered = data.filter((d) => {
      const t = new Date(d.createdAt).getTime();
      if (start && t < start.getTime()) return false;
      if (end && t > end.getTime()) return false;
      return true;
    });
    const header = ['id', 'project', 'user', 'amount', 'status', 'createdAt'];
    const lines = [header.join(',')].concat(
      filtered.map((d) =>
        [
          d.id,
          d.project?.title ?? '',
          d.user?.phoneMask ?? '',
          String(d.amount),
          d.status,
          new Date(d.createdAt).toISOString(),
        ].join(','),
      ),
    );
    return lines.join('\n');
  }
}
