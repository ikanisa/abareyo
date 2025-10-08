import {
  BadRequestException,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { FastifyRequest } from 'fastify';

import { TicketOrderStatus } from '@prisma/client';

import { RequireAdminPermissions } from '../rbac/permissions.decorator.js';
import { AdminSessionGuard } from '../rbac/admin-session.guard.js';
import { AdminPermissionsGuard } from '../rbac/admin-permissions.guard.js';
import { AdminOrdersService, TicketOrderDetail } from './admin-orders.service.js';
import { AdminAuditService } from '../audit/admin-audit.service.js';
import { AdminUserSummary } from '../auth/admin-auth.service.js';

@Controller('admin')
@UseGuards(AdminSessionGuard, AdminPermissionsGuard)
export class AdminOrdersController {
  constructor(
    private readonly ordersService: AdminOrdersService,
    private readonly auditService: AdminAuditService,
  ) {}

  @Get('ticket-orders')
  @RequireAdminPermissions('ticket:order:view')
  async listTicketOrders(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    let normalizedStatus: TicketOrderStatus | 'all' | undefined = 'all';
    if (status) {
      if (status === 'all') {
        normalizedStatus = 'all';
      } else if (Object.values(TicketOrderStatus).includes(status as TicketOrderStatus)) {
        normalizedStatus = status as TicketOrderStatus;
      } else {
        throw new BadRequestException('Unknown ticket order status filter');
      }
    }

    const result = await this.ordersService.listTicketOrders({
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
      status: normalizedStatus,
      search,
    });
    return { data: result.data, meta: result.meta };
  }

  @Get('ticket-orders/:orderId')
  @RequireAdminPermissions('ticket:order:view')
  async getTicketOrder(@Param('orderId', ParseUUIDPipe) orderId: string) {
    const order = await this.ordersService.getTicketOrder(orderId);
    return { data: order };
  }

  @Post('ticket-orders/:orderId/refund')
  @RequireAdminPermissions('ticket:order:refund')
  @HttpCode(HttpStatus.ACCEPTED)
  async refundOrder(@Param('orderId', ParseUUIDPipe) orderId: string, @Req() request: FastifyRequest) {
    const before = await this.ordersService.getTicketOrder(orderId);
    const updated = await this.ordersService.markTicketOrderRefunded(orderId, request.adminUser?.id ?? 'unknown');

    const beforeSnapshot = serializeOrder(before);
    const afterSnapshot = serializeOrder(updated as TicketOrderDetail);

    await this.auditService.record({
      adminUserId: request.adminUser?.id ?? null,
      action: 'ticket-order.refund',
      entityType: 'ticket_order',
      entityId: orderId,
      before: beforeSnapshot,
      after: afterSnapshot,
      ip: request.ip,
      userAgent: request.headers['user-agent'] as string | undefined,
    });

    return { status: 'ok', data: updated };
  }

  @Get('shop-orders')
  @RequireAdminPermissions('order:shop:view')
  async listShopOrders(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    const result = await this.ordersService.listShopOrders({
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
      status,
      search,
    });
    return { data: result.data, meta: result.meta };
  }

  @Get('donations')
  @RequireAdminPermissions('order:donation:view')
  async listDonations(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('projectId') projectId?: string,
  ) {
    const result = await this.ordersService.listDonations({
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
      projectId,
    });
    return { data: result.data, meta: result.meta };
  }
}

const serializeOrder = (order: TicketOrderDetail) => {
  return JSON.parse(
    JSON.stringify(order, (_key, value) => {
      if (value instanceof Date) {
        return value.toISOString();
      }
      return value;
    }),
  );
};
