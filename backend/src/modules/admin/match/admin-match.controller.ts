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
import { Logger } from '@nestjs/common';

import { AdminAuditService } from '../audit/admin-audit.service.js';
import { AdminSessionGuard } from '../rbac/admin-session.guard.js';
import { AdminPermissionsGuard } from '../rbac/admin-permissions.guard.js';
import { RequireAdminPermissions } from '../rbac/permissions.decorator.js';
import { AdminMatchService } from './admin-match.service.js';
import { CreateMatchDto } from './dto/create-match.dto.js';
import { UpdateMatchDto } from './dto/update-match.dto.js';
import { CreateZoneDto } from './dto/create-zone.dto.js';
import { UpdateZoneDto } from './dto/update-zone.dto.js';
import { CreateGateDto } from './dto/create-gate.dto.js';
import { UpdateGateDto } from './dto/update-gate.dto.js';
import { RealtimeService } from '../../realtime/realtime.service.js';

@Controller('admin/match-ops')
@UseGuards(AdminSessionGuard, AdminPermissionsGuard)
export class AdminMatchController {
  private readonly logger = new Logger(AdminMatchController.name);

  constructor(
    private readonly matchService: AdminMatchService,
    private readonly auditService: AdminAuditService,
    private readonly realtime: RealtimeService,
  ) {}

  @Get('matches')
  @RequireAdminPermissions('match:update')
  async listMatches() {
    const data = await this.matchService.listMatches();
    return { data };
  }

  @Post('matches')
  @RequireAdminPermissions('match:create')
  async createMatch(@Body() body: CreateMatchDto, @Req() request: FastifyRequest) {
    const match = await this.matchService.createMatch(body);
    await this.auditService.record({
      adminUserId: request.adminUser?.id ?? null,
      action: 'match.create',
      entityType: 'match',
      entityId: match.id,
      after: serialize(match),
      ip: request.ip,
      userAgent: request.headers['user-agent'] as string | undefined,
    });
    this.realtime.notifyMatchUpdated({ matchId: match.id, status: match.status });
    this.logger.log(
      JSON.stringify({
        event: 'admin.match.create',
        adminUserId: request.adminUser?.id ?? null,
        matchId: match.id,
        opponent: match.opponent,
      }),
    );
    return { data: match };
  }

  @Put('matches/:matchId')
  @RequireAdminPermissions('match:update')
  async updateMatch(
    @Param('matchId', ParseUUIDPipe) matchId: string,
    @Body() body: UpdateMatchDto,
    @Req() request: FastifyRequest,
  ) {
    const before = await this.matchService.getMatch(matchId);
    const updated = await this.matchService.updateMatch(matchId, body);
    await this.auditService.record({
      adminUserId: request.adminUser?.id ?? null,
      action: 'match.update',
      entityType: 'match',
      entityId: matchId,
      before: serialize(before),
      after: serialize(updated),
      ip: request.ip,
      userAgent: request.headers['user-agent'] as string | undefined,
    });
    this.realtime.notifyMatchUpdated({ matchId, status: updated.status });
    this.logger.log(
      JSON.stringify({
        event: 'admin.match.update',
        adminUserId: request.adminUser?.id ?? null,
        matchId,
        status: updated.status,
      }),
    );
    return { data: updated };
  }

  @Delete('matches/:matchId')
  @RequireAdminPermissions('match:delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteMatch(@Param('matchId', ParseUUIDPipe) matchId: string, @Req() request: FastifyRequest) {
    const before = await this.matchService.getMatch(matchId);
    await this.matchService.deleteMatch(matchId);
    await this.auditService.record({
      adminUserId: request.adminUser?.id ?? null,
      action: 'match.delete',
      entityType: 'match',
      entityId: matchId,
      before: serialize(before),
      after: null,
      ip: request.ip,
      userAgent: request.headers['user-agent'] as string | undefined,
    });
    this.logger.warn(
      JSON.stringify({
        event: 'admin.match.delete',
        adminUserId: request.adminUser?.id ?? null,
        matchId,
      }),
    );
    return { status: 'ok' };
  }

  @Get('matches/:matchId/zones')
  @RequireAdminPermissions('match:update')
  async listZones(@Param('matchId', ParseUUIDPipe) matchId: string) {
    const data = await this.matchService.listZones(matchId);
    return { data };
  }

