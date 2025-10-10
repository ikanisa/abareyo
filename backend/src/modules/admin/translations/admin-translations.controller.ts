import { Body, Controller, Delete, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { FastifyRequest } from 'fastify';

import { AdminSessionGuard } from '../rbac/admin-session.guard.js';
import { AdminPermissionsGuard } from '../rbac/admin-permissions.guard.js';
import { RequireAdminPermissions } from '../rbac/permissions.decorator.js';
import { AdminTranslationsService } from './admin-translations.service.js';

@Controller('admin/translations')
@UseGuards(AdminSessionGuard, AdminPermissionsGuard)
export class AdminTranslationsController {
  constructor(private readonly service: AdminTranslationsService) {}

  @Get()
  @RequireAdminPermissions('translation:view')
  async list(@Query() query: { lang?: string; page?: number; pageSize?: number; search?: string }) {
    const { data, meta } = await this.service.list(query);
    return { data, meta };
  }

  @Get('languages')
  @RequireAdminPermissions('translation:view')
  async languages() {
    const data = await this.service.languages();
    return { data };
  }

  @Post()
  @RequireAdminPermissions('translation:update')
  async upsert(@Body() body: { lang: string; key: string; value: string }, @Req() req: FastifyRequest) {
    const data = await this.service.upsert(body, req.adminUser?.id ?? null);
    return { data };
  }

  @Delete(':lang/:key')
  @RequireAdminPermissions('translation:update')
  async remove(@Param('lang') lang: string, @Param('key') key: string, @Req() req: FastifyRequest) {
    await this.service.remove(lang, key, req.adminUser?.id ?? null);
    return { status: 'ok' };
  }

  @Get('export')
  @RequireAdminPermissions('translation:view')
  async export(@Query('lang') lang: string) {
    const data = await this.service.export(lang);
    return data;
  }

  @Post('import')
  @RequireAdminPermissions('translation:update')
  async import(@Body() body: { lang: string; entries: Array<{ key: string; value: string }>; mode?: 'preview' | 'apply' }, @Req() req: FastifyRequest) {
    const data = await this.service.import(body.lang, body.entries ?? [], body.mode ?? 'preview', req.adminUser?.id ?? null);
    return { status: data.applied ? 'ok' : 'preview', data };
  }
}

