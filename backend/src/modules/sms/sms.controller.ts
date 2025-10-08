import { Body, Get, Headers, HttpCode, HttpStatus, Post, UnauthorizedException } from '@nestjs/common';
import { Controller } from '@nestjs/common';

import { SmsService } from './sms.service.js';
import { SmsManualAttachDto, SmsWebhookDto } from './sms.dto.js';

@Controller('sms')
export class SmsController {
  constructor(private readonly smsService: SmsService) {}

  @Post('webhook')
  @HttpCode(HttpStatus.ACCEPTED)
  async ingest(
    @Body() payload: SmsWebhookDto,
    @Headers('authorization') authHeader?: string,
    @Headers('x-modem-id') modemId?: string,
    @Headers('x-sim-slot') simSlot?: string,
  ) {
    const token = authHeader?.replace('Bearer ', '').trim();
    if (!this.smsService.validateWebhookToken(token)) {
      throw new UnauthorizedException('Invalid SMS webhook token');
    }

    await this.smsService.handleInboundSms(payload, {
      modemId: modemId ?? 'unknown',
      simSlot: simSlot ?? 'unknown',
    });

    return { status: 'accepted' };
  }

  @Get('inbound')
  async list(@Headers('x-admin-token') adminToken?: string) {
    if (!this.smsService.validateAdminToken(adminToken)) {
      throw new UnauthorizedException('Admin token required');
    }

    const records = await this.smsService.listRecentSms();
    return { data: records };
  }

  @Get('manual-review')
  async manualQueue(@Headers('x-admin-token') adminToken?: string) {
    if (!this.smsService.validateAdminToken(adminToken)) {
      throw new UnauthorizedException('Admin token required');
    }

    const data = await this.smsService.listManualReviewSms();
    return { data };
  }

  @Post('manual-review/attach')
  async manualAttach(@Body() body: SmsManualAttachDto, @Headers('x-admin-token') adminToken?: string) {
    if (!this.smsService.validateAdminToken(adminToken)) {
      throw new UnauthorizedException('Admin token required');
    }

    const data = await this.smsService.attachSmsToPayment(body.smsId, body.paymentId);
    return { data };
  }
}
