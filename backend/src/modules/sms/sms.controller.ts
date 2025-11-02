import { Body, Headers, HttpCode, HttpStatus, Post, UnauthorizedException } from '@nestjs/common';
import { Controller } from '@nestjs/common';

import { SmsService } from './sms.service.js';
import { SmsWebhookDto } from './sms.dto.js';

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

}
