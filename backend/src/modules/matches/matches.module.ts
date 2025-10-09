import { Module } from '@nestjs/common';

import { PrismaModule } from '../../prisma/prisma.module.js';
import { MatchesService } from './matches.service.js';
import { MatchesController } from './matches.controller.js';

@Module({
  imports: [PrismaModule],
  providers: [MatchesService],
  controllers: [MatchesController],
})
export class MatchesModule {}
