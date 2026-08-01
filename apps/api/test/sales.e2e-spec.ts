import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Decimal } from '@prisma/client/runtime/client';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/bootstrap/configure-app';
import { PartnerDebtBalanceService } from '../src/business-partners/partner-debt-balance.service';
import { NumberSequencesService } from '../src/number-sequences/number-sequences.service';
import { ProductQuantityService } from '../src/products/product-quantity.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { attachAuthUserMock, withAuth } from './auth-e2e.helper';

describe('Sales (e2e)', () => {
  const saleId = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
  const partnerId = '11111111-1111-4111-8111-111111111111';
  const productId = '22222222-2222-4222-8222-222222222222';
  const createdAt = new Date('2026-07-31T00:00:00.000Z');

  const partner = {
    id: partnerId,
    code: '0000001',
    name: 'Müştəri',
    currentDebtBalance: new Decimal('400'),
    isCustomer: true,
    isActive: true,
  };

  const createdBy = {
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    username: 'e2e-user',
    fullName: 'E2E User',
  };

  const draftDetail = {
    id: saleId,
    documentNumber: 'SAL-0000001',
    partnerId,
    partner,
    businessDate: createdAt,
    status: 'DRAFT',
    subtotalAmount: new Decimal('1000'),
    discountAmount: new Decimal(0),
    totalAmount: new Decimal('1000'),
    notes: null,
    negativeQuantityOverrideReason: null,
    postedAt: null,
    postedByUserId: null,
    postedBy: null,
    cancelledAt: null,
    cancelledByUserId: null,
    cancelledBy: null,
    cancelReason: null,
    createdAt,
    updatedAt: createdAt,
    createdByUserId: createdBy.id,
    createdBy,
    items: [
      {
        id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
        productId,
        unitId: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
        productCodeSnapshot: '0000001',
        productNameSnapshot: 'Parça',
        unitNameSnapshot: 'ədəd',
        quantity: new Decimal('10'),
        unitPrice: new Decimal('100'),
        discountAmount: new Decimal(0),
        lineSubtotal: new Decimal('1000'),
        lineTotal: new Decimal('1000'),
        notes: null,
        costAtPosting: null,
        createdAt,
      },
    ],
    productQuantityHistory: [],
    partnerDebtMovements: [],
  };

  const numberSequences = { nextCode: jest.fn().mockResolvedValue('0000001') };
  const productQuantity = { applyChange: jest.fn().mockResolvedValue({}) };
  const partnerDebt = { applyChange: jest.fn().mockResolvedValue({}) };

  const prisma: Record<string, any> = {
    onModuleInit: jest.fn().mockResolvedValue(undefined),
    onModuleDestroy: jest.fn().mockResolvedValue(undefined),
    $transaction: jest.fn((fn: (tx: unknown) => unknown) =>
      Promise.resolve(fn(prisma)),
    ),
    sale: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
    },
    businessPartner: { findUnique: jest.fn() },
    product: { findMany: jest.fn(), findUnique: jest.fn() },
    saleItem: { update: jest.fn() },
    businessPartnerDebtMovement: { findFirst: jest.fn() },
  };

  let app: INestApplication<App>;

  beforeEach(async () => {
    jest.clearAllMocks();
    attachAuthUserMock(prisma);
    numberSequences.nextCode.mockResolvedValue('0000001');
    prisma.businessPartner.findUnique.mockResolvedValue({
      isActive: true,
      isCustomer: true,
    });
    prisma.product.findMany.mockResolvedValue([
      {
        id: productId,
        code: '0000001',
        name: 'Parça',
        isActive: true,
        unit: { id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', name: 'ədəd' },
      },
    ]);
    prisma.product.findUnique.mockResolvedValue({
      currentQuantity: new Decimal('100'),
      code: '0000001',
    });
    prisma.sale.create.mockResolvedValue({ id: saleId });
    prisma.sale.findUnique.mockResolvedValue(draftDetail);
    prisma.sale.findMany.mockResolvedValue([
      { ...draftDetail, _count: { items: 1 } },
    ]);
    prisma.sale.count.mockResolvedValue(1);
    prisma.sale.updateMany.mockResolvedValue({ count: 1 });
    prisma.sale.update.mockResolvedValue({});
    prisma.saleItem.update.mockResolvedValue({});
    prisma.businessPartnerDebtMovement.findFirst.mockResolvedValue({
      id: 'dm-1',
    });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .overrideProvider(NumberSequencesService)
      .useValue(numberSequences)
      .overrideProvider(ProductQuantityService)
      .useValue(productQuantity)
      .overrideProvider(PartnerDebtBalanceService)
      .useValue(partnerDebt)
      .compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('rejects unauthenticated access', async () => {
    await request(app.getHttpServer()).get('/api/v1/sales').expect(401);
  });

  it('lists sales with pagination', async () => {
    const response = await withAuth(request(app.getHttpServer()))
      .get('/api/v1/sales')
      .query({ documentNumber: 'SAL', status: 'DRAFT', partnerId })
      .expect(200);

    expect(response.body.meta.total).toBe(1);
    expect(response.body.data[0].documentNumber).toBe('SAL-0000001');
    expect(response.body.data[0].itemCount).toBe(1);
    expect(response.body.data[0].partner.isCustomer).toBe(true);
    expect(JSON.stringify(response.body)).not.toMatch(/warehouse|currency/i);
  });

  it('creates a draft sale', async () => {
    const response = await withAuth(request(app.getHttpServer()))
      .post('/api/v1/sales')
      .send({
        partnerId,
        businessDate: '2026-07-31',
        items: [
          {
            productId,
            quantity: '10.0000',
            unitPrice: '100.0000',
          },
        ],
      })
      .expect(201);

    expect(response.body.documentNumber).toBe('SAL-0000001');
    expect(response.body.status).toBe('DRAFT');
    expect(productQuantity.applyChange).not.toHaveBeenCalled();
    expect(partnerDebt.applyChange).not.toHaveBeenCalled();
  });

  it('rejects client-supplied documentNumber', async () => {
    await withAuth(request(app.getHttpServer()))
      .post('/api/v1/sales')
      .send({
        partnerId,
        businessDate: '2026-07-31',
        documentNumber: 'HACK',
        items: [{ productId, quantity: '1.0000', unitPrice: '1.0000' }],
      })
      .expect(400);
  });

  it('posts a draft and cancels with reason', async () => {
    await withAuth(request(app.getHttpServer()))
      .post(`/api/v1/sales/${saleId}/post`)
      .send({})
      .expect(200);

    expect(productQuantity.applyChange).toHaveBeenCalled();
    expect(partnerDebt.applyChange).toHaveBeenCalled();

    prisma.sale.findUnique.mockResolvedValue({
      ...draftDetail,
      status: 'POSTED',
    });

    await withAuth(request(app.getHttpServer()))
      .post(`/api/v1/sales/${saleId}/cancel`)
      .send({ reason: 'Səhv daxil edilib' })
      .expect(200);

    expect(productQuantity.applyChange).toHaveBeenCalledTimes(2);
  });

  it('rejects post without reason when insufficient stock', async () => {
    prisma.product.findUnique.mockResolvedValue({
      currentQuantity: new Decimal('5'),
      code: '0000001',
    });
    await withAuth(request(app.getHttpServer()))
      .post(`/api/v1/sales/${saleId}/post`)
      .send({})
      .expect(400);
    expect(productQuantity.applyChange).not.toHaveBeenCalled();
  });

  it('allows post with negativeQuantityReason when insufficient stock', async () => {
    prisma.product.findUnique.mockResolvedValue({
      currentQuantity: new Decimal('5'),
      code: '0000001',
    });
    await withAuth(request(app.getHttpServer()))
      .post(`/api/v1/sales/${saleId}/post`)
      .send({ negativeQuantityReason: 'Təcili satış' })
      .expect(200);
    expect(productQuantity.applyChange).toHaveBeenCalled();
  });

  it('rejects cancel without reason', async () => {
    await withAuth(request(app.getHttpServer()))
      .post(`/api/v1/sales/${saleId}/cancel`)
      .send({ reason: '' })
      .expect(400);
  });

  it('rejects patch of posted sale', async () => {
    prisma.sale.findUnique.mockResolvedValue({
      ...draftDetail,
      status: 'POSTED',
      items: draftDetail.items,
    });
    await withAuth(request(app.getHttpServer()))
      .patch(`/api/v1/sales/${saleId}`)
      .send({ notes: 'nope' })
      .expect(409);
  });
});
