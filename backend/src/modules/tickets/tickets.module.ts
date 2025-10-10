import { Module } from '@nestjs/common';

import { RealtimeModule } from '../realtime/realtime.module.js';
import { MetricsModule } from '../metrics/metrics.module.js';
import { TicketsController } from './tickets.controller.js';
import { TicketsService } from './tickets.service.js';

@Module({
  imports: [RealtimeModule, MetricsModule],
  controllers: [TicketsController],
  providers: [TicketsService],
  exports: [TicketsService],
})
export class TicketsModule {}