  @Post('matches/:matchId/zones')
  @RequireAdminPermissions('match:update')
  async upsertZone(
    @Param('matchId', ParseUUIDPipe) matchId: string,
    @Body() body: CreateZoneDto,
    @Req() request: FastifyRequest,
  ) {
    const before = await this.matchService.listZones(matchId);
    const zone = await this.matchService.upsertZone(matchId, body);
    await this.auditService.record({
      adminUserId: request.adminUser?.id ?? null,
      action: 'match.zone.upsert',
      entityType: 'match_zone',
      entityId: zone.id,
      before: serialize(before),
      after: serialize(zone),
      ip: request.ip,
      userAgent: request.headers['user-agent'] as string | undefined,
    });
    this.logger.log(
      JSON.stringify({
        event: 'admin.match.zone.upsert',
        adminUserId: request.adminUser?.id ?? null,
        matchId,
        zoneId: zone.id,
        name: zone.name,
      }),
    );
    return { data: zone };
  }

  @Delete('matches/:matchId/zones/:zoneId')
  @RequireAdminPermissions('match:update')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteZone(
    @Param('matchId', ParseUUIDPipe) matchId: string,
    @Param('zoneId', ParseUUIDPipe) zoneId: string,
    @Req() request: FastifyRequest,
  ) {
    const before = await this.matchService.listZones(matchId);
    await this.matchService.deleteZone(matchId, zoneId);
    await this.auditService.record({
      adminUserId: request.adminUser?.id ?? null,
      action: 'match.zone.delete',
      entityType: 'match_zone',
      entityId: zoneId,
      before: serialize(before),
      after: null,
      ip: request.ip,
      userAgent: request.headers['user-agent'] as string | undefined,
    });
    this.logger.warn(
      JSON.stringify({
        event: 'admin.match.zone.delete',
        adminUserId: request.adminUser?.id ?? null,
        matchId,
        zoneId,
      }),
    );
    return { status: 'ok' };
  }

  @Get('matches/:matchId/gates')
  @RequireAdminPermissions('gate:update')
  async listGates(@Param('matchId', ParseUUIDPipe) matchId: string) {
    const data = await this.matchService.listGates(matchId);
    return { data };
  }

  @Post('matches/:matchId/gates')
  @RequireAdminPermissions('gate:update')
  async upsertGate(
    @Param('matchId', ParseUUIDPipe) matchId: string,
    @Body() body: CreateGateDto,
    @Req() request: FastifyRequest,
  ) {
    const before = await this.matchService.listGates(matchId);
    const gate = await this.matchService.upsertGate(matchId, body);
    await this.auditService.record({
      adminUserId: request.adminUser?.id ?? null,
      action: 'match.gate.upsert',
      entityType: 'match_gate',
      entityId: gate.id,
      before: serialize(before),
      after: serialize(gate),
      ip: request.ip,
      userAgent: request.headers['user-agent'] as string | undefined,
    });
    this.logger.log(
      JSON.stringify({
        event: 'admin.match.gate.upsert',
        adminUserId: request.adminUser?.id ?? null,
        matchId,
        gateId: gate.id,
        name: gate.name,
      }),
    );
    return { data: gate };
  }

  @Delete('matches/:matchId/gates/:gateId')
  @RequireAdminPermissions('gate:update')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteGate(
    @Param('matchId', ParseUUIDPipe) matchId: string,
    @Param('gateId', ParseUUIDPipe) gateId: string,
    @Req() request: FastifyRequest,
  ) {
    const before = await this.matchService.listGates(matchId);
    await this.matchService.deleteGate(matchId, gateId);
    await this.auditService.record({
      adminUserId: request.adminUser?.id ?? null,
      action: 'match.gate.delete',
      entityType: 'match_gate',
      entityId: gateId,
      before: serialize(before),
      after: null,
      ip: request.ip,
      userAgent: request.headers['user-agent'] as string | undefined,
    });
    this.logger.warn(
      JSON.stringify({
        event: 'admin.match.gate.delete',
        adminUserId: request.adminUser?.id ?? null,
        matchId,
        gateId,
      }),
    );
    return { status: 'ok' };
  }

  @Get('matches/:matchId/scan-metrics')
  @RequireAdminPermissions('gate:update')
  async scanMetrics(@Param('matchId', ParseUUIDPipe) matchId: string) {
    const metrics = await this.matchService.getScanMetrics(matchId);
    return { data: metrics };
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
