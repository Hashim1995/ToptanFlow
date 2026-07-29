import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/bootstrap/configure-app';
import { PrismaService } from '../src/prisma/prisma.service';
import { attachAuthUserMock, withAuth } from './auth-e2e.helper';

describe('Currencies (e2e)', () => {
  const currencyId = '11111111-1111-4111-8111-111111111111';
  const createdAt = new Date('2026-07-28T00:00:00.000Z');
  const updatedAt = new Date('2026-07-28T00:00:00.000Z');

  const baseCurrency = {
    id: currencyId,
    code: 'USD',
    name: 'ABŞ dolları',
    symbol: '$',
    isActive: true,
    createdAt,
    updatedAt,
  };

  const prisma = {
    onModuleInit: jest.fn().mockResolvedValue(undefined),
    onModuleDestroy: jest.fn().mockResolvedValue(undefined),
    currency: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
  };

  let app: INestApplication<App>;

  beforeEach(async () => {
    jest.clearAllMocks();
    attachAuthUserMock(prisma);

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('POST /api/v1/currencies creates and serializes nullable symbol', async () => {
    prisma.currency.create.mockResolvedValue({
      ...baseCurrency,
      symbol: null,
    });

    const response = await withAuth(request(app.getHttpServer()))
      .post('/api/v1/currencies')
      .send({ code: 'usd', name: 'ABŞ dolları', symbol: '  ' })
      .expect(201);

    expect(response.body).toEqual({
      id: currencyId,
      code: 'USD',
      name: 'ABŞ dolları',
      symbol: null,
      isActive: true,
      createdAt: createdAt.toISOString(),
      updatedAt: updatedAt.toISOString(),
    });
    expect(prisma.currency.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          code: 'USD',
          symbol: null,
        }) as object,
      }),
    );
    expect(JSON.stringify(response.body)).not.toMatch(
      /prisma|DATABASE_URL|stack/i,
    );
  });

  it('POST /api/v1/currencies rejects whitespace-only fields with 400', async () => {
    const response = await withAuth(request(app.getHttpServer()))
      .post('/api/v1/currencies')
      .send({ code: '   ', name: '   ' })
      .expect(400);

    expect(response.body).toEqual(
      expect.objectContaining({
        statusCode: 400,
        path: '/api/v1/currencies',
      }),
    );
    expect(prisma.currency.create).not.toHaveBeenCalled();
  });

  it('POST /api/v1/currencies maps duplicate code to 409', async () => {
    prisma.currency.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique constraint', {
        code: 'P2002',
        clientVersion: '7.9.1',
      }),
    );

    const response = await withAuth(request(app.getHttpServer()))
      .post('/api/v1/currencies')
      .send({ code: 'USD', name: 'Duplicate' })
      .expect(409);

    expect(response.body).toEqual(
      expect.objectContaining({
        statusCode: 409,
        message: 'Currency code already exists',
      }),
    );
  });

  it('GET /api/v1/currencies returns paginated data/meta shape', async () => {
    prisma.currency.findMany.mockResolvedValue([baseCurrency]);
    prisma.currency.count.mockResolvedValue(1);

    const response = await withAuth(request(app.getHttpServer()))
      .get('/api/v1/currencies')
      .expect(200);

    expect(response.body).toEqual({
      data: [
        {
          id: currencyId,
          code: 'USD',
          name: 'ABŞ dolları',
          symbol: '$',
          isActive: true,
          createdAt: createdAt.toISOString(),
          updatedAt: updatedAt.toISOString(),
        },
      ],
      meta: {
        page: 1,
        pageSize: 20,
        total: 1,
        totalPages: 1,
      },
    });
  });

  it('GET /api/v1/currencies rejects invalid pagination and sort query params', async () => {
    await withAuth(request(app.getHttpServer()))
      .get('/api/v1/currencies')
      .query({ page: 0 })
      .expect(400);

    await withAuth(request(app.getHttpServer()))
      .get('/api/v1/currencies')
      .query({ pageSize: 101 })
      .expect(400);

    await withAuth(request(app.getHttpServer()))
      .get('/api/v1/currencies')
      .query({ sortBy: 'rate' })
      .expect(400);

    await withAuth(request(app.getHttpServer()))
      .get('/api/v1/currencies')
      .query({ sortOrder: 'up' })
      .expect(400);

    expect(prisma.currency.findMany).not.toHaveBeenCalled();
  });

  it('GET /api/v1/currencies/:id rejects invalid UUID and maps missing currency to 404', async () => {
    await withAuth(request(app.getHttpServer()))
      .get('/api/v1/currencies/not-a-uuid')
      .expect(400);

    prisma.currency.findUnique.mockResolvedValue(null);

    const response = await withAuth(request(app.getHttpServer()))
      .get(`/api/v1/currencies/${currencyId}`)
      .expect(404);

    expect(response.body).toEqual(
      expect.objectContaining({
        statusCode: 404,
        message: 'Currency not found',
      }),
    );
  });

  it('PATCH /api/v1/currencies/:id rejects an empty body with 400', async () => {
    const response = await withAuth(request(app.getHttpServer()))
      .patch(`/api/v1/currencies/${currencyId}`)
      .send({})
      .expect(400);

    expect(response.body).toEqual(
      expect.objectContaining({
        statusCode: 400,
        message: 'At least one field must be provided',
      }),
    );
    expect(prisma.currency.findUnique).not.toHaveBeenCalled();
  });

  it('DELETE /api/v1/currencies/:id soft-deactivates and is idempotent', async () => {
    prisma.currency.findUnique.mockResolvedValue(baseCurrency);
    prisma.currency.update.mockResolvedValue({
      ...baseCurrency,
      isActive: false,
    });

    const first = await withAuth(request(app.getHttpServer()))
      .delete(`/api/v1/currencies/${currencyId}`)
      .expect(200);

    expect(first.body).toEqual(
      expect.objectContaining({
        id: currencyId,
        isActive: false,
      }),
    );
    expect(prisma.currency.delete).not.toHaveBeenCalled();

    prisma.currency.findUnique.mockResolvedValue({
      ...baseCurrency,
      isActive: false,
    });
    prisma.currency.update.mockClear();

    const second = await withAuth(request(app.getHttpServer()))
      .delete(`/api/v1/currencies/${currencyId}`)
      .expect(200);

    expect(second.body).toEqual(
      expect.objectContaining({
        id: currencyId,
        isActive: false,
      }),
    );
    expect(prisma.currency.update).not.toHaveBeenCalled();
  });

  it('PATCH /api/v1/currencies/:id reactivates via isActive true', async () => {
    prisma.currency.findUnique.mockResolvedValue({
      ...baseCurrency,
      isActive: false,
    });
    prisma.currency.update.mockResolvedValue({
      ...baseCurrency,
      isActive: true,
    });

    const response = await withAuth(request(app.getHttpServer()))
      .patch(`/api/v1/currencies/${currencyId}`)
      .send({ isActive: true })
      .expect(200);

    expect(response.body).toEqual(
      expect.objectContaining({
        id: currencyId,
        isActive: true,
      }),
    );
    expect(prisma.currency.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { isActive: true },
      }),
    );
  });
});
