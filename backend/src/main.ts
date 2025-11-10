import { Logger, type LoggerService, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import fastifyCookie from '@fastify/cookie';
import fastifyHelmet, { type FastifyHelmetOptions } from '@fastify/helmet';
import fastifyCors, { type FastifyCorsOptions } from '@fastify/cors';
import { randomUUID } from 'node:crypto';
import type { FastifyRequest } from 'fastify';
import pino, { type TransportTargetOptions } from 'pino';
import pinoHttp from 'pino-http';

import { AppModule } from './app.module.js';
import { MetricsService } from './modules/metrics/metrics.service.js';
import { initSentry } from './observability/sentry.js';
import { SentryInterceptor } from './observability/sentry.interceptor.js';

const normaliseOrigin = (value: string) => value.replace(/\/+$/u, '');
const addSocketOrigins = (target: Set<string>, origin: string) => {
  try {
    const parsed = new URL(origin);
    const protocol = parsed.protocol === 'https:' ? 'wss:' : 'ws:';
    target.add(`${protocol}//${parsed.host}`);
  } catch (error) {
    // Ignore malformed origins; validation happens during bootstrap.
  }
};

type MetricsRequest = Pick<FastifyRequest, 'headers' | 'query'>;

const extractMetricsToken = (request: MetricsRequest): string | undefined => {
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

  const rawQuery = request?.query as Record<string, unknown> | undefined;
  const queryToken = typeof rawQuery?.token === 'string' ? rawQuery.token.trim() : undefined;
  if (queryToken) {
    return queryToken;
  }

  return undefined;
};

type LokiConfig = {
  endpoint?: string;
  basicAuth?: string;
  username?: string;
  password?: string;
  tenantId?: string;
  batchIntervalSeconds?: number;
};

const extractHeaderValue = (value: unknown): string | null => {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim();
  }

  if (Array.isArray(value)) {
    const [first] = value;
    if (typeof first === 'string' && first.trim().length > 0) {
      return first.trim();
    }
  }

  return null;
};

const resolveCorrelationId = (headers: Record<string, unknown>) => {
  const candidates = [headers['x-correlation-id'], headers['x-request-id']];
  for (const candidate of candidates) {
    const value = extractHeaderValue(candidate);
    if (value) {
      return value;
    }
  }
  return randomUUID();
};

const verifyBasicAuthHeader = (authorization: unknown, expectedUser: string, expectedPassword: string) => {
  if (typeof authorization !== 'string' || !authorization.trim()) {
    return false;
  }
  const [scheme, encoded] = authorization.split(/\s+/);
  if ((scheme ?? '').toLowerCase() !== 'basic' || !encoded) {
    return false;
  }
  try {
    const decoded = Buffer.from(encoded, 'base64').toString('utf8');
    const separatorIndex = decoded.indexOf(':');
    if (separatorIndex === -1) {
      return false;
    }
    const user = decoded.slice(0, separatorIndex);
    const password = decoded.slice(separatorIndex + 1);
    return user === expectedUser && password === expectedPassword;
  } catch {
    return false;
  }
};

