import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { PrismaModule } from '../../prisma/prisma.module.js';
import { SmsModule } from '../sms/sms.module.js';
import { PaymentsModule } from '../payments/payments.module.js';
import { RealtimeModule } from '../realtime/realtime.module.js';
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
import { AdminMembershipController } from './membership/admin-membership.controller.js';
import { AdminMembershipService } from './membership/admin-membership.service.js';
import { AdminShopController } from './shop/admin-shop.controller.js';
import { AdminShopService } from './shop/admin-shop.service.js';
import { AdminFundraisingController } from './fundraising/admin-fundraising.controller.js';
import { AdminFundraisingService } from './fundraising/admin-fundraising.service.js';
import { AdminFeatureFlagsController } from './feature-flags/admin-feature-flags.controller.js';
import { AdminFeatureFlagsService } from './feature-flags/admin-feature-flags.service.js';
import { AdminTranslationsController } from './translations/admin-translations.controller.js';
import { AdminTranslationsService } from './translations/admin-translations.service.js';
import { AdminReportsController } from './reports/admin-reports.controller.js';
import { AdminReportsService } from './reports/admin-reports.service.js';

@Module({
  imports: [PrismaModule, ConfigModule, SmsModule, PaymentsModule, RealtimeModule, AdminMatchModule],
  controllers: [
    AdminAuthController,
    AdminOrdersController,
    AdminSmsController,
    AdminUssdController,
    AdminMembershipController,
    AdminShopController,
    AdminFundraisingController,
    AdminFeatureFlagsController,
    AdminTranslationsController,
    AdminReportsController,
  ],
  providers: [
    AdminAuthService,
    LoginRateLimiterService,
    AdminSessionGuard,
    AdminPermissionsGuard,
    AdminOrdersService,
    AdminAuditService,
    AdminMembershipService,
    AdminShopService,
    AdminFundraisingService,
    AdminFeatureFlagsService,
    AdminTranslationsService,
    AdminReportsService,
  ],
  exports: [AdminAuthService, AdminSessionGuard, AdminPermissionsGuard, AdminAuditService],
})
export class AdminModule {}
