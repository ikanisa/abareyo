import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { FastifyRequest } from 'fastify';

import { PrismaService } from '../../../prisma/prisma.service.js';
import { AdminAuditService } from '../audit/admin-audit.service.js';
import { AdminSessionGuard } from '../rbac/admin-session.guard.js';
import { AdminPermissionsGuard } from '../rbac/admin-permissions.guard.js';
import { RequireAdminPermissions } from '../rbac/permissions.decorator.js';
import { CreateTemplateDto } from './dto/create-template.dto.js';
import { UpdateTemplateDto } from './dto/update-template.dto.js';

@Controller('admin/ussd/templates')
@UseGuards(AdminSessionGuard, AdminPermissionsGuard)
export class AdminUssdController {
  constructor(private readonly prisma: PrismaService, private readonly auditService: AdminAuditService) {}

  @Get()
  @RequireAdminPermissions('ussd:template:update')
  async list() {
    const templates = await this.prisma.ussdTemplate.findMany({
      orderBy: { updatedAt: 'desc' },
    });
    return { data: templates };
  }

  @Post()
  @RequireAdminPermissions('ussd:template:update')
  async create(@Body() body: CreateTemplateDto, @Req() request: FastifyRequest) {
    const template = await this.prisma.ussdTemplate.create({
      data: {
        name: body.name,
        telco: body.telco,
        body: body.body,
        variables: body.variables ?? null,
        isActive: body.isActive ?? true,
        updatedById: request.adminUser?.id ?? null,
      },
    });

    await this.auditService.record({
      adminUserId: request.adminUser?.id ?? null,
      action: 'ussd.template.create',
      entityType: 'ussd_template',
      entityId: template.id,
      after: serialize(template),
      ip: request.ip,
      userAgent: request.headers['user-agent'] as string | undefined,
    });

    return { data: template };
  }

  @Put(':templateId')
  @RequireAdminPermissions('ussd:template:update')
  async update(
    @Param('templateId', ParseUUIDPipe) templateId: string,
    @Body() body: UpdateTemplateDto,
    @Req() request: FastifyRequest,
  ) {
    const before = await this.prisma.ussdTemplate.findUniqueOrThrow({ where: { id: templateId } });

    const template = await this.prisma.ussdTemplate.update({
      where: { id: templateId },
      data: {
        name: body.name ?? before.name,
        telco: body.telco ?? before.telco,
        body: body.body ?? before.body,
        variables: body.variables ?? before.variables,
        isActive: body.isActive ?? before.isActive,
        updatedById: request.adminUser?.id ?? null,
      },
    });

    await this.auditService.record({
      adminUserId: request.adminUser?.id ?? null,
      action: 'ussd.template.update',
      entityType: 'ussd_template',
      entityId: template.id,
      before: serialize(before),
      after: serialize(template),
      ip: request.ip,
      userAgent: request.headers['user-agent'] as string | undefined,
    });

    return { data: template };
  }

  @Delete(':templateId')
  @RequireAdminPermissions('ussd:template:update')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('templateId', ParseUUIDPipe) templateId: string, @Req() request: FastifyRequest) {
    const before = await this.prisma.ussdTemplate.findUniqueOrThrow({ where: { id: templateId } });

    await this.prisma.ussdTemplate.delete({ where: { id: templateId } });

    await this.auditService.record({
      adminUserId: request.adminUser?.id ?? null,
      action: 'ussd.template.delete',
      entityType: 'ussd_template',
      entityId: templateId,
      before: serialize(before),
      after: null,
      ip: request.ip,
      userAgent: request.headers['user-agent'] as string | undefined,
    });

    return { status: 'ok' };
  }

  @Post(':templateId/activate')
  @RequireAdminPermissions('ussd:template:update')
  async activate(@Param('templateId', ParseUUIDPipe) templateId: string, @Req() request: FastifyRequest) {
    const template = await this.prisma.ussdTemplate.findUniqueOrThrow({ where: { id: templateId } });

    await this.prisma.ussdTemplate.updateMany({ data: { isActive: false }, where: { telco: template.telco } });

    const updated = await this.prisma.ussdTemplate.update({
      where: { id: templateId },
      data: { isActive: true, updatedById: request.adminUser?.id ?? null },
    });

    await this.auditService.record({
      adminUserId: request.adminUser?.id ?? null,
      action: 'ussd.template.activate',
      entityType: 'ussd_template',
      entityId: templateId,
      before: serialize(template),
      after: serialize(updated),
      ip: request.ip,
      userAgent: request.headers['user-agent'] as string | undefined,
    });

    return { data: updated };
  }
}

const serialize = (value: unknown) =>
  JSON.parse(
    JSON.stringify(value, (_key, val) => {
      if (val instanceof Date) {
        return val.toISOString();
      }
      return val;
    }),
  );
