import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Decimal } from '@prisma/client/runtime/client';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/bootstrap/configure-app';
import { NumberSequencesService } from '../src/number-sequences/number-sequences.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { attachAuthUserMock, withAuth } from './auth-e2e.helper';

describe('BusinessPartners (e2e)', () => {
  const partnerId = '11111111-1111-4111-8111-111111111111';
  const createdAt = new Date('2026-07-28T00:00:00.000Z');
  const updatedAt = new Date('2026-07-28T00:00:00.000Z');

  const basePartner = {
    id: partnerId,
    code: '0000001',
    name: 'Nümunə MMC',
    isCustomer: true,
    isSupplier: false,
    phone: '+994 50 123 45 67',
    email: 'info@example.com',
    taxNumber: '1234567891',
    address: 'Bakı',
    notes: 'Note',
    currentDebtBalance: new Decimal('0'),
    isActive: true,
    createdAt,
    updatedAt,
  };

  const expectedPartnerBody = {
    id: partnerId,
    code: '0000001',
    name: 'Nümunə MMC',
    isCustomer: true,
    isSupplier: false,
    phone: '+994 50 123 45 67',
    email: 'info@example.com',
    taxNumber: '1234567891',
    address: 'Bakı',
    notes: 'Note',
    currentDebtBalance: '0.0000',
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
    businessPartner: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  let app: INestApplication<App>;

  type PartnerJson = {
    id: string;
    code: string;
    name: string;
    isCustomer: boolean;
    isSupplier: boolean;
    phone: string | null;
    email: string | null;
    taxNumber: string | null;
    address: string | null;
    notes: string | null;
    currentDebtBalance: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  };

  type PaginatedPartnersJson = {
    data: PartnerJson[];
    meta: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    };
  };

  const validCreatePayload = {
    name: ' Yeni tərəfdaş ',
    isCustomer: true,
    isSupplier: false,
  };

  function assertNoInternalLeak(body: unknown): void {
    const text = JSON.stringify(body);
    expect(text).not.toMatch(/prisma|P2002|DATABASE_URL|\.ts:|stack/i);
  }

  beforeEach(async () => {
    jest.clearAllMocks();
    attachAuthUserMock(prisma);
    numberSequences.nextCode.mockResolvedValue('0000001');
    prisma.businessPartner.findMany.mockResolvedValue([]);

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

  describe('POST /api/v1/business-partners', () => {
    it('creates a partner with backend-generated code and trimmed name', async () => {
      prisma.businessPartner.create.mockResolvedValue({
        ...basePartner,
        name: 'Yeni tərəfdaş',
      });

      const response = await withAuth(request(app.getHttpServer()))
        .post('/api/v1/business-partners')
        .send(validCreatePayload)
        .expect(201);

      const body = response.body as PartnerJson;
      expect(body.code).toBe('0000001');
      expect(body.name).toBe('Yeni tərəfdaş');
      expect(body.currentDebtBalance).toBe('0.0000');
      expect(body).not.toHaveProperty('defaultCurrencyId');
      expect(numberSequences.nextCode).toHaveBeenCalled();
      expect(prisma.businessPartner.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            code: '0000001',
            name: 'Yeni tərəfdaş',
            currentDebtBalance: expect.any(Decimal) as Decimal,
          }) as object,
        }),
      );
      assertNoInternalLeak(response.body);
    });

    it('creates customer-only, supplier-only, and both-role partners', async () => {
      prisma.businessPartner.create.mockResolvedValueOnce({
        ...basePartner,
        isCustomer: true,
        isSupplier: false,
      });
      await withAuth(request(app.getHttpServer()))
        .post('/api/v1/business-partners')
        .send({
          name: 'Müştəri',
          isCustomer: true,
          isSupplier: false,
        })
        .expect(201);

      prisma.businessPartner.create.mockResolvedValueOnce({
        ...basePartner,
        isCustomer: false,
        isSupplier: true,
      });
      await withAuth(request(app.getHttpServer()))
        .post('/api/v1/business-partners')
        .send({
          name: 'Təchizatçı',
          isCustomer: false,
          isSupplier: true,
        })
        .expect(201);

      prisma.businessPartner.create.mockResolvedValueOnce({
        ...basePartner,
        isCustomer: true,
        isSupplier: true,
      });
      const both = await withAuth(request(app.getHttpServer()))
        .post('/api/v1/business-partners')
        .send({
          name: 'Hər ikisi',
          isCustomer: true,
          isSupplier: true,
        })
        .expect(201);

      expect((both.body as PartnerJson).isCustomer).toBe(true);
      expect((both.body as PartnerJson).isSupplier).toBe(true);
    });

    it('rejects client-supplied code with 400', async () => {
      await withAuth(request(app.getHttpServer()))
        .post('/api/v1/business-partners')
        .send({ ...validCreatePayload, code: 'BP-999' })
        .expect(400);

      expect(prisma.businessPartner.create).not.toHaveBeenCalled();
    });

    it('rejects both roles false with 400', async () => {
      const response = await withAuth(request(app.getHttpServer()))
        .post('/api/v1/business-partners')
        .send({
          ...validCreatePayload,
          isCustomer: false,
          isSupplier: false,
        })
        .expect(400);

      expect(response.body).toEqual(
        expect.objectContaining({
          message: 'Business partner must have at least one role',
        }),
      );
    });

    it('assigns increasing backend codes on consecutive creates', async () => {
      numberSequences.nextCode
        .mockResolvedValueOnce('0000001')
        .mockResolvedValueOnce('0000002');
      prisma.businessPartner.create
        .mockResolvedValueOnce({
          ...basePartner,
          id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
          code: '0000001',
          name: 'Birinci',
        })
        .mockResolvedValueOnce({
          ...basePartner,
          id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
          code: '0000002',
          name: 'İkinci',
        });

      const first = await withAuth(request(app.getHttpServer()))
        .post('/api/v1/business-partners')
        .send({ ...validCreatePayload, name: 'Birinci' })
        .expect(201);
      const second = await withAuth(request(app.getHttpServer()))
        .post('/api/v1/business-partners')
        .send({ ...validCreatePayload, name: 'İkinci' })
        .expect(201);

      expect((first.body as PartnerJson).code).toBe('0000001');
      expect((second.body as PartnerJson).code).toBe('0000002');
    });
  });

  describe('GET /api/v1/business-partners', () => {
    it('returns paginated partners including code with default sort by code', async () => {
      prisma.businessPartner.findMany.mockResolvedValue([basePartner]);
      prisma.businessPartner.count.mockResolvedValue(1);

      const response = await withAuth(request(app.getHttpServer()))
        .get('/api/v1/business-partners')
        .expect(200);

      const body = response.body as PaginatedPartnersJson;
      expect(body.data[0].code).toBe('0000001');
      expect(body.data[0].currentDebtBalance).toBe('0.0000');
      expect(prisma.businessPartner.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: [{ code: 'asc' }, { id: 'asc' }],
        }),
      );
    });

    it('applies search across code and name', async () => {
      prisma.businessPartner.findMany.mockResolvedValue([]);
      prisma.businessPartner.count.mockResolvedValue(0);

      await withAuth(request(app.getHttpServer()))
        .get('/api/v1/business-partners')
        .query({ search: '0000001' })
        .expect(200);

      expect(prisma.businessPartner.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: expect.arrayContaining([
              { code: { contains: '0000001', mode: 'insensitive' } },
            ]) as unknown,
          },
        }),
      );
    });
  });

  describe('GET /api/v1/business-partners/:id', () => {
    it('returns partner with generated code in response', async () => {
      prisma.businessPartner.findUnique.mockResolvedValue(basePartner);

      const response = await withAuth(request(app.getHttpServer()))
        .get(`/api/v1/business-partners/${partnerId}`)
        .expect(200);

      expect(response.body as PartnerJson).toEqual(expectedPartnerBody);
    });

    it('returns inactive partner after soft deactivation', async () => {
      prisma.businessPartner.findUnique.mockResolvedValue({
        ...basePartner,
        isActive: false,
      });

      const response = await withAuth(request(app.getHttpServer()))
        .get(`/api/v1/business-partners/${partnerId}`)
        .expect(200);

      expect(response.body as PartnerJson).toEqual({
        ...expectedPartnerBody,
        isActive: false,
      });
    });
  });

  describe('PATCH /api/v1/business-partners/:id', () => {
    beforeEach(() => {
      prisma.businessPartner.findUnique.mockResolvedValue(basePartner);
    });

    it('applies partial update and preserves immutable code', async () => {
      prisma.businessPartner.update.mockResolvedValue({
        ...basePartner,
        name: 'Yenilənmiş',
        phone: null,
        isSupplier: true,
      });

      const response = await withAuth(request(app.getHttpServer()))
        .patch(`/api/v1/business-partners/${partnerId}`)
        .send({
          name: ' Yenilənmiş ',
          phone: null,
          isSupplier: true,
        })
        .expect(200);

      const body = response.body as PartnerJson;
      expect(body).toEqual(
        expect.objectContaining({
          code: '0000001',
          name: 'Yenilənmiş',
          phone: null,
          isCustomer: true,
          isSupplier: true,
          currentDebtBalance: '0.0000',
        }),
      );
      expect(prisma.businessPartner.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.not.objectContaining({ code: expect.anything() }),
        }),
      );
      assertNoInternalLeak(response.body);
    });

    it('rejects empty body and client-supplied code with 400', async () => {
      const empty = await withAuth(request(app.getHttpServer()))
        .patch(`/api/v1/business-partners/${partnerId}`)
        .send({})
        .expect(400);

      expect(empty.body).toEqual(
        expect.objectContaining({
          message: 'At least one field must be provided',
        }),
      );

      await withAuth(request(app.getHttpServer()))
        .patch(`/api/v1/business-partners/${partnerId}`)
        .send({ code: 'BP-999' })
        .expect(400);

      expect(prisma.businessPartner.update).not.toHaveBeenCalled();
    });

    it('maps missing partner to 404', async () => {
      prisma.businessPartner.findUnique.mockResolvedValue(null);

      const response = await withAuth(request(app.getHttpServer()))
        .patch(`/api/v1/business-partners/${partnerId}`)
        .send({ name: 'X' })
        .expect(404);

      expect(response.body).toEqual(
        expect.objectContaining({
          message: 'Business partner not found',
        }),
      );
      expect(prisma.businessPartner.update).not.toHaveBeenCalled();
    });

    it('reactivates an inactive partner via isActive true', async () => {
      prisma.businessPartner.findUnique.mockResolvedValue({
        ...basePartner,
        isActive: false,
      });
      prisma.businessPartner.update.mockResolvedValue({
        ...basePartner,
        isActive: true,
      });

      const response = await withAuth(request(app.getHttpServer()))
        .patch(`/api/v1/business-partners/${partnerId}`)
        .send({ isActive: true })
        .expect(200);

      const body = response.body as PartnerJson;
      expect(body.isActive).toBe(true);
      expect(prisma.businessPartner.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { isActive: true },
        }),
      );
    });
  });

  describe('DELETE /api/v1/business-partners/:id', () => {
    it('soft-deactivates active partner and is idempotent', async () => {
      prisma.businessPartner.findUnique.mockResolvedValue(basePartner);
      prisma.businessPartner.update.mockResolvedValue({
        ...basePartner,
        isActive: false,
      });

      const first = await withAuth(request(app.getHttpServer()))
        .delete(`/api/v1/business-partners/${partnerId}`)
        .expect(200);

      const firstBody = first.body as PartnerJson;
      expect(firstBody).toEqual({
        ...expectedPartnerBody,
        isActive: false,
      });
      expect(prisma.businessPartner.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { isActive: false },
        }),
      );
      expect(prisma.businessPartner.delete).not.toHaveBeenCalled();

      prisma.businessPartner.findUnique.mockResolvedValue({
        ...basePartner,
        isActive: false,
      });
      prisma.businessPartner.update.mockClear();

      const second = await withAuth(request(app.getHttpServer()))
        .delete(`/api/v1/business-partners/${partnerId}`)
        .expect(200);

      expect((second.body as PartnerJson).isActive).toBe(false);
      expect((second.body as PartnerJson).code).toBe('0000001');
      expect(prisma.businessPartner.update).not.toHaveBeenCalled();
    });
  });

  describe('soft duplicate flag (US-016)', () => {
    const otherPartnerId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    const otherPartner = {
      id: otherPartnerId,
      code: '0000002',
      name: 'Nümunə MMC',
      phone: '+994 50 123 45 67',
      taxNumber: '1234567891',
      isCustomer: true,
      isSupplier: false,
      isActive: true,
    };

    it('returns 409 on create when possible duplicates match', async () => {
      prisma.businessPartner.findMany.mockResolvedValue([otherPartner]);

      const response = await withAuth(request(app.getHttpServer()))
        .post('/api/v1/business-partners')
        .send({
          name: '  NÜMUNƏ   MMC  ',
          isCustomer: true,
          isSupplier: false,
        })
        .expect(409);

      expect(response.body).toEqual(
        expect.objectContaining({
          statusCode: 409,
          message: 'Possible duplicate business partners found',
          code: 'BUSINESS_PARTNER_DUPLICATE_SUSPECTED',
          candidates: [
            expect.objectContaining({
              id: otherPartnerId,
              code: '0000002',
              matchedFields: ['name'],
            }),
          ],
        }),
      );
      expect(prisma.businessPartner.create).not.toHaveBeenCalled();
      assertNoInternalLeak(response.body);
    });

    it('creates when acknowledgeDuplicate is true despite matches', async () => {
      prisma.businessPartner.findMany.mockResolvedValue([otherPartner]);
      prisma.businessPartner.create.mockResolvedValue({
        ...basePartner,
        name: 'Nümunə MMC',
      });

      const response = await withAuth(request(app.getHttpServer()))
        .post('/api/v1/business-partners')
        .send({
          name: 'Nümunə MMC',
          isCustomer: true,
          isSupplier: false,
          acknowledgeDuplicate: true,
        })
        .expect(201);

      expect((response.body as PartnerJson).code).toBe('0000001');
      expect(prisma.businessPartner.create).toHaveBeenCalled();
    });

    it('returns 409 on PATCH identity change when duplicates match', async () => {
      prisma.businessPartner.findUnique.mockResolvedValue({
        ...basePartner,
        name: 'Başqa ad',
      });
      prisma.businessPartner.findMany.mockResolvedValue([otherPartner]);

      const response = await withAuth(request(app.getHttpServer()))
        .patch(`/api/v1/business-partners/${partnerId}`)
        .send({ name: 'Nümunə MMC' })
        .expect(409);

      expect(response.body).toEqual(
        expect.objectContaining({
          statusCode: 409,
          code: 'BUSINESS_PARTNER_DUPLICATE_SUSPECTED',
        }),
      );
      expect(prisma.businessPartner.update).not.toHaveBeenCalled();
    });

    it('updates when acknowledgeDuplicate is true despite matches', async () => {
      prisma.businessPartner.findUnique.mockResolvedValue({
        ...basePartner,
        name: 'Başqa ad',
      });
      prisma.businessPartner.findMany.mockResolvedValue([otherPartner]);
      prisma.businessPartner.update.mockResolvedValue({
        ...basePartner,
        name: 'Nümunə MMC',
      });

      const response = await withAuth(request(app.getHttpServer()))
        .patch(`/api/v1/business-partners/${partnerId}`)
        .send({
          name: 'Nümunə MMC',
          acknowledgeDuplicate: true,
        })
        .expect(200);

      expect((response.body as PartnerJson).name).toBe('Nümunə MMC');
      expect(prisma.businessPartner.update).toHaveBeenCalled();
    });

    it('does not expose a standalone duplicate-check route', async () => {
      await withAuth(request(app.getHttpServer()))
        .post('/api/v1/business-partners/duplicate-check')
        .send({ name: 'Nümunə MMC' })
        .expect(404);
    });
  });
});
