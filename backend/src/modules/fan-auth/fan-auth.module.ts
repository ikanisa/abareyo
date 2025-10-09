import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { PrismaModule } from '../../prisma/prisma.module.js';
import { FanAuthService } from './fan-auth.service.js';
import { FanAuthController } from './fan-auth.controller.js';
import { FanSessionGuard } from './fan-session.guard.js';

@Module({
  imports: [PrismaModule, ConfigModule],
  providers: [FanAuthService, FanSessionGuard],
  controllers: [FanAuthController],
  exports: [FanAuthService, FanSessionGuard],
})
export class FanAuthModule {}
