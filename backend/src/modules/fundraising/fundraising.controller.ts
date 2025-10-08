import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { ParseUUIDPipe } from '@nestjs/common/pipes/parse-uuid.pipe';

import { FundraisingService } from './fundraising.service.js';
import { DonateDto } from './dto/donate.dto.js';

@Controller('fundraising')
export class FundraisingController {
  constructor(private readonly fundraisingService: FundraisingService) {}

  @Get('projects')
  async projects() {
    const data = await this.fundraisingService.listProjects();
    return { data };
  }

  @Get('projects/:projectId')
  async project(@Param('projectId', new ParseUUIDPipe()) projectId: string) {
    const data = await this.fundraisingService.getProject(projectId);
    return { data };
  }

  @Post('donate')
  @HttpCode(HttpStatus.CREATED)
  async donate(@Body() body: DonateDto) {
    const data = await this.fundraisingService.donate(body);
    return { data };
  }
}
