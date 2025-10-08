import { Module } from '@nestjs/common';

import { PrismaModule } from '../../../prisma/prisma.module.js';
import { AdminMatchService } from './admin-match.service.js';
import { AdminMatchController } from './admin-match.controller.js';
import { AdminAuditService } from '../audit/admin-audit.service.js';
import { RealtimeModule } from '../../realtime/realtime.module.js';

@Module({
  imports: [PrismaModule, RealtimeModule],
  controllers: [AdminMatchController],
  providers: [AdminMatchService, AdminAuditService],
  exports: [AdminMatchService],
})
export class AdminMatchModule {}
