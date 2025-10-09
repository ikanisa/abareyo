import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { PrismaModule } from './prisma/prisma.module.js';
import configuration from './config/configuration.js';
import { SmsModule } from './modules/sms/sms.module.js';
import { TicketsModule } from './modules/tickets/tickets.module.js';
import { PaymentsModule } from './modules/payments/payments.module.js';
import { WalletModule } from './modules/wallet/wallet.module.js';
import { MembershipModule } from './modules/membership/membership.module.js';
import { ShopModule } from './modules/shop/shop.module.js';
import { CommunityModule } from './modules/community/community.module.js';
import { FundraisingModule } from './modules/fundraising/fundraising.module.js';
import { RealtimeModule } from './modules/realtime/realtime.module.js';
import { OnboardingModule } from './modules/onboarding/onboarding.module.js';
import { AdminModule } from './modules/admin/admin.module.js';
import { MatchesModule } from './modules/matches/matches.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    PrismaModule,
    RealtimeModule,
    SmsModule,
    TicketsModule,
    PaymentsModule,
    WalletModule,
    MembershipModule,
    ShopModule,
    CommunityModule,
    FundraisingModule,
    OnboardingModule,
    AdminModule,
    MatchesModule,
  ],
})
export class AppModule {}
