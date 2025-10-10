import 'reflect-metadata';

import request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { Module } from '@nestjs/common';

describe('TicketsController (e2e)', () => {
  let app: import('@nestjs/platform-fastify').NestFastifyApplication;

  beforeAll(async () => {
    if (!process.env.DATABASE_URL) {
      return;
    }

    const { TicketsController } = await import('../../src/modules/tickets/tickets.controller.js');
    const { TicketsService } = await import('../../src/modules/tickets/tickets.service.js');
    const { SmsService } = await import('../../src/modules/sms/sms.service.js');

    const { FastifyAdapter } = await import('@nestjs/platform-fastify');

    const ticketsServiceStub: Partial<TicketsService> = {
      getTicketCatalog: jest.fn().mockResolvedValue([
        {
          id: 'match-1',
          opponent: 'APR FC',
          kickoff: new Date().toISOString(),
          venue: 'Kigali Stadium',
          competition: 'Friendly',
          status: 'scheduled',
          zones: [],
        },
      ]),
    };

    const smsServiceStub: Partial<SmsService> = {
      validateAdminToken: jest.fn().mockReturnValue(true),
    };

    @Module({
      controllers: [TicketsController],
      providers: [
        { provide: TicketsService, useValue: ticketsServiceStub },
        { provide: SmsService, useValue: smsServiceStub },
      ],
    })
    class TestAppModule {}

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestAppModule],
    }).compile();

    app = moduleFixture.createNestApplication(new FastifyAdapter());
    await app.init();
  }, 30000);

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  const skipIfNoDb = process.env.DATABASE_URL ? it : it.skip;

  skipIfNoDb('GET /tickets/catalog responds', async () => {
    const response = await request(app.getHttpServer()).get('/tickets/catalog');
    expect(response.status).toBeLessThan(500);
  });
});
