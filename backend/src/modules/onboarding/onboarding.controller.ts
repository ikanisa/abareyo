import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';

import { OnboardingService } from './onboarding.service.js';
import { SendMessageDto } from './dto/send-message.dto.js';

@Controller('onboarding')
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Post('sessions')
  @HttpCode(HttpStatus.CREATED)
  createSession(@Body('locale') locale?: string) {
    return this.wrap(this.onboardingService.createSession(locale));
  }

  @Get('sessions/:sessionId')
  getSession(@Param('sessionId', new ParseUUIDPipe()) sessionId: string) {
    return this.wrap(this.onboardingService.getSession(sessionId));
  }

  @Post('sessions/:sessionId/messages')
  async sendMessage(
    @Param('sessionId', new ParseUUIDPipe()) sessionId: string,
    @Body() body: SendMessageDto,
  ) {
    return this.wrap(this.onboardingService.sendMessage(sessionId, body.message));
  }

  private async wrap<T>(promise: Promise<T>) {
    const data = await promise;
    return { data };
  }
}