const buildLokiTarget = (config: LokiConfig | undefined, environment: string, level: string): TransportTargetOptions | null => {
  const host = config?.endpoint?.trim();
  if (!host) {
    return null;
  }

  const basicAuth =
    config?.basicAuth?.trim() ??
    (config?.username && config?.password ? `${config.username}:${config.password}` : undefined);
  const headers = config?.tenantId
    ? {
        'X-Scope-OrgID': config.tenantId,
      }
    : undefined;
  const batchInterval = Number(config?.batchIntervalSeconds ?? 5);

  return {
    target: 'pino-loki',
    level,
    options: {
      host,
      batching: true,
      interval: Number.isFinite(batchInterval) ? Math.max(1, batchInterval) : 5,
      labels: {
        service: 'rayon-backend',
        env: environment,
      },
      basicAuth,
      headers,
    },
  } satisfies TransportTargetOptions;
};

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const configService = new ConfigService();
  const logLevel = configService.get<string>('app.logLevel', 'info');
  const env = configService.get<string>('app.env', 'development');

  const targets: TransportTargetOptions[] = [];
  if (process.env.NODE_ENV === 'development') {
    targets.push({
      target: 'pino-pretty',
      level: logLevel,
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        singleLine: true,
      },
    });
  }

  const lokiConfig = configService.get<LokiConfig>('observability.loki');
  const lokiTarget = buildLokiTarget(lokiConfig, env, logLevel);
  if (lokiTarget) {
    targets.push(lokiTarget);
  }

  let baseLogger = pino({ level: logLevel });
  if (targets.length > 0) {
    if (process.env.NODE_ENV !== 'development') {
      targets.unshift({
        target: 'pino/file',
        level: logLevel,
        options: { destination: 1 },
      });
    }
    const transport = pino.transport({ targets });
    baseLogger = pino({ level: logLevel }, transport);
  }

  const sentryEnabled = initSentry(configService);

  const fastifyAdapter = new FastifyAdapter({
    logger: false,
  });

  fastifyAdapter.register(pinoHttp, {
    logger: baseLogger,
    autoLogging: false,
    genReqId(request) {
      const correlationId = resolveCorrelationId(request.headers ?? {});
      request.headers['x-correlation-id'] = correlationId;
      request.headers['x-request-id'] = correlationId;
      return correlationId;
    },
    customProps(req) {
      return { correlationId: req.id };
    },
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

  app.useLogger(baseLogger as unknown as LoggerService);

  const fastifyInstance = fastifyAdapter.getInstance();
  fastifyInstance.addHook('onRequest', async (request) => {
    request.metricsStart = Date.now();
    request.log.info({
      msg: 'request.start',
      method: request.method,
      url: request.url,
      id: request.id,
      correlationId: request.id,
    });
  });

  fastifyInstance.addHook('preHandler', async (request, reply) => {
    if (request.id) {
      reply.header('x-correlation-id', request.id);
      reply.header('x-request-id', request.id);
    }
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
      correlationId: request.id,
    });
  });

  const config = app.get(ConfigService);
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
    const connectSrc = new Set<string>(["'self'"]);
    const baseUrl = config.get<string>('app.baseUrl');
    if (baseUrl) {
      const baseOrigin = normaliseOrigin(baseUrl);
      connectSrc.add(baseOrigin);
      addSocketOrigins(connectSrc, baseOrigin);
    }

    if (!allowAllOrigins) {
      allowedOrigins.forEach((origin) => {
        connectSrc.add(origin);
        addSocketOrigins(connectSrc, origin);
      });
    }

    await instance.register(fastifyHelmet, {
      contentSecurityPolicy: enableCsp
        ? {
            directives: {
              defaultSrc: ["'self'"],
              imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
              styleSrc: ["'self'", "'unsafe-inline'", 'https:'],
              scriptSrc: ["'self'", "'unsafe-inline'", 'https:'],
              connectSrc: Array.from(connectSrc),
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
  const prometheusConfig = config.get<{
    token?: string;
    basicAuthUser?: string;
    basicAuthPassword?: string;
  }>('observability.prometheus', { token: '', basicAuthUser: '', basicAuthPassword: '' });
  const metricsToken = prometheusConfig.token ?? config.get<string>('metrics.token', '');
  const metricsBasicAuthUser = prometheusConfig.basicAuthUser ?? '';
  const metricsBasicAuthPassword = prometheusConfig.basicAuthPassword ?? '';
  const requiresBasicAuth = metricsBasicAuthUser.length > 0 && metricsBasicAuthPassword.length > 0;

  if (env === 'production' && !metricsToken && !requiresBasicAuth) {
    throw new Error(
      'Configure METRICS_TOKEN or METRICS_BASIC_AUTH_USER/METRICS_BASIC_AUTH_PASSWORD to protect /metrics in production.',
    );
  }

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  if (sentryEnabled) {
    app.useGlobalInterceptors(new SentryInterceptor());
  }

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
          .header('www-authenticate', requiresBasicAuth ? 'Bearer realm="metrics", Basic realm="metrics"' : 'Bearer realm="metrics"')
          .status(401)
          .send('Unauthorized');
        return;
      }
    }

    if (requiresBasicAuth) {
      const authorized = verifyBasicAuthHeader(request?.headers?.authorization, metricsBasicAuthUser, metricsBasicAuthPassword);
      if (!authorized) {
        reply.header('www-authenticate', 'Basic realm="metrics"').status(401).send('Unauthorized');
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
