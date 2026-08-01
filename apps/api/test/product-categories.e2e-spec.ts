import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/bootstrap/configure-app';
import { PrismaService } from '../src/prisma/prisma.service';
import { attachAuthUserMock, withAuth } from './auth-e2e.helper';

describe('Product categories (e2e)', () => {
  const categoryId = '11111111-1111-4111-8111-111111111111';
  const createdAt = new Date('2026-07-28T00:00:00.000Z');
  const updatedAt = new Date('2026-07-28T00:00:00.000Z');

  const baseCategory = {
    id: categoryId,
    name: 'Tekstil',
    isActive: true,
    createdAt,
    updatedAt,
  };

  const prisma = {
    onModuleInit: jest.fn().mockResolvedValue(undefined),
    onModuleDestroy: jest.fn().mockResolvedValue(undefined),
    productCategory: {
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

  it('POST /api/v1/product-categories creates and serializes a category response', async () => {
    prisma.productCategory.findFirst.mockResolvedValue(null);
    prisma.productCategory.create.mockResolvedValue(baseCategory);

    const response = await withAuth(request(app.getHttpServer()))
      .post('/api/v1/product-categories')
      .send({ name: ' Tekstil ' })
      .expect(201);

    expect(response.body).toEqual({
      id: categoryId,
      name: 'Tekstil',
      isActive: true,
      createdAt: createdAt.toISOString(),
      updatedAt: updatedAt.toISOString(),
    });
    expect(response.body).not.toHaveProperty('_count');
    expect(JSON.stringify(response.body)).not.toMatch(
      /prisma|DATABASE_URL|stack/i,
    );
  });

  it('POST /api/v1/product-categories rejects whitespace-only name with 400', async () => {
    const response = await withAuth(request(app.getHttpServer()))
      .post('/api/v1/product-categories')
      .send({ name: '   ' })
      .expect(400);

    expect(response.body).toEqual(
      expect.objectContaining({
        statusCode: 400,
        path: '/api/v1/product-categories',
      }),
    );
    expect(prisma.productCategory.create).not.toHaveBeenCalled();
  });

  it('POST /api/v1/product-categories maps duplicate name to 409', async () => {
    prisma.productCategory.findFirst.mockResolvedValue(null);
    prisma.productCategory.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique constraint', {
        code: 'P2002',
        clientVersion: '7.9.1',
      }),
    );

    const response = await withAuth(request(app.getHttpServer()))
      .post('/api/v1/product-categories')
      .send({ name: 'Tekstil' })
      .expect(409);

    expect(response.body).toEqual(
      expect.objectContaining({
        statusCode: 409,
        message: 'Product category name already exists',
      }),
    );
  });

  it('GET /api/v1/product-categories returns paginated data/meta shape', async () => {
    prisma.productCategory.findMany.mockResolvedValue([baseCategory]);
    prisma.productCategory.count.mockResolvedValue(1);

    const response = await withAuth(request(app.getHttpServer()))
      .get('/api/v1/product-categories')
      .expect(200);

    expect(response.body).toEqual({
      data: [
        {
          id: categoryId,
          name: 'Tekstil',
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

  it('GET /api/v1/product-categories rejects invalid pagination and sort query params', async () => {
    await withAuth(request(app.getHttpServer()))
      .get('/api/v1/product-categories')
      .query({ page: 0 })
      .expect(400);

    await withAuth(request(app.getHttpServer()))
      .get('/api/v1/product-categories')
      .query({ pageSize: 101 })
      .expect(400);

    await withAuth(request(app.getHttpServer()))
      .get('/api/v1/product-categories')
      .query({ sortBy: 'price' })
      .expect(400);

    await withAuth(request(app.getHttpServer()))
      .get('/api/v1/product-categories')
      .query({ sortOrder: 'up' })
      .expect(400);

    expect(prisma.productCategory.findMany).not.toHaveBeenCalled();
  });

  it('GET /api/v1/product-categories/:id rejects invalid UUID and maps missing category to 404', async () => {
    await withAuth(request(app.getHttpServer()))
      .get('/api/v1/product-categories/not-a-uuid')
      .expect(400);

    prisma.productCategory.findUnique.mockResolvedValue(null);

    const response = await withAuth(request(app.getHttpServer()))
      .get(`/api/v1/product-categories/${categoryId}`)
      .expect(404);

    expect(response.body).toEqual(
      expect.objectContaining({
        statusCode: 404,
        message: 'Product category not found',
      }),
    );
  });

  it('PATCH /api/v1/product-categories/:id rejects an empty body with 400', async () => {
    const response = await withAuth(request(app.getHttpServer()))
      .patch(`/api/v1/product-categories/${categoryId}`)
      .send({})
      .expect(400);

    expect(response.body).toEqual(
      expect.objectContaining({
        statusCode: 400,
        message: 'At least one field must be provided',
      }),
    );
    expect(prisma.productCategory.findUnique).not.toHaveBeenCalled();
  });

  it('DELETE /api/v1/product-categories/:id soft-deactivates and is idempotent', async () => {
    prisma.productCategory.findUnique.mockResolvedValue(baseCategory);
    prisma.productCategory.update.mockResolvedValue({
      ...baseCategory,
      isActive: false,
    });

    const first = await withAuth(request(app.getHttpServer()))
      .delete(`/api/v1/product-categories/${categoryId}`)
      .expect(200);

    expect(first.body).toEqual(
      expect.objectContaining({
        id: categoryId,
        isActive: false,
      }),
    );
    expect(prisma.productCategory.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { isActive: false },
      }),
    );
    expect(prisma.productCategory.delete).not.toHaveBeenCalled();

    prisma.productCategory.findUnique.mockResolvedValue({
      ...baseCategory,
      isActive: false,
    });
    prisma.productCategory.update.mockClear();

    const second = await withAuth(request(app.getHttpServer()))
      .delete(`/api/v1/product-categories/${categoryId}`)
      .expect(200);

    expect(second.body).toEqual(
      expect.objectContaining({
        id: categoryId,
        isActive: false,
      }),
    );
    expect(prisma.productCategory.update).not.toHaveBeenCalled();
  });

  it('PATCH /api/v1/product-categories/:id reactivates via isActive true', async () => {
    prisma.productCategory.findUnique.mockResolvedValue({
      ...baseCategory,
      isActive: false,
    });
    prisma.productCategory.update.mockResolvedValue({
      ...baseCategory,
      isActive: true,
    });

    const response = await withAuth(request(app.getHttpServer()))
      .patch(`/api/v1/product-categories/${categoryId}`)
      .send({ isActive: true })
      .expect(200);

    expect(response.body).toEqual(
      expect.objectContaining({
        id: categoryId,
        isActive: true,
      }),
    );
    expect(prisma.productCategory.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { isActive: true },
      }),
    );
  });
});
