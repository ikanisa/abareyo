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

import { RealtimeService } from './realtime.service.js';

@WebSocketGateway({ namespace: '/ws', cors: { origin: true, credentials: true } })
export class RealtimeGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(RealtimeGateway.name);

  @WebSocketServer()
  private server!: Server;

  constructor(
    private readonly realtime: RealtimeService,
    private readonly configService: ConfigService,
  ) {}

  afterInit(server: Server) {
    this.realtime.registerServer(server);
    const origin = this.configService.get<string>('app.corsOrigin') ?? '*';
    if (origin !== '*') {
      const corsOptions: CorsOptions = {
        origin: origin.split(',').map((value) => value.trim()) as (string | RegExp)[],
        credentials: true,
      };
      server.engine.opts.cors = corsOptions;
    }
    this.logger.log('Realtime gateway ready');
  }

  handleConnection(client: Socket) {
    this.logger.debug(`Client connected ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`Client disconnected ${client.id}`);
  }
}
