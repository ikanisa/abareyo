import { Module } from '@nestjs/common';

import { StorageModule } from '../storage/storage.module.js';
import { FundraisingController } from './fundraising.controller.js';
import { FundraisingService } from './fundraising.service.js';

@Module({
  imports: [StorageModule],
  controllers: [FundraisingController],
  providers: [FundraisingService],
  exports: [FundraisingService],
})
export class FundraisingModule {}
