import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { ParseUUIDPipe } from '@nestjs/common/pipes/parse-uuid.pipe';

import { MembershipService } from './membership.service.js';
import { MembershipUpgradeDto } from './dto/membership-upgrade.dto.js';

@Controller('membership')
export class MembershipController {
  constructor(private readonly membershipService: MembershipService) {}

  @Get('plans')
  async plans() {
    const data = await this.membershipService.listPlans();
    return { data };
  }

  @Get(':userId/status')
  async status(@Param('userId', new ParseUUIDPipe()) userId: string) {
    const data = await this.membershipService.getStatus(userId);
    return { data };
  }

  @Post('upgrade')
  @HttpCode(HttpStatus.CREATED)
  async upgrade(@Body() body: MembershipUpgradeDto) {
    const data = await this.membershipService.upgrade(body);
    return { data };
  }
}
