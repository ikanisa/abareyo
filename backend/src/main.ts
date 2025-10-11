import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import fastifyCookie from '@fastify/cookie';
import fastifyHelmet, { type FastifyHelmetOptions } from '@fastify/helmet';
import fastifyCors, { type FastifyCorsOptions } from '@fastify/cors';
import pino from 'pino';
import pinoHttp from 'pino-http';

import { AppModule } from './app.module.js';
import { MetricsService } from './modules/metrics/metrics.service.js';

const normaliseOrigin = (value: string) => value.replace(/\/$/, '');

const extractMetricsToken = (request: any): string | undefined => {
  const headerToken = request?.headers?.['x-metrics-token'];
  if (typeof headerToken === 'string' && headerToken.trim().length) {
    return headerToken.trim();
  }

  const authHeader = request?.headers?.authorization;
  if (typeof authHeader === 'string') {
    const [scheme, token] = authHeader.split(/\s+/);
    if (scheme?.toLowerCase() === 'bearer' && token) {
      return token.trim();
    }
  }

  const query = request?.query as Record<string, unknown> | undefined;
  const queryToken = typeof query?.token === 'string' ? query.token.trim() : undefined;
  if (queryToken) {
    return queryToken;
  }

  return undefined;
};

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const configService = new ConfigService();
  const logLevel = configService.get<string>('app.logLevel', 'info');

  const baseLogger = pino({
    level: logLevel,
    transport:
      process.env.NODE_ENV === 'development'
        ? {
            target: 'pino-pretty',
            options: {
              colorize: true,
              translateTime: 'SYS:standard',
              singleLine: true,
            },
          }
        : undefined,
  });

  const fastifyAdapter = new FastifyAdapter({
    logger: false,
  });

  fastifyAdapter.register(pinoHttp, {
    logger: baseLogger,
    autoLogging: false,
    serializers: {
      req(request) {
        return {
          method: request.method,
          url: request.url,
          id: request.id,
        };
      },
      res(reply) {
        return {
          statusCode: reply.statusCode,
        };
      },
    },
  });

  const app = await NestFactory.create<NestFastifyApplication>(AppModule, fastifyAdapter, {
    bufferLogs: true,
    logger: false,
  });

  app.useLogger(baseLogger as unknown as any);

  const fastifyInstance = fastifyAdapter.getInstance();
  fastifyInstance.addHook('onRequest', async (request) => {
    request.metricsStart = Date.now();
    request.log.info({ msg: 'request.start', method: request.method, url: request.url, id: request.id });
  });

  fastifyInstance.addHook('onResponse', async (request, reply) => {
    const duration = request.metricsStart ? Date.now() - request.metricsStart : undefined;
    request.log.info({
      msg: 'request.end',
      method: request.method,
      url: request.url,
      statusCode: reply.statusCode,
      responseTime: duration,
      id: request.id,
    });
  });

  const config = app.get(ConfigService);
  const env = config.get<string>('app.env', 'development');
  const port = config.get<number>('app.port', 5000);
  const host = config.get<string>('app.host', '0.0.0.0');

  await app.register(async (instance) => {
    const sessionSecret = config.get<string>('admin.session.secret', 'change-me');
    const isDefaultSecret = ['change-me-admin-session', 'change-me'].includes(sessionSecret);
    if (isDefaultSecret) {
      const msg = 'ADMIN_SESSION_SECRET must be configured for secure admin sessions.';
      if (env === 'production') {
        throw new Error(msg);
      }
      logger.warn(msg);
    }

    const fanSecret = config.get<string>('fan.session.secret', 'change-me-fan-session');
    if (['change-me-fan-session', 'change-me'].includes(fanSecret)) {
      const msg = 'FAN_SESSION_SECRET must be configured for secure fan sessions.';
      if (env === 'production') {
        throw new Error(msg);
      }
      logger.warn(msg);
    }
    const rawCorsOrigins = config.get<string>('app.corsOrigin', 'http://localhost:3000');
    const allowedOrigins = rawCorsOrigins
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean)
      .map(normaliseOrigin);

    const allowAllOrigins = allowedOrigins.includes('*');
    if (env === 'production' && (allowAllOrigins || allowedOrigins.length === 0)) {
      throw new Error('CORS_ORIGIN must be set to a comma-separated list of allowed origins in production.');
    }
    const resolveOrigin: FastifyCorsOptions['origin'] = allowAllOrigins
      ? true
      : (origin, callback) => {
          if (!origin) {
            callback(null, true);
            return;
          }
          const incoming = normaliseOrigin(origin);
          if (allowedOrigins.includes(incoming)) {
            callback(null, true);
            return;
          }
          callback(new Error('Origin not allowed'), false);
        };

    await instance.register(fastifyCookie, {
      secret: sessionSecret,
      hook: 'onRequest',
    });
    const enableCsp = process.env.APP_ENABLE_CSP === '1';
    await instance.register(fastifyHelmet, {
      contentSecurityPolicy: enableCsp
        ? {
            directives: {
              defaultSrc: ["'self'"],
              imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
              styleSrc: ["'self'", "'unsafe-inline'", 'https:'],
              scriptSrc: ["'self'", "'unsafe-inline'", 'https:'],
              connectSrc: ["'self'", '*'],
              fontSrc: ["'self'", 'https:', 'data:'],
            },
          }
        : false,
    } satisfies FastifyHelmetOptions);
    await instance.register(fastifyCors, {
      origin: resolveOrigin,
      credentials: true,
    } satisfies FastifyCorsOptions);
  });

  const metricsService = app.get(MetricsService);
  const metricsToken = config.get<string>('metrics.token', '');
  if (env === 'production' && !metricsToken) {
    throw new Error('METRICS_TOKEN must be set to protect /metrics in production.');
  }

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.setGlobalPrefix('api');

  fastifyInstance.addHook('onResponse', async (request, reply) => {
    const route = reply.context?.config?.url ?? request.routerPath ?? request.url;
    const duration = request.metricsStart ? Date.now() - request.metricsStart : 0;
    metricsService.observeHttpRequest(
      {
        method: request.method,
        route,
        statusCode: reply.statusCode,
      },
      duration,
    );
  });

  fastifyInstance.get('/metrics', async (request, reply) => {
    if (metricsToken) {
      const providedToken = extractMetricsToken(request);
      if (providedToken !== metricsToken) {
        reply
          .header('www-authenticate', 'Bearer realm="metrics"')
          .status(401)
          .send('Unauthorized');
        return;
      }
    }

    const body = await metricsService.getMetrics();
    reply
      .header('content-type', 'text/plain; version=0.0.4; charset=utf-8')
      .status(200)
      .send(body);
  });

  await app.listen({ port, host });
  logger.log(`Rayon backend running at http://${host}:${port}`);
}

bootstrap();
