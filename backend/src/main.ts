import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import fastifyHelmet, { type FastifyHelmetOptions } from '@fastify/helmet';
import fastifyCors, { type FastifyCorsOptions } from '@fastify/cors';

import { AppModule } from './app.module.js';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: false }),
  );

  const config = app.get(ConfigService);
  const port = config.get<number>('app.port', 5000);
  const host = config.get<string>('app.host', '0.0.0.0');

  await app.register(async (instance) => {
    await instance.register(fastifyHelmet, {
      contentSecurityPolicy: false,
    } satisfies FastifyHelmetOptions);
    await instance.register(fastifyCors, {
      origin: config.get<string>('app.corsOrigin', '*'),
      credentials: true,
    } satisfies FastifyCorsOptions);
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.setGlobalPrefix('api');

  await app.listen({ port, host });
  logger.log(`Rayon backend running at http://${host}:${port}`);
}

bootstrap();
