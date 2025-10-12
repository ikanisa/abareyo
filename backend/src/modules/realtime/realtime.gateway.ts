import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';

import type { CorsOptions } from 'cors';

import { FanAuthService } from '../fan-auth/fan-auth.service.js';
import { RealtimeService } from './realtime.service.js';

const normaliseOrigin = (value: string) => value.replace(/\/+$/u, '');
const rawOrigins = process.env.CORS_ORIGIN ?? 'http://localhost:3000';
const parsedOrigins = rawOrigins
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean)
  .map(normaliseOrigin);
const allowAllOrigins = parsedOrigins.includes('*');
const allowedOrigins = allowAllOrigins ? [] : parsedOrigins;

const gatewayCorsOrigin: CorsOptions['origin'] = allowAllOrigins
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

@WebSocketGateway({ namespace: '/ws', cors: { origin: gatewayCorsOrigin, credentials: true } })
export class RealtimeGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(RealtimeGateway.name);
  private readonly fanCookieName: string;

  @WebSocketServer()
  private server!: Server;

  constructor(
    private readonly realtime: RealtimeService,
    private readonly configService: ConfigService,
    private readonly fanAuthService: FanAuthService,
  ) {
    this.fanCookieName = this.configService.get<string>('fan.session.cookieName', 'fan_session');
  }

  afterInit(server: Server) {
    this.realtime.registerServer(server);
    if (!allowAllOrigins) {
      const corsOptions: CorsOptions = {
        origin: allowedOrigins,
        credentials: true,
      };
      server.engine.opts.cors = corsOptions;
    }
    this.logger.log('Realtime gateway ready');
  }

  async handleConnection(client: Socket) {
    try {
      const sessionId = this.extractSessionId(client);
      if (!sessionId) {
        this.logger.warn(`Rejecting socket ${client.id}: missing fan session token`);
        client.emit('error', 'unauthorized');
        client.disconnect(true);
        return;
      }

      const session = await this.fanAuthService.getActiveSession(sessionId);
      if (!session) {
        this.logger.warn(`Rejecting socket ${client.id}: session not found`);
        client.emit('error', 'unauthorized');
        client.disconnect(true);
        return;
      }

      client.data.fanUserId = session.user.id;
      this.logger.debug(`Client connected ${client.id} for fan ${session.user.id}`);
    } catch (error) {
      this.logger.warn(`Blocking socket ${client.id}: ${(error as Error).message}`);
      client.emit('error', 'unauthorized');
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`Client disconnected ${client.id}`);
  }

  private extractSessionId(client: Socket) {
    const authToken = this.pickFirst(client.handshake.auth?.token);
    if (authToken) {
      return authToken;
    }

    const queryToken = this.pickFirst(client.handshake.query?.token);
    if (queryToken) {
      return queryToken;
    }

    const cookieHeader = client.handshake.headers.cookie;
    if (!cookieHeader) {
      return null;
    }

    const cookies = cookieHeader.split(';').map((part) => part.trim());
    const target = cookies.find((part) => part.startsWith(`${this.fanCookieName}=`));
    if (!target) {
      return null;
    }

    const [, value] = target.split('=');
    if (!value) {
      return null;
    }

    try {
      return decodeURIComponent(value);
    } catch (error) {
      this.logger.debug('Failed to decode session cookie value', error as Error);
      return value;
    }
  }

  private pickFirst(value: unknown): string | null {
    if (typeof value === 'string') {
      return value;
    }
    if (Array.isArray(value) && value.length > 0) {
      const first = value[0];
      return typeof first === 'string' ? first : null;
    }
    return null;
  }
}
