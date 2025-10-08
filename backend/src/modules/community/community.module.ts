import { Module } from '@nestjs/common';

import { CommunityController } from './community.controller.js';
import { CommunityService } from './community.service.js';
import { SmsModule } from '../sms/sms.module.js';

@Module({
  imports: [SmsModule],
  controllers: [CommunityController],
  providers: [CommunityService],
  exports: [CommunityService],
})
export class CommunityModule {}
