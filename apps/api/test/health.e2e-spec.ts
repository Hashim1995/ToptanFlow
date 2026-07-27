import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';
import { createPrismaServiceMock } from './prisma-service.mock';
import { configureApp } from './../src/bootstrap/configure-app';

describe('Health (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(createPrismaServiceMock())
      .compile();

    app = moduleFixture.createNestApplication();
    // Applies the same global prefix / URI versioning / validation pipe /
    // CORS configuration as production (`src/main.ts`), so this test
    // exercises the real request path, e.g. `GET /api/v1/health`.
    configureApp(app);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('GET /api/v1/health returns basic application health information only', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/health')
      .expect(200);

    const expected: Record<string, unknown> = {
      status: 'ok',
      uptimeSeconds: expect.any(Number) as unknown,
      timestamp: expect.any(String) as unknown,
    };
    expect(response.body).toEqual(expected);
  });

  it('returns a consistent error shape for an unknown route', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/does-not-exist')
      .expect(404);

    expect(response.body).toEqual(
      expect.objectContaining({
        statusCode: 404,
        path: '/api/v1/does-not-exist',
      }),
    );
  });
});
