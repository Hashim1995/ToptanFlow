import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/bootstrap/configure-app';
import { NumberSequencesService } from '../src/number-sequences/number-sequences.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { WarehouseKindApi } from '../src/warehouses/dto/warehouse-kind.enum';
import { attachAuthUserMock, withAuth } from './auth-e2e.helper';

describe('Warehouses (e2e)', () => {
  const warehouseId = '11111111-1111-4111-8111-111111111111';
  const createdAt = new Date('2026-07-31T00:00:00.000Z');
  const updatedAt = new Date('2026-07-31T00:00:00.000Z');

  const baseWarehouse = {
    id: warehouseId,
    code: '0000001',
    name: 'Əsas anbar',
    kind: WarehouseKindApi.GENERAL,
    isActive: true,
    createdAt,
    updatedAt,
  };

  const expectedWarehouseBody = {
    id: warehouseId,
    code: '0000001',
    name: 'Əsas anbar',
    kind: WarehouseKindApi.GENERAL,
    isActive: true,
    createdAt: createdAt.toISOString(),
    updatedAt: updatedAt.toISOString(),
  };

  const numberSequences = {
    nextCode: jest.fn().mockResolvedValue('0000001'),
  };

  const prisma = {
    onModuleInit: jest.fn().mockResolvedValue(undefined),
    onModuleDestroy: jest.fn().mockResolvedValue(undefined),
    $transaction: jest.fn((fn: (tx: unknown) => unknown) =>
      Promise.resolve(fn(prisma)),
    ),
    warehouse: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  let app: INestApplication<App>;

  beforeEach(async () => {
    jest.clearAllMocks();
    numberSequences.nextCode.mockResolvedValue('0000001');
    attachAuthUserMock(prisma);

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .overrideProvider(NumberSequencesService)
      .useValue(numberSequences)
      .compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('POST /api/v1/warehouses returns 401 without Bearer token', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/warehouses')
      .send({ name: 'Əsas anbar', kind: WarehouseKindApi.GENERAL })
      .expect(401);

    expect(prisma.warehouse.create).not.toHaveBeenCalled();
  });

  it('POST /api/v1/warehouses creates and serializes a warehouse response', async () => {
    prisma.warehouse.create.mockResolvedValue(baseWarehouse);

    const response = await withAuth(request(app.getHttpServer()))
      .post('/api/v1/warehouses')
      .send({ name: ' Əsas anbar ', kind: WarehouseKindApi.GENERAL })
      .expect(201);

    expect(response.body).toEqual(expectedWarehouseBody);
    expect(response.body).not.toHaveProperty('passwordHash');
    expect(JSON.stringify(response.body)).not.toMatch(
      /prisma|DATABASE_URL|stack|passwordHash/i,
    );
    expect(numberSequences.nextCode).toHaveBeenCalled();
    expect(prisma.warehouse.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          code: '0000001',
          name: 'Əsas anbar',
          kind: WarehouseKindApi.GENERAL,
          isActive: true,
        }) as object,
      }),
    );
  });

  it('POST /api/v1/warehouses rejects whitespace-only name with 400', async () => {
    const response = await withAuth(request(app.getHttpServer()))
      .post('/api/v1/warehouses')
      .send({ name: '   ', kind: WarehouseKindApi.GENERAL })
      .expect(400);

    expect(response.body).toEqual(
      expect.objectContaining({
        statusCode: 400,
        path: '/api/v1/warehouses',
      }),
    );
    expect(prisma.warehouse.create).not.toHaveBeenCalled();
  });

  it('POST /api/v1/warehouses rejects missing kind with 400', async () => {
    await withAuth(request(app.getHttpServer()))
      .post('/api/v1/warehouses')
      .send({ name: 'Əsas anbar' })
      .expect(400);

    expect(prisma.warehouse.create).not.toHaveBeenCalled();
  });

  it('POST /api/v1/warehouses maps duplicate code to 409', async () => {
    prisma.warehouse.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique constraint', {
        code: 'P2002',
        clientVersion: '7.9.1',
      }),
    );

    const response = await withAuth(request(app.getHttpServer()))
      .post('/api/v1/warehouses')
      .send({ name: 'Əsas anbar', kind: WarehouseKindApi.GENERAL })
      .expect(409);

    expect(response.body).toEqual(
      expect.objectContaining({
        statusCode: 409,
        message: 'Warehouse code already exists',
      }),
    );
  });

  it('GET /api/v1/warehouses returns paginated data/meta shape', async () => {
    prisma.warehouse.findMany.mockResolvedValue([baseWarehouse]);
    prisma.warehouse.count.mockResolvedValue(1);

    const response = await withAuth(request(app.getHttpServer()))
      .get('/api/v1/warehouses')
      .expect(200);

    expect(response.body).toEqual({
      data: [expectedWarehouseBody],
      meta: {
        page: 1,
        pageSize: 20,
        total: 1,
        totalPages: 1,
      },
    });
  });

  it('GET /api/v1/warehouses rejects invalid pagination and sort query params', async () => {
    await withAuth(request(app.getHttpServer()))
      .get('/api/v1/warehouses')
      .query({ page: 0 })
      .expect(400);

    await withAuth(request(app.getHttpServer()))
      .get('/api/v1/warehouses')
      .query({ pageSize: 101 })
      .expect(400);

    await withAuth(request(app.getHttpServer()))
      .get('/api/v1/warehouses')
      .query({ sortBy: 'price' })
      .expect(400);

    await withAuth(request(app.getHttpServer()))
      .get('/api/v1/warehouses')
      .query({ sortOrder: 'up' })
      .expect(400);

    expect(prisma.warehouse.findMany).not.toHaveBeenCalled();
  });

  it('GET /api/v1/warehouses/:id rejects invalid UUID and maps missing warehouse to 404', async () => {
    await withAuth(request(app.getHttpServer()))
      .get('/api/v1/warehouses/not-a-uuid')
      .expect(400);

    prisma.warehouse.findUnique.mockResolvedValue(null);

    const response = await withAuth(request(app.getHttpServer()))
      .get(`/api/v1/warehouses/${warehouseId}`)
      .expect(404);

    expect(response.body).toEqual(
      expect.objectContaining({
        statusCode: 404,
        message: 'Warehouse not found',
      }),
    );
  });

  it('PATCH /api/v1/warehouses/:id rejects an empty body with 400', async () => {
    const response = await withAuth(request(app.getHttpServer()))
      .patch(`/api/v1/warehouses/${warehouseId}`)
      .send({})
      .expect(400);

    expect(response.body).toEqual(
      expect.objectContaining({
        statusCode: 400,
        message: 'At least one field must be provided',
      }),
    );
    expect(prisma.warehouse.findUnique).not.toHaveBeenCalled();
  });

  it('PATCH /api/v1/warehouses/:id updates name and kind', async () => {
    prisma.warehouse.findUnique.mockResolvedValue(baseWarehouse);
    prisma.warehouse.update.mockResolvedValue({
      ...baseWarehouse,
      name: 'Zədələnmiş anbar',
      kind: WarehouseKindApi.DAMAGED,
    });

    const response = await withAuth(request(app.getHttpServer()))
      .patch(`/api/v1/warehouses/${warehouseId}`)
      .send({ name: ' Zədələnmiş anbar ', kind: WarehouseKindApi.DAMAGED })
      .expect(200);

    expect(response.body).toEqual(
      expect.objectContaining({
        id: warehouseId,
        code: '0000001',
        name: 'Zədələnmiş anbar',
        kind: WarehouseKindApi.DAMAGED,
      }),
    );
    expect(prisma.warehouse.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          name: 'Zədələnmiş anbar',
          kind: WarehouseKindApi.DAMAGED,
        },
      }),
    );
  });

  it('DELETE /api/v1/warehouses/:id soft-deactivates and is idempotent', async () => {
    prisma.warehouse.findUnique.mockResolvedValue(baseWarehouse);
    prisma.warehouse.update.mockResolvedValue({
      ...baseWarehouse,
      isActive: false,
    });

    const first = await withAuth(request(app.getHttpServer()))
      .delete(`/api/v1/warehouses/${warehouseId}`)
      .expect(200);

    expect(first.body).toEqual(
      expect.objectContaining({
        id: warehouseId,
        isActive: false,
      }),
    );
    expect(prisma.warehouse.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { isActive: false },
      }),
    );
    expect(prisma.warehouse.delete).not.toHaveBeenCalled();

    prisma.warehouse.findUnique.mockResolvedValue({
      ...baseWarehouse,
      isActive: false,
    });
    prisma.warehouse.update.mockClear();

    const second = await withAuth(request(app.getHttpServer()))
      .delete(`/api/v1/warehouses/${warehouseId}`)
      .expect(200);

    expect(second.body).toEqual(
      expect.objectContaining({
        id: warehouseId,
        isActive: false,
      }),
    );
    expect(prisma.warehouse.update).not.toHaveBeenCalled();
  });

  it('PATCH /api/v1/warehouses/:id reactivates via isActive true', async () => {
    prisma.warehouse.findUnique.mockResolvedValue({
      ...baseWarehouse,
      isActive: false,
    });
    prisma.warehouse.update.mockResolvedValue({
      ...baseWarehouse,
      isActive: true,
    });

    const response = await withAuth(request(app.getHttpServer()))
      .patch(`/api/v1/warehouses/${warehouseId}`)
      .send({ isActive: true })
      .expect(200);

    expect(response.body).toEqual(
      expect.objectContaining({
        id: warehouseId,
        isActive: true,
      }),
    );
    expect(prisma.warehouse.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { isActive: true },
      }),
    );
  });
});
