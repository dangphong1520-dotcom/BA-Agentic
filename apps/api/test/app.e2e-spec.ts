import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';
import { configureApp } from './../src/configure-app.js';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
  });

  it('serves the existing API root under the version prefix', () => {
    return request(app.getHttpServer())
      .get('/api/v1')
      .expect(200)
      .expect('Hello World!');
  });

  it('exposes API liveness without claiming dependency readiness', () => {
    return request(app.getHttpServer())
      .get('/api/v1/health')
      .expect(200)
      .expect('Content-Type', /json/)
      .expect({ status: 'ok', service: 'ba-agent-api' });
  });

  it.each(['/', '/health', '/api/v2/health'])(
    'does not expose an unversioned or unsupported route: %s',
    async (path) => {
      await request(app.getHttpServer()).get(path).expect(404);
    },
  );

  afterEach(async () => {
    await app.close();
  });
});
