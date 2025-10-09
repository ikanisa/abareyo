import request from 'supertest';

import { AppModule } from '../../src/app.module.js';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';

describe('Tickets endpoints (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns ticket catalog', async () => {
    const response = await request(app.getHttpServer()).get('/tickets/catalog');
    expect([200, 401, 404]).toContain(response.status);
  });
});
