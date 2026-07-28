import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/bootstrap/configure-app';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Units (e2e)', () => {
  const unitId = '11111111-1111-4111-8111-111111111111';
  const createdAt = new Date('2026-07-28T00:00:00.000Z');
  const updatedAt = new Date('2026-07-28T00:00:00.000Z');

  const baseUnit = {
    id: unitId,
    code: 'KG',
    name: 'Kiloqram',
    allowsFractionalQuantity: true,
    isActive: true,
    createdAt,
    updatedAt,
  };

  const prisma = {
    onModuleInit: jest.fn().mockResolvedValue(undefined),
    onModuleDestroy: jest.fn().mockResolvedValue(undefined),
    unit: {
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

  it('POST /api/v1/units creates and serializes a unit response', async () => {
    prisma.unit.create.mockResolvedValue(baseUnit);

    const response = await request(app.getHttpServer())
      .post('/api/v1/units')
      .send({ code: 'kg', name: 'Kiloqram' })
      .expect(201);

    expect(response.body).toEqual({
      id: unitId,
      code: 'KG',
      name: 'Kiloqram',
      allowsFractionalQuantity: true,
      isActive: true,
      createdAt: createdAt.toISOString(),
      updatedAt: updatedAt.toISOString(),
    });
    expect(response.body).not.toHaveProperty('_count');
    expect(JSON.stringify(response.body)).not.toMatch(
      /prisma|DATABASE_URL|stack/i,
    );
  });

  it('POST /api/v1/units rejects whitespace-only fields with 400', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/units')
      .send({ code: '   ', name: '   ' })
      .expect(400);

    expect(response.body).toEqual(
      expect.objectContaining({
        statusCode: 400,
        path: '/api/v1/units',
      }),
    );
    expect(prisma.unit.create).not.toHaveBeenCalled();
  });

  it('POST /api/v1/units maps duplicate code to 409', async () => {
    prisma.unit.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique constraint', {
        code: 'P2002',
        clientVersion: '7.9.1',
      }),
    );

    const response = await request(app.getHttpServer())
      .post('/api/v1/units')
      .send({ code: 'KG', name: 'Duplicate' })
      .expect(409);

    expect(response.body).toEqual(
      expect.objectContaining({
        statusCode: 409,
        message: 'Unit code already exists',
      }),
    );
  });

  it('GET /api/v1/units returns paginated data/meta shape', async () => {
    prisma.unit.findMany.mockResolvedValue([baseUnit]);
    prisma.unit.count.mockResolvedValue(1);

    const response = await request(app.getHttpServer())
      .get('/api/v1/units')
      .expect(200);

    expect(response.body).toEqual({
      data: [
        {
          id: unitId,
          code: 'KG',
          name: 'Kiloqram',
          allowsFractionalQuantity: true,
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

  it('GET /api/v1/units rejects invalid pagination and sort query params', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/units')
      .query({ page: 0 })
      .expect(400);

    await request(app.getHttpServer())
      .get('/api/v1/units')
      .query({ pageSize: 101 })
      .expect(400);

    await request(app.getHttpServer())
      .get('/api/v1/units')
      .query({ sortBy: 'price' })
      .expect(400);

    await request(app.getHttpServer())
      .get('/api/v1/units')
      .query({ sortOrder: 'up' })
      .expect(400);

    expect(prisma.unit.findMany).not.toHaveBeenCalled();
  });

  it('GET /api/v1/units/:id rejects invalid UUID and maps missing unit to 404', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/units/not-a-uuid')
      .expect(400);

    prisma.unit.findUnique.mockResolvedValue(null);

    const response = await request(app.getHttpServer())
      .get(`/api/v1/units/${unitId}`)
      .expect(404);

    expect(response.body).toEqual(
      expect.objectContaining({
        statusCode: 404,
        message: 'Unit not found',
      }),
    );
  });

  it('PATCH /api/v1/units/:id rejects an empty body with 400', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/api/v1/units/${unitId}`)
      .send({})
      .expect(400);

    expect(response.body).toEqual(
      expect.objectContaining({
        statusCode: 400,
        message: 'At least one field must be provided',
      }),
    );
    expect(prisma.unit.findUnique).not.toHaveBeenCalled();
  });

  it('DELETE /api/v1/units/:id soft-deactivates and is idempotent', async () => {
    prisma.unit.findUnique.mockResolvedValue(baseUnit);
    prisma.unit.update.mockResolvedValue({ ...baseUnit, isActive: false });

    const first = await request(app.getHttpServer())
      .delete(`/api/v1/units/${unitId}`)
      .expect(200);

    expect(first.body).toEqual(
      expect.objectContaining({
        id: unitId,
        isActive: false,
      }),
    );
    expect(prisma.unit.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { isActive: false },
      }),
    );
    expect(prisma.unit.delete).not.toHaveBeenCalled();

    prisma.unit.findUnique.mockResolvedValue({ ...baseUnit, isActive: false });
    prisma.unit.update.mockClear();

    const second = await request(app.getHttpServer())
      .delete(`/api/v1/units/${unitId}`)
      .expect(200);

    expect(second.body).toEqual(
      expect.objectContaining({
        id: unitId,
        isActive: false,
      }),
    );
    expect(prisma.unit.update).not.toHaveBeenCalled();
  });
});
