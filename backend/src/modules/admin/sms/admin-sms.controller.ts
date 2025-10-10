import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import { Logger } from '@nestjs/common';

import { SmsService } from '../../sms/sms.service.js';
import { PaymentsService } from '../../payments/payments.service.js';
import { SmsParserService } from '../../sms/sms.parser.js';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { AdminAuditService } from '../audit/admin-audit.service.js';
import { AdminSessionGuard } from '../rbac/admin-session.guard.js';
import { AdminPermissionsGuard } from '../rbac/admin-permissions.guard.js';
import { RequireAdminPermissions } from '../rbac/permissions.decorator.js';
import { ManualAttachDto } from './dto/manual-attach.dto.js';
import { ParserTestDto } from './dto/parser-test.dto.js';
import { CreatePromptDto } from './dto/create-prompt.dto.js';
import { ManualDismissDto } from './dto/manual-dismiss.dto.js';

@Controller('admin/sms')
@UseGuards(AdminSessionGuard, AdminPermissionsGuard)
export class AdminSmsController {
  private readonly logger = new Logger(AdminSmsController.name);

  constructor(
    private readonly smsService: SmsService,
    private readonly paymentsService: PaymentsService,
    private readonly parserService: SmsParserService,
    private readonly prisma: PrismaService,
    private readonly auditService: AdminAuditService,
  ) {}

  @Get('inbound')
  @RequireAdminPermissions('sms:view')
  async listInbound(@Query('limit') limit?: string) {
    const take = limit ? Math.min(Math.max(Number(limit), 1), 200) : 50;
    const data = await this.smsService.listRecentSms(take);
    return { data };
  }

  @Get('manual')
  @RequireAdminPermissions('sms:attach')
  async listManualSms(@Query('limit') limit?: string) {
    const take = limit ? Math.min(Math.max(Number(limit), 1), 200) : 50;
    const data = await this.smsService.listManualReviewSms(take);
    return { data };
  }

  @Get('manual/payments')
  @RequireAdminPermissions('sms:attach')
  async listManualPayments(@Query('limit') limit?: string) {
    const take = limit ? Math.min(Math.max(Number(limit), 1), 200) : 50;
    const data = await this.paymentsService.listManualReviewPayments(take);
    return { data };
  }

  @Post('manual/attach')
  @RequireAdminPermissions('sms:attach')
  @HttpCode(HttpStatus.ACCEPTED)
  async attachSms(
    @Body() body: ManualAttachDto,
    @Req() request: FastifyRequest,
  ) {
    const beforePayment = await this.prisma.payment.findUnique({
      where: { id: body.paymentId },
      include: {
        smsParsed: true,
      },
    });

    const result = await this.smsService.attachSmsToPayment(body.smsId, body.paymentId);

    await this.auditService.record({
      adminUserId: request.adminUser?.id ?? null,
      action: 'sms.manual_attach',
      entityType: 'payment',
      entityId: body.paymentId,
      before: beforePayment ? serialize(beforePayment) : null,
      after: serialize(result),
      ip: request.ip,
      userAgent: request.headers['user-agent'] as string | undefined,
    });

    this.logger.log(
      JSON.stringify({
        event: 'admin.sms.manual_attach',
        adminUserId: request.adminUser?.id ?? null,
        paymentId: body.paymentId,
        smsId: body.smsId,
      }),
    );

    return { status: 'ok', data: result };
  }

  @Post('parser/test')
  @RequireAdminPermissions('sms:parser:update')
  async testParser(@Body() body: ParserTestDto, @Req() request: FastifyRequest) {
    const result = await this.parserService.parseSample(body.text, {
      promptBody: body.promptBody,
      promptId: body.promptId,
    });
    this.logger.debug(
      JSON.stringify({
        event: 'admin.sms.parser_test',
        adminUserId: request.adminUser?.id ?? null,
        promptId: body.promptId ?? null,
        hasCustomPrompt: Boolean(body.promptBody),
        confidence: result?.confidence ?? null,
      }),
    );
    return { data: result };
  }

  @Get('parser/prompts')
  @RequireAdminPermissions('sms:parser:update')
  async listPrompts() {
    const prompts = await this.prisma.smsParserPrompt.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return { data: prompts };
  }

  @Get('parser/prompts/active')
  @RequireAdminPermissions('sms:parser:update')
  async activePrompt() {
    const prompt = await this.prisma.smsParserPrompt.findFirst({
      where: { isActive: true },
      orderBy: { version: 'desc' },
    });
    return { data: prompt ?? null };
  }

