import { Module } from '@nestjs/common';

import { OtpController } from './otp.controller.js';
import { OtpService } from './otp.service.js';
import { OtpStore } from './otp.store.js';
import { OtpAbuseService } from './otp-abuse.service.js';
import { OtpMonitorService } from './otp-monitor.service.js';

@Module({
  controllers: [OtpController],
  providers: [OtpService, OtpStore, OtpAbuseService, OtpMonitorService],
  exports: [OtpService, OtpMonitorService, OtpAbuseService],
})
export class OtpModule {}
