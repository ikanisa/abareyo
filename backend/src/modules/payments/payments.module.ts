import { Module } from '@nestjs/common';

import { RealtimeModule } from '../realtime/realtime.module.js';
import { TicketsModule } from '../tickets/tickets.module.js';
import { PaymentsService } from './payments.service.js';

@Module({
  imports: [TicketsModule, RealtimeModule],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
