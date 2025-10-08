import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { PrismaModule } from '../../prisma/prisma.module.js';
import { SmsModule } from '../sms/sms.module.js';
import { PaymentsModule } from '../payments/payments.module.js';
import { AdminAuthController } from './auth/admin-auth.controller.js';
import { AdminAuthService } from './auth/admin-auth.service.js';
import { LoginRateLimiterService } from './auth/login-rate-limiter.service.js';
import { AdminSessionGuard } from './rbac/admin-session.guard.js';
import { AdminPermissionsGuard } from './rbac/admin-permissions.guard.js';
import { AdminOrdersController } from './orders/admin-orders.controller.js';
import { AdminOrdersService } from './orders/admin-orders.service.js';
import { AdminAuditService } from './audit/admin-audit.service.js';
import { AdminSmsController } from './sms/admin-sms.controller.js';
import { AdminUssdController } from './ussd/admin-ussd.controller.js';
import { AdminMatchModule } from './match/admin-match.module.js';

@Module({
  imports: [PrismaModule, ConfigModule, SmsModule, PaymentsModule, AdminMatchModule],
  controllers: [AdminAuthController, AdminOrdersController, AdminSmsController, AdminUssdController],
  providers: [
    AdminAuthService,
    LoginRateLimiterService,
    AdminSessionGuard,
    AdminPermissionsGuard,
    AdminOrdersService,
    AdminAuditService,
  ],
  exports: [AdminAuthService, AdminSessionGuard, AdminPermissionsGuard, AdminAuditService],
})
export class AdminModule {}
