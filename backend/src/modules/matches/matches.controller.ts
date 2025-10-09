import { Controller, Get } from '@nestjs/common';

import { MatchesService } from './matches.service.js';

@Controller('matches')
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  @Get('summaries')
  async summaries() {
    const data = await this.matchesService.listSummaries();
    return { data };
  }
}
