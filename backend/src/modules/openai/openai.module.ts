import { Module } from '@nestjs/common';
import OpenAI from 'openai';

import { OpenAiService, OPENAI_FACTORY } from './openai.service.js';

@Module({
  providers: [
    {
      provide: OPENAI_FACTORY,
      useValue: (options: ConstructorParameters<typeof OpenAI>[0]) => new OpenAI(options),
    },
    OpenAiService,
  ],
  exports: [OpenAiService],
})
export class OpenAiModule {}