  @Post('parser/prompts')
  @RequireAdminPermissions('sms:parser:update')
  async createPrompt(@Body() body: CreatePromptDto, @Req() request: FastifyRequest) {
    const maxVersion = await this.prisma.smsParserPrompt.aggregate({ _max: { version: true } });
    const version = (maxVersion._max.version ?? 0) + 1;

    const prompt = await this.prisma.smsParserPrompt.create({
      data: {
        label: body.label,
        body: body.body,
        version: body.version ?? version,
        createdById: request.adminUser?.id ?? null,
      },
    });

    await this.auditService.record({
      adminUserId: request.adminUser?.id ?? null,
      action: 'sms.parser.prompt.create',
      entityType: 'sms_parser_prompt',
      entityId: prompt.id,
      after: serialize(prompt),
      ip: request.ip,
      userAgent: request.headers['user-agent'] as string | undefined,
    });

    this.logger.log(
      JSON.stringify({
        event: 'admin.sms.prompt.create',
        adminUserId: request.adminUser?.id ?? null,
        promptId: prompt.id,
        version: prompt.version,
      }),
    );

    return { data: prompt };
  }

  @Post('parser/prompts/:promptId/activate')
  @RequireAdminPermissions('sms:parser:update')
  async activatePrompt(@Param('promptId', ParseUUIDPipe) promptId: string, @Req() request: FastifyRequest) {
    const prompt = await this.prisma.smsParserPrompt.findUnique({ where: { id: promptId } });
    if (!prompt) {
      throw new Error('Prompt not found');
    }

    await this.prisma.smsParserPrompt.updateMany({ data: { isActive: false } });
    const updated = await this.prisma.smsParserPrompt.update({
      where: { id: promptId },
      data: { isActive: true },
    });

    await this.auditService.record({
      adminUserId: request.adminUser?.id ?? null,
      action: 'sms.parser.prompt.activate',
      entityType: 'sms_parser_prompt',
      entityId: promptId,
      before: serialize(prompt),
      after: serialize(updated),
      ip: request.ip,
      userAgent: request.headers['user-agent'] as string | undefined,
    });

    this.logger.log(
      JSON.stringify({
        event: 'admin.sms.prompt.activate',
        adminUserId: request.adminUser?.id ?? null,
        promptId,
      }),
    );

    return { data: updated };
  }

  @Post('manual/:smsId/retry')
  @RequireAdminPermissions('sms:attach')
  async retryManualSms(@Param('smsId', ParseUUIDPipe) smsId: string, @Req() request: FastifyRequest) {
    const before = await this.prisma.smsRaw.findUnique({
      where: { id: smsId },
      include: { parsed: true },
    });
    if (!before) {
      throw new Error('SMS not found');
    }

    const result = await this.smsService.retryManualSms(smsId);

    await this.auditService.record({
      adminUserId: request.adminUser?.id ?? null,
      action: 'sms.manual_retry',
      entityType: 'sms_raw',
      entityId: smsId,
      before: serialize(before),
      after: serialize(result),
      ip: request.ip,
      userAgent: request.headers['user-agent'] as string | undefined,
    });

    this.logger.log(
      JSON.stringify({
        event: 'admin.sms.manual_retry',
        adminUserId: request.adminUser?.id ?? null,
        smsId,
      }),
    );

    return { status: 'queued' };
  }

  @Post('manual/:smsId/dismiss')
  @RequireAdminPermissions('sms:attach')
  async dismissManualSms(
    @Param('smsId', ParseUUIDPipe) smsId: string,
    @Body() body: ManualDismissDto,
    @Req() request: FastifyRequest,
  ) {
    const before = await this.prisma.smsRaw.findUnique({
      where: { id: smsId },
      include: { parsed: true },
    });
    if (!before) {
      throw new Error('SMS not found');
    }

    const result = await this.smsService.dismissManualSms({
      smsId,
      resolution: body.resolution,
      note: body.note,
      adminUserId: request.adminUser?.id ?? null,
    });

    await this.auditService.record({
      adminUserId: request.adminUser?.id ?? null,
      action: 'sms.manual_dismiss',
      entityType: 'sms_raw',
      entityId: smsId,
      before: serialize(before),
      after: serialize(result),
      ip: request.ip,
      userAgent: request.headers['user-agent'] as string | undefined,
    });

    this.logger.log(
      JSON.stringify({
        event: 'admin.sms.manual_dismiss',
        adminUserId: request.adminUser?.id ?? null,
        smsId,
        resolution: body.resolution,
      }),
    );

    return { status: 'resolved', data: result };
  }

  @Get('queue')
  @RequireAdminPermissions('sms:attach')
  async queueOverview() {
    const data = await this.smsService.getQueueOverview();
    return { data };
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
