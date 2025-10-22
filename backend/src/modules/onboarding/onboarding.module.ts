import { Module } from '@nestjs/common';

import { PrismaModule } from '../../prisma/prisma.module.js';
import { OpenAiModule } from '../openai/openai.module.js';
import { OnboardingController } from './onboarding.controller.js';
import { OnboardingService } from './onboarding.service.js';
import { OnboardingAgentService } from './onboarding.agent.js';

@Module({
  imports: [PrismaModule, OpenAiModule],
  controllers: [OnboardingController],
  providers: [OnboardingService, OnboardingAgentService],
  exports: [OnboardingService],
})
export class OnboardingModule {}
