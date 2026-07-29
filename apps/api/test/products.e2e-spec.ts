import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/bootstrap/configure-app';
import { ProductTypeApi } from '../src/products/dto/product-type.enum';
import { NumberSequencesService } from '../src/number-sequences/number-sequences.service';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Products (e2e)', () => {
  const productId = '11111111-1111-4111-8111-111111111111';
  const unitId = '22222222-2222-4222-8222-222222222222';
  const otherUnitId = '33333333-3333-4333-8333-333333333333';
  const categoryId = '66666666-6666-4666-8666-666666666666';
  const createdAt = new Date('2026-07-28T00:00:00.000Z');
  const updatedAt = new Date('2026-07-28T00:00:00.000Z');

  const unitSummary = {
    id: unitId,
    code: 'KG',
    name: 'Kiloqram',
    allowsFractionalQuantity: true,
    isActive: true,
  };

  const categorySummary = {
    id: categoryId,
    name: 'Tekstil',
    isActive: true,
  };

  const baseProduct = {
    id: productId,
    code: '0000001',
    name: 'Parça məhsul',
    type: ProductTypeApi.FINISHED_GOOD,
    categoryId,
    unitId,
    standardSalePrice: new Prisma.Decimal('12.5'),
    latestPurchasePrice: new Prisma.Decimal('10'),
    criticalStockThreshold: null,
    isActive: true,
    createdAt,
    updatedAt,
    unit: unitSummary,
    category: categorySummary,
  };

  const expectedProductBody = {
    id: productId,
    code: '0000001',
    name: 'Parça məhsul',
    type: ProductTypeApi.FINISHED_GOOD,
    categoryId,
    category: categorySummary,
    unitId,
    unit: unitSummary,
    standardSalePrice: '12.5000',
    latestPurchasePrice: '10.0000',
    criticalStockThreshold: null,
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
    product: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    unit: {
      findUnique: jest.fn(),
    },
    productCategory: {
      findUnique: jest.fn(),
    },
  };

  let app: INestApplication<App>;

  type ProductUnitJson = typeof unitSummary;
  type ProductCategoryJson = typeof categorySummary;
  type ProductJson = {
    id: string;
    code: string;
    name: string;
    type: string;
    categoryId: string | null;
    category: ProductCategoryJson | null;
    unitId: string;
    unit: ProductUnitJson;
    standardSalePrice: string | null;
    latestPurchasePrice: string | null;
    criticalStockThreshold: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  };

  type PaginatedProductsJson = {
    data: ProductJson[];
    meta: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    };
  };

  function assertNoInternalLeak(body: unknown): void {
    const text = JSON.stringify(body);
    expect(text).not.toMatch(/prisma|P2002|DATABASE_URL|\.ts:|stack/i);
  }

  function assertErrorShape(
    body: unknown,
    statusCode: number,
    pathSuffix: string,
  ): void {
    const record = body as Record<string, unknown>;
    expect(record).toEqual(
      expect.objectContaining({
        statusCode,
        path: expect.stringContaining(pathSuffix) as string,
        timestamp: expect.any(String) as string,
      }),
    );
    expect(record).not.toHaveProperty('stack');
    assertNoInternalLeak(record);
  }

  const validCreatePayload = {
    name: ' Yeni məhsul ',
    type: ProductTypeApi.FINISHED_GOOD,
    unitId,
    categoryId: null,
    standardSalePrice: '12.5',
    latestPurchasePrice: '0',
  };

  const productResponseKeys = [
    'category',
    'categoryId',
    'code',
    'createdAt',
    'criticalStockThreshold',
    'id',
    'isActive',
    'latestPurchasePrice',
    'name',
    'standardSalePrice',
    'type',
    'unit',
    'unitId',
    'updatedAt',
  ].sort();

  beforeEach(async () => {
    jest.clearAllMocks();

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

  describe('POST /api/v1/products', () => {
    it('creates a product with backend-generated code and normalized fields', async () => {
      prisma.unit.findUnique.mockResolvedValue({ id: unitId, isActive: true });
      prisma.product.create.mockResolvedValue({
        ...baseProduct,
        code: '0000001',
        name: 'Yeni məhsul',
        categoryId: null,
        category: null,
        latestPurchasePrice: new Prisma.Decimal('0'),
      });

      const response = await request(app.getHttpServer())
        .post('/api/v1/products')
        .send(validCreatePayload)
        .expect(201);

      const body = response.body as ProductJson;

      expect(body).toEqual({
        ...expectedProductBody,
        code: '0000001',
        name: 'Yeni məhsul',
        categoryId: null,
        category: null,
        standardSalePrice: '12.5000',
        latestPurchasePrice: '0.0000',
      });
      expect(numberSequences.nextCode).toHaveBeenCalled();
      expect(prisma.product.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            code: '0000001',
            name: 'Yeni məhsul',
            categoryId: null,
            isActive: true,
          }) as object,
        }),
      );
      expect(Object.keys(body).sort()).toEqual(productResponseKeys);
      expect(body.unit).toEqual(unitSummary);
      expect(body.isActive).toBe(true);
      assertNoInternalLeak(response.body);
    });

    it('assigns an active categoryId when provided', async () => {
      prisma.unit.findUnique.mockResolvedValue({ id: unitId, isActive: true });
      prisma.productCategory.findUnique.mockResolvedValue({
        id: categoryId,
        isActive: true,
      });
      prisma.product.create.mockResolvedValue({
        ...baseProduct,
        name: 'Yeni məhsul',
        latestPurchasePrice: new Prisma.Decimal('0'),
      });

      const response = await request(app.getHttpServer())
        .post('/api/v1/products')
        .send({ ...validCreatePayload, categoryId })
        .expect(201);

      const body = response.body as ProductJson;
      expect(body.categoryId).toBe(categoryId);
      expect(body.category).toEqual(categorySummary);
      expect(prisma.productCategory.findUnique).toHaveBeenCalled();
      expect(prisma.product.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ categoryId }) as object,
        }),
      );
    });

    it('rejects client-supplied code with 400', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/products')
        .send({ ...validCreatePayload, code: 'TX-999' })
        .expect(400);

      expect(prisma.product.create).not.toHaveBeenCalled();
      expect(numberSequences.nextCode).not.toHaveBeenCalled();
    });

    it('assigns increasing backend codes on consecutive creates', async () => {
      prisma.unit.findUnique.mockResolvedValue({ id: unitId, isActive: true });
      numberSequences.nextCode
        .mockResolvedValueOnce('0000001')
        .mockResolvedValueOnce('0000002');
      prisma.product.create
        .mockResolvedValueOnce({
          ...baseProduct,
          id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
          code: '0000001',
          name: 'Birinci',
          categoryId: null,
          category: null,
        })
        .mockResolvedValueOnce({
          ...baseProduct,
          id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
          code: '0000002',
          name: 'İkinci',
          categoryId: null,
          category: null,
        });

      const first = await request(app.getHttpServer())
        .post('/api/v1/products')
        .send({ ...validCreatePayload, name: 'Birinci' })
        .expect(201);
      const second = await request(app.getHttpServer())
        .post('/api/v1/products')
        .send({ ...validCreatePayload, name: 'İkinci' })
        .expect(201);

      expect((first.body as ProductJson).code).toBe('0000001');
      expect((second.body as ProductJson).code).toBe('0000002');
      expect(numberSequences.nextCode).toHaveBeenCalledTimes(2);
    });

    it('rejects missing required fields and unknown body properties', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/products')
        .send({ name: 'X', type: ProductTypeApi.FINISHED_GOOD })
        .expect(400);

      await request(app.getHttpServer())
        .post('/api/v1/products')
        .send({ ...validCreatePayload, unknownField: true })
        .expect(400);

      expect(prisma.product.create).not.toHaveBeenCalled();
    });

    it('rejects whitespace-only name with 400', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/products')
        .send({ ...validCreatePayload, name: '   ' })
        .expect(400);
    });

    it('rejects invalid type, unitId UUID, categoryId UUID, and decimal payloads', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/products')
        .send({ ...validCreatePayload, type: 'INVALID' })
        .expect(400);

      await request(app.getHttpServer())
        .post('/api/v1/products')
        .send({ ...validCreatePayload, unitId: 'not-a-uuid' })
        .expect(400);

      await request(app.getHttpServer())
        .post('/api/v1/products')
        .send({ ...validCreatePayload, categoryId: 'not-a-uuid' })
        .expect(400);

      await request(app.getHttpServer())
        .post('/api/v1/products')
        .send({ ...validCreatePayload, standardSalePrice: 12.5 })
        .expect(400);

      await request(app.getHttpServer())
        .post('/api/v1/products')
        .send({ ...validCreatePayload, standardSalePrice: '-1' })
        .expect(400);

      await request(app.getHttpServer())
        .post('/api/v1/products')
        .send({ ...validCreatePayload, standardSalePrice: '12.12345' })
        .expect(400);

      await request(app.getHttpServer())
        .post('/api/v1/products')
        .send({ ...validCreatePayload, standardSalePrice: '1e3' })
        .expect(400);

      await request(app.getHttpServer())
        .post('/api/v1/products')
        .send({
          ...validCreatePayload,
          standardSalePrice: '999999999999999.9999',
        })
        .expect(400);
    });

    it('maps missing unit to 404 and inactive unit to 400', async () => {
      prisma.unit.findUnique.mockResolvedValue(null);

      const notFound = await request(app.getHttpServer())
        .post('/api/v1/products')
        .send(validCreatePayload)
        .expect(404);

      assertErrorShape(notFound.body, 404, '/api/v1/products');
      expect(notFound.body).toEqual(
        expect.objectContaining({ message: 'Unit not found' }),
      );

      prisma.unit.findUnique.mockResolvedValue({ id: unitId, isActive: false });

      const inactive = await request(app.getHttpServer())
        .post('/api/v1/products')
        .send(validCreatePayload)
        .expect(400);

      expect(inactive.body).toEqual(
        expect.objectContaining({ message: 'Unit is inactive' }),
      );
    });

    it('maps missing category to 404 and inactive category to 400', async () => {
      prisma.unit.findUnique.mockResolvedValue({ id: unitId, isActive: true });
      prisma.productCategory.findUnique.mockResolvedValue(null);

      const notFound = await request(app.getHttpServer())
        .post('/api/v1/products')
        .send({ ...validCreatePayload, categoryId })
        .expect(404);

      expect(notFound.body).toEqual(
        expect.objectContaining({ message: 'Product category not found' }),
      );

      prisma.productCategory.findUnique.mockResolvedValue({
        id: categoryId,
        isActive: false,
      });

      const inactive = await request(app.getHttpServer())
        .post('/api/v1/products')
        .send({ ...validCreatePayload, categoryId })
        .expect(400);

      expect(inactive.body).toEqual(
        expect.objectContaining({ message: 'Product category is inactive' }),
      );
      expect(prisma.product.create).not.toHaveBeenCalled();
    });

    it('maps duplicate product code to 409 without leaking Prisma details', async () => {
      prisma.unit.findUnique.mockResolvedValue({ id: unitId, isActive: true });
      prisma.product.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('Unique constraint', {
          code: 'P2002',
          clientVersion: '7.9.1',
        }),
      );

      const response = await request(app.getHttpServer())
        .post('/api/v1/products')
        .send(validCreatePayload)
        .expect(409);

      expect(response.body).toEqual(
        expect.objectContaining({
          statusCode: 409,
          message: 'Product code already exists',
        }),
      );
      assertNoInternalLeak(response.body);
    });
  });

  describe('GET /api/v1/products', () => {
    it('returns paginated data with default query parameters', async () => {
      const inactive = {
        ...baseProduct,
        id: '99999999-9999-4999-8999-999999999999',
        code: 'TX-INACTIVE',
        isActive: false,
      };
      prisma.product.findMany.mockResolvedValue([baseProduct, inactive]);
      prisma.product.count.mockResolvedValue(2);

      const response = await request(app.getHttpServer())
        .get('/api/v1/products')
        .expect(200);

      const body = response.body as PaginatedProductsJson;

      expect(body.meta).toEqual({
        page: 1,
        pageSize: 20,
        total: 2,
        totalPages: 1,
      });
      expect(body.data).toHaveLength(2);
      expect(body.data[0].standardSalePrice).toBe('12.5000');
      expect(body.data[0].unit).toEqual(unitSummary);
      expect(body.data[0].categoryId).toBe(categoryId);
      expect(body.data[0].category).toEqual(categorySummary);
      expect(body.data[0]).not.toHaveProperty('saleItems');
      expect(body.data[0]).not.toHaveProperty('purchaseItems');
      expect(body.data[1].isActive).toBe(false);

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 20,
          orderBy: [{ code: 'asc' }, { id: 'asc' }],
        }),
      );
    });

    it('rejects invalid pagination, filters, and sort query params', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/products')
        .query({ page: 0 })
        .expect(400);
      await request(app.getHttpServer())
        .get('/api/v1/products')
        .query({ pageSize: 101 })
        .expect(400);
      await request(app.getHttpServer())
        .get('/api/v1/products')
        .query({ isActive: 'maybe' })
        .expect(400);
      await request(app.getHttpServer())
        .get('/api/v1/products')
        .query({ type: 'INVALID' })
        .expect(400);
      await request(app.getHttpServer())
        .get('/api/v1/products')
        .query({ unitId: 'bad' })
        .expect(400);
      await request(app.getHttpServer())
        .get('/api/v1/products')
        .query({ categoryId: 'bad' })
        .expect(400);
      await request(app.getHttpServer())
        .get('/api/v1/products')
        .query({ sortBy: 'stock' })
        .expect(400);
      await request(app.getHttpServer())
        .get('/api/v1/products')
        .query({ sortBy: 'category' })
        .expect(400);
      await request(app.getHttpServer())
        .get('/api/v1/products')
        .query({ sortOrder: 'up' })
        .expect(400);
      await request(app.getHttpServer())
        .get('/api/v1/products')
        .query({ extra: 'x' })
        .expect(400);

      expect(prisma.product.findMany).not.toHaveBeenCalled();
    });

    it('transforms isActive and ignores whitespace-only search', async () => {
      prisma.product.findMany.mockResolvedValue([]);
      prisma.product.count.mockResolvedValue(0);

      await request(app.getHttpServer())
        .get('/api/v1/products')
        .query({ isActive: 'true' })
        .expect(200);

      expect(prisma.product.findMany).toHaveBeenLastCalledWith(
        expect.objectContaining({
          where: { isActive: true },
        }),
      );

      await request(app.getHttpServer())
        .get('/api/v1/products')
        .query({ isActive: 'false' })
        .expect(200);

      expect(prisma.product.findMany).toHaveBeenLastCalledWith(
        expect.objectContaining({
          where: { isActive: false },
        }),
      );

      prisma.product.findMany.mockClear();

      await request(app.getHttpServer())
        .get('/api/v1/products')
        .query({ search: '   ' })
        .expect(200);

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: undefined,
        }),
      );
    });

    it('applies categoryId filter when provided', async () => {
      prisma.product.findMany.mockResolvedValue([]);
      prisma.product.count.mockResolvedValue(0);

      await request(app.getHttpServer())
        .get('/api/v1/products')
        .query({ categoryId })
        .expect(200);

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { categoryId },
        }),
      );
    });
  });

  describe('GET /api/v1/products/:id', () => {
    it('returns active and inactive products with consistent shape', async () => {
      prisma.product.findUnique.mockResolvedValue(baseProduct);

      const active = await request(app.getHttpServer())
        .get(`/api/v1/products/${productId}`)
        .expect(200);

      expect(active.body as ProductJson).toEqual(expectedProductBody);
      expect(Object.keys(active.body as ProductJson).sort()).toEqual(
        productResponseKeys,
      );

      prisma.product.findUnique.mockResolvedValue({
        ...baseProduct,
        isActive: false,
      });

      const inactive = await request(app.getHttpServer())
        .get(`/api/v1/products/${productId}`)
        .expect(200);

      const inactiveBody = inactive.body as ProductJson;
      expect(inactiveBody.isActive).toBe(false);
      expect(inactiveBody.criticalStockThreshold).toBeNull();
      expect(inactiveBody.categoryId).toBe(categoryId);
      expect(inactiveBody.category).toEqual(categorySummary);
    });

    it('rejects invalid UUID and missing product', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/products/not-a-uuid')
        .expect(400);

      prisma.product.findUnique.mockResolvedValue(null);

      const response = await request(app.getHttpServer())
        .get(`/api/v1/products/${productId}`)
        .expect(404);

      assertErrorShape(response.body, 404, `/api/v1/products/${productId}`);
      expect(response.body).toEqual(
        expect.objectContaining({ message: 'Product not found' }),
      );
    });
  });

  describe('PATCH /api/v1/products/:id', () => {
    beforeEach(() => {
      prisma.product.findUnique.mockResolvedValue(baseProduct);
    });

    it('rejects empty body, invalid UUID, and null on non-nullable fields', async () => {
      const empty = await request(app.getHttpServer())
        .patch(`/api/v1/products/${productId}`)
        .send({})
        .expect(400);

      expect(empty.body).toEqual(
        expect.objectContaining({
          message: 'At least one field must be provided',
        }),
      );

      await request(app.getHttpServer())
        .patch('/api/v1/products/not-a-uuid')
        .send({ name: 'X' })
        .expect(400);

      await request(app.getHttpServer())
        .patch(`/api/v1/products/${productId}`)
        .send({ name: null })
        .expect(400);

      await request(app.getHttpServer())
        .patch(`/api/v1/products/${productId}`)
        .send({ code: 'TX-010' })
        .expect(400);
    });

    it('applies partial updates, null clearing, and preserves zero decimals', async () => {
      prisma.product.update.mockResolvedValue({
        ...baseProduct,
        name: 'Trimmed',
        categoryId: null,
        category: null,
        type: ProductTypeApi.RAW_MATERIAL,
        standardSalePrice: null,
        latestPurchasePrice: new Prisma.Decimal('0'),
        unitId: otherUnitId,
        unit: { ...unitSummary, id: otherUnitId },
      });
      prisma.unit.findUnique.mockResolvedValue({
        id: otherUnitId,
        isActive: true,
      });

      const response = await request(app.getHttpServer())
        .patch(`/api/v1/products/${productId}`)
        .send({
          name: ' Trimmed ',
          categoryId: null,
          type: ProductTypeApi.RAW_MATERIAL,
          standardSalePrice: null,
          latestPurchasePrice: '0',
          unitId: otherUnitId,
        })
        .expect(200);

      const patchBody = response.body as ProductJson;

      expect(patchBody).toEqual(
        expect.objectContaining({
          code: '0000001',
          name: 'Trimmed',
          categoryId: null,
          category: null,
          type: ProductTypeApi.RAW_MATERIAL,
          standardSalePrice: null,
          latestPurchasePrice: '0.0000',
          unitId: otherUnitId,
        }),
      );

      expect(prisma.product.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.not.objectContaining({ code: expect.anything() }),
        }),
      );
      expect(prisma.productCategory.findUnique).not.toHaveBeenCalled();
    });

    it('rejects validation errors for name, type, unitId, categoryId, and decimals', async () => {
      await request(app.getHttpServer())
        .patch(`/api/v1/products/${productId}`)
        .send({ name: '   ' })
        .expect(400);

      await request(app.getHttpServer())
        .patch(`/api/v1/products/${productId}`)
        .send({ type: 'BAD' })
        .expect(400);

      await request(app.getHttpServer())
        .patch(`/api/v1/products/${productId}`)
        .send({ unitId: 'bad' })
        .expect(400);

      await request(app.getHttpServer())
        .patch(`/api/v1/products/${productId}`)
        .send({ categoryId: 'bad' })
        .expect(400);

      await request(app.getHttpServer())
        .patch(`/api/v1/products/${productId}`)
        .send({ mystery: true })
        .expect(400);

      await request(app.getHttpServer())
        .patch(`/api/v1/products/${productId}`)
        .send({ standardSalePrice: 5 })
        .expect(400);

      await request(app.getHttpServer())
        .patch(`/api/v1/products/${productId}`)
        .send({ standardSalePrice: '-1' })
        .expect(400);

      await request(app.getHttpServer())
        .patch(`/api/v1/products/${productId}`)
        .send({ standardSalePrice: '1e2' })
        .expect(400);
    });

    it('maps missing product, unit, and category errors', async () => {
      prisma.product.findUnique.mockResolvedValue(null);

      await request(app.getHttpServer())
        .patch(`/api/v1/products/${productId}`)
        .send({ name: 'X' })
        .expect(404);

      prisma.product.findUnique.mockResolvedValue(baseProduct);
      prisma.unit.findUnique.mockResolvedValue(null);

      await request(app.getHttpServer())
        .patch(`/api/v1/products/${productId}`)
        .send({ unitId: otherUnitId })
        .expect(404);

      prisma.unit.findUnique.mockResolvedValue({
        id: otherUnitId,
        isActive: false,
      });

      await request(app.getHttpServer())
        .patch(`/api/v1/products/${productId}`)
        .send({ unitId: otherUnitId })
        .expect(400);

      prisma.productCategory.findUnique.mockResolvedValue(null);

      await request(app.getHttpServer())
        .patch(`/api/v1/products/${productId}`)
        .send({ categoryId })
        .expect(404);

      prisma.productCategory.findUnique.mockResolvedValue({
        id: categoryId,
        isActive: false,
      });

      await request(app.getHttpServer())
        .patch(`/api/v1/products/${productId}`)
        .send({ categoryId })
        .expect(400);
    });

    it('updates inactive product without changing isActive when omitted', async () => {
      prisma.product.findUnique.mockResolvedValue({
        ...baseProduct,
        isActive: false,
      });
      prisma.product.update.mockResolvedValue({
        ...baseProduct,
        isActive: false,
        name: 'Inactive edit',
      });

      const response = await request(app.getHttpServer())
        .patch(`/api/v1/products/${productId}`)
        .send({ name: 'Inactive edit' })
        .expect(200);

      const inactivePatchBody = response.body as ProductJson;
      expect(inactivePatchBody.isActive).toBe(false);
      expect(inactivePatchBody.name).toBe('Inactive edit');
    });

    it('reactivates an inactive product via isActive true', async () => {
      prisma.product.findUnique.mockResolvedValue({
        ...baseProduct,
        isActive: false,
      });
      prisma.product.update.mockResolvedValue({
        ...baseProduct,
        isActive: true,
      });

      const response = await request(app.getHttpServer())
        .patch(`/api/v1/products/${productId}`)
        .send({ isActive: true })
        .expect(200);

      const body = response.body as ProductJson;
      expect(body.isActive).toBe(true);
      expect(prisma.product.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { isActive: true },
        }),
      );
    });

    it('updates only non-unit fields when product references inactive unit', async () => {
      const inactiveUnitId = '55555555-5555-4555-8555-555555555555';
      prisma.product.findUnique.mockResolvedValue({
        ...baseProduct,
        unitId: inactiveUnitId,
        unit: { ...unitSummary, id: inactiveUnitId, isActive: false },
      });
      prisma.product.update.mockResolvedValue({
        ...baseProduct,
        unitId: inactiveUnitId,
        name: 'Still linked',
        unit: { ...unitSummary, id: inactiveUnitId, isActive: false },
      });

      await request(app.getHttpServer())
        .patch(`/api/v1/products/${productId}`)
        .send({ name: 'Still linked' })
        .expect(200);

      expect(prisma.unit.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('DELETE /api/v1/products/:id', () => {
    it('soft-deactivates active product and is idempotent', async () => {
      prisma.product.findUnique.mockResolvedValue(baseProduct);
      prisma.product.update.mockResolvedValue({
        ...baseProduct,
        isActive: false,
      });

      const first = await request(app.getHttpServer())
        .delete(`/api/v1/products/${productId}`)
        .expect(200);

      const firstBody = first.body as ProductJson;

      expect(firstBody).toEqual({
        ...expectedProductBody,
        isActive: false,
      });
      expect(firstBody.unit).toEqual(unitSummary);
      expect(firstBody.category).toEqual(categorySummary);
      expect(prisma.product.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { isActive: false },
        }),
      );
      expect(prisma.product.delete).not.toHaveBeenCalled();
      expect(numberSequences.nextCode).not.toHaveBeenCalled();

      prisma.product.findUnique.mockResolvedValue({
        ...baseProduct,
        isActive: false,
      });
      prisma.product.update.mockClear();

      const second = await request(app.getHttpServer())
        .delete(`/api/v1/products/${productId}`)
        .expect(200);

      expect((second.body as ProductJson).isActive).toBe(false);
      expect(prisma.product.update).not.toHaveBeenCalled();
    });

    it('rejects invalid UUID and missing product', async () => {
      await request(app.getHttpServer())
        .delete('/api/v1/products/not-a-uuid')
        .expect(400);

      prisma.product.findUnique.mockResolvedValue(null);

      const response = await request(app.getHttpServer())
        .delete(`/api/v1/products/${productId}`)
        .expect(404);

      assertErrorShape(response.body, 404, `/api/v1/products/${productId}`);
    });
  });
});
