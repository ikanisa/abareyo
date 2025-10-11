import { Body, Controller, Get, Post, Query, Param, ParseUUIDPipe, Req, UseGuards } from '@nestjs/common';
import { FastifyRequest } from 'fastify';

import { AdminSessionGuard } from '../rbac/admin-session.guard.js';
import { AdminPermissionsGuard } from '../rbac/admin-permissions.guard.js';
import { RequireAdminPermissions } from '../rbac/permissions.decorator.js';
import { AdminShopService } from './admin-shop.service.js';
import { AdminAuditService } from '../audit/admin-audit.service.js';

@Controller('admin/shop')
@UseGuards(AdminSessionGuard, AdminPermissionsGuard)
export class AdminShopController {
  constructor(
    private readonly service: AdminShopService,
    private readonly audit: AdminAuditService,
  ) {}

  @Get('orders')
  @RequireAdminPermissions('shop:order:view')
  async listOrders(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    const { data, meta } = await this.service.listOrders({
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
      status,
      search,
    });
    return { data, meta };
  }

  @Post('orders/:orderId/status')
  @RequireAdminPermissions('shop:order:update')
  async updateStatus(
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @Body() body: { status: string; note?: string },
    @Req() req: FastifyRequest,
  ) {
    const { before, after } = await this.service.updateStatus(orderId, { ...body, adminUserId: req.adminUser?.id ?? null });
    await this.audit.record({
      adminUserId: req.adminUser?.id ?? null,
      action: 'shop.order.update-status',
      entityType: 'order',
      entityId: orderId,
      before: before ? (JSON.parse(JSON.stringify(before)) as any) : null,
      after: after ? (JSON.parse(JSON.stringify(after)) as any) : null,
      ip: req.ip,
      userAgent: (req as any).headers?.['user-agent'] as string | undefined,
    });
    return { status: 'ok', data: after };
  }

  @Post('orders/:orderId/note')
  @RequireAdminPermissions('shop:order:update')
  async addNote(
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @Body() body: { note: string },
    @Req() req: FastifyRequest,
  ) {
    const { before, after } = await this.service.addNote(orderId, body.note, req.adminUser?.id ?? null);
    await this.audit.record({
      adminUserId: req.adminUser?.id ?? null,
      action: 'shop.order.add-note',
      entityType: 'order',
      entityId: orderId,
      before: before ? (JSON.parse(JSON.stringify(before)) as any) : null,
      after: after ? (JSON.parse(JSON.stringify(after)) as any) : null,
      ip: req.ip,
      userAgent: (req as any).headers?.['user-agent'] as string | undefined,
    });
    return { status: 'ok', data: after };
  }

  @Post('orders/:orderId/tracking')
  @RequireAdminPermissions('shop:order:update')
  async updateTracking(
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @Body() body: { trackingNumber?: string },
    @Req() req: FastifyRequest,
  ) {
    const { before, after } = await this.service.updateTracking(orderId, body.trackingNumber);
    await this.audit.record({
      adminUserId: req.adminUser?.id ?? null,
      action: 'shop.order.update-tracking',
      entityType: 'order',
      entityId: orderId,
      before: before ? (JSON.parse(JSON.stringify(before)) as any) : null,
      after: after ? (JSON.parse(JSON.stringify(after)) as any) : null,
      ip: req.ip,
      userAgent: (req as any).headers?.['user-agent'] as string | undefined,
    });
    return { status: 'ok', data: after };
  }

  @Post('orders/status/batch')
  @RequireAdminPermissions('shop:order:update')
  async batchUpdateStatus(@Body() body: { orderIds: string[]; status: string; note?: string }, @Req() req: FastifyRequest) {
    const results = await this.service.batchUpdateStatus(body.orderIds ?? [], {
      status: body.status,
      note: body.note,
      adminUserId: req.adminUser?.id ?? null,
    });
    for (const r of results) {
      await this.audit.record({
        adminUserId: req.adminUser?.id ?? null,
        action: 'shop.order.batch-update-status',
        entityType: 'order',
        entityId: (r.after as any)?.id ?? null,
        before: r.before ? (JSON.parse(JSON.stringify(r.before)) as any) : null,
        after: r.after ? (JSON.parse(JSON.stringify(r.after)) as any) : null,
        ip: req.ip,
        userAgent: (req as any).headers?.['user-agent'] as string | undefined,
      });
    }
    return { status: 'ok', data: results.map((r) => r.after) };
  }

  @Get('summary')
  @RequireAdminPermissions('shop:order:view')
  async summary(@Query('from') from?: string, @Query('to') to?: string) {
    const range = { from: from ? new Date(from) : undefined, to: to ? new Date(to) : undefined } as const;
    const data = await this.service.summary({ from: range.from, to: range.to });
    return { data: { ...data, range: { from: range.from?.toISOString() ?? null, to: range.to?.toISOString() ?? null } } };
  }
}
