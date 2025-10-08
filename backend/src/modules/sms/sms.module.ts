import { Module } from '@nestjs/common';

import { PaymentsModule } from '../payments/payments.module.js';
import { RealtimeModule } from '../realtime/realtime.module.js';
import { SmsController } from './sms.controller.js';
import { SmsParserService } from './sms.parser.js';
import { SmsQueueService } from './sms.queue.js';
import { SmsService } from './sms.service.js';

@Module({
  imports: [PaymentsModule, RealtimeModule],
  controllers: [SmsController],
  providers: [SmsService, SmsQueueService, SmsParserService],
  exports: [SmsService],
})
export class SmsModule {}
