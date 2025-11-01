import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { FastifyRequest } from 'fastify';

import { OtpMonitorService } from '../../otp/otp-monitor.service.js';
import { OtpAbuseService } from '../../otp/otp-abuse.service.js';
import { UpdateBlacklistDto, RemoveBlacklistDto } from '../../otp/dto/update-blacklist.dto.js';
import { AdminSessionGuard } from '../rbac/admin-session.guard.js';
import { AdminPermissionsGuard } from '../rbac/admin-permissions.guard.js';
import { RequireAdminPermissions } from '../rbac/permissions.decorator.js';

@Controller('admin/otp')
@UseGuards(AdminSessionGuard, AdminPermissionsGuard)
export class AdminOtpController {
  private readonly logger = new Logger(AdminOtpController.name);

  constructor(
    private readonly monitor: OtpMonitorService,
    private readonly abuse: OtpAbuseService,
  ) {}

  @Get('dashboard')
  @RequireAdminPermissions('otp:view')
  async dashboard() {
    const data = await this.monitor.getDashboard();
    return { data };
  }

  @Get('blacklist')
  @RequireAdminPermissions('otp:view')
  async blacklist() {
    const [phone, ip] = await Promise.all([
      this.abuse.listPhoneBlacklist(),
      this.abuse.listIpBlacklist(),
    ]);
    return { data: { phone, ip } };
  }

  @Post('blacklist')
  @RequireAdminPermissions('otp:blacklist:update')
  @HttpCode(HttpStatus.CREATED)
  async add(@Body() body: UpdateBlacklistDto, @Req() request: FastifyRequest) {
    let entry;
    if (body.type === 'phone') {
      entry = await this.abuse.addPhoneToBlacklist(body.value, body.note);
    } else {
      entry = await this.abuse.addIpToBlacklist(body.value, body.note);
    }

    this.logger.warn(
      JSON.stringify({
        event: 'admin.otp.blacklist.add',
        adminUserId: request.adminUser?.id ?? null,
        type: body.type,
        value: entry.value,
      }),
    );

    return { data: entry };
  }

  @Delete('blacklist')
  @RequireAdminPermissions('otp:blacklist:update')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Body() body: RemoveBlacklistDto, @Req() request: FastifyRequest) {
    if (body.type === 'phone') {
      await this.abuse.removePhoneFromBlacklist(body.value);
    } else {
      await this.abuse.removeIpFromBlacklist(body.value);
    }

    this.logger.warn(
      JSON.stringify({
        event: 'admin.otp.blacklist.remove',
        adminUserId: request.adminUser?.id ?? null,
        type: body.type,
        value: body.value,
      }),
    );
  }
}
