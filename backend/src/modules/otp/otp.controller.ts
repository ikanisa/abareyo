import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req } from '@nestjs/common';
import { FastifyRequest } from 'fastify';

import { SendOtpDto } from './dto/send-otp.dto.js';
import { VerifyOtpDto } from './dto/verify-otp.dto.js';
import { OtpService } from './otp.service.js';

@Controller('otp')
export class OtpController {
  constructor(private readonly otpService: OtpService) {}

  @Post('send')
  @HttpCode(HttpStatus.ACCEPTED)
  async send(@Body() body: SendOtpDto, @Req() request: FastifyRequest) {
    const result = await this.otpService.sendOtp({
      phone: body.phone,
      channel: body.channel,
      ip: request.ip,
      locale: body.locale,
    });
    return { data: result };
  }

  @Post('verify')
  async verify(@Body() body: VerifyOtpDto, @Req() request: FastifyRequest) {
    const result = await this.otpService.verifyOtp({
      phone: body.phone,
      code: body.code,
      ip: request.ip,
    });
    return { data: result };
  }

  @Get('status')
  async status() {
    const result = this.otpService.getOperationalStatus();
    return { data: result };
  }
}
