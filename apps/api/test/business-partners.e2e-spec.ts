import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/bootstrap/configure-app';
import { NumberSequencesService } from '../src/number-sequences/number-sequences.service';
import { PrismaService } from '../src/prisma/prisma.service';

describe('BusinessPartners (e2e)', () => {
  const partnerId = '11111111-1111-4111-8111-111111111111';
  const currencyId = '22222222-2222-4222-8222-222222222222';
  const createdAt = new Date('2026-07-28T00:00:00.000Z');
  const updatedAt = new Date('2026-07-28T00:00:00.000Z');

  const currencySummary = {
    id: currencyId,
    code: 'USD',
    name: 'ABŞ dolları',
    symbol: '$',
    isActive: true,
  };

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
    defaultCurrencyId: currencyId,
    isActive: true,
    createdAt,
    updatedAt,
    defaultCurrency: currencySummary,
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
    defaultCurrencyId: currencyId,
    defaultCurrency: currencySummary,
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
    $transaction: jest.fn((fn: (tx: typeof prisma) => unknown) =>
      Promise.resolve(fn(prisma)),
    ),
    businessPartner: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
    },
    currency: {
      findUnique: jest.fn(),
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
    defaultCurrencyId: string;
    defaultCurrency: typeof currencySummary;
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
    defaultCurrencyId: currencyId,
  };

  function assertNoInternalLeak(body: unknown): void {
    const text = JSON.stringify(body);
    expect(text).not.toMatch(/prisma|P2002|DATABASE_URL|\.ts:|stack/i);
  }

  beforeEach(async () => {
    jest.clearAllMocks();
    numberSequences.nextCode.mockResolvedValue('0000001');

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
      prisma.currency.findUnique.mockResolvedValue({
        id: currencyId,
        isActive: true,
      });
      prisma.businessPartner.create.mockResolvedValue({
        ...basePartner,
        name: 'Yeni tərəfdaş',
      });

      const response = await request(app.getHttpServer())
        .post('/api/v1/business-partners')
        .send(validCreatePayload)
        .expect(201);

      const body = response.body as PartnerJson;
      expect(body.code).toBe('0000001');
      expect(body.name).toBe('Yeni tərəfdaş');
      expect(numberSequences.nextCode).toHaveBeenCalled();
      expect(prisma.businessPartner.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            code: '0000001',
            name: 'Yeni tərəfdaş',
          }) as object,
        }),
      );
      assertNoInternalLeak(response.body);
    });

    it('creates customer-only, supplier-only, and both-role partners', async () => {
      prisma.currency.findUnique.mockResolvedValue({
        id: currencyId,
        isActive: true,
      });

      prisma.businessPartner.create.mockResolvedValueOnce({
        ...basePartner,
        isCustomer: true,
        isSupplier: false,
      });
      await request(app.getHttpServer())
        .post('/api/v1/business-partners')
        .send({
          name: 'Müştəri',
          isCustomer: true,
          isSupplier: false,
          defaultCurrencyId: currencyId,
        })
        .expect(201);

      prisma.businessPartner.create.mockResolvedValueOnce({
        ...basePartner,
        isCustomer: false,
        isSupplier: true,
      });
      await request(app.getHttpServer())
        .post('/api/v1/business-partners')
        .send({
          name: 'Təchizatçı',
          isCustomer: false,
          isSupplier: true,
          defaultCurrencyId: currencyId,
        })
        .expect(201);

      prisma.businessPartner.create.mockResolvedValueOnce({
        ...basePartner,
        isCustomer: true,
        isSupplier: true,
      });
      const both = await request(app.getHttpServer())
        .post('/api/v1/business-partners')
        .send({
          name: 'Hər ikisi',
          isCustomer: true,
          isSupplier: true,
          defaultCurrencyId: currencyId,
        })
        .expect(201);

      expect((both.body as PartnerJson).isCustomer).toBe(true);
      expect((both.body as PartnerJson).isSupplier).toBe(true);
    });

    it('rejects client-supplied code with 400', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/business-partners')
        .send({ ...validCreatePayload, code: 'BP-999' })
        .expect(400);

      expect(prisma.businessPartner.create).not.toHaveBeenCalled();
    });

    it('rejects both roles false with 400', async () => {
      const response = await request(app.getHttpServer())
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

    it('maps missing currency to 404 and inactive currency to 400', async () => {
      prisma.currency.findUnique.mockResolvedValue(null);

      await request(app.getHttpServer())
        .post('/api/v1/business-partners')
        .send(validCreatePayload)
        .expect(404);

      prisma.currency.findUnique.mockResolvedValue({
        id: currencyId,
        isActive: false,
      });

      await request(app.getHttpServer())
        .post('/api/v1/business-partners')
        .send(validCreatePayload)
        .expect(400);
    });

    it('assigns increasing backend codes on consecutive creates', async () => {
      prisma.currency.findUnique.mockResolvedValue({
        id: currencyId,
        isActive: true,
      });
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

      const first = await request(app.getHttpServer())
        .post('/api/v1/business-partners')
        .send({ ...validCreatePayload, name: 'Birinci' })
        .expect(201);
      const second = await request(app.getHttpServer())
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

      const response = await request(app.getHttpServer())
        .get('/api/v1/business-partners')
        .expect(200);

      const body = response.body as PaginatedPartnersJson;
      expect(body.data[0].code).toBe('0000001');
      expect(prisma.businessPartner.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: [{ code: 'asc' }, { id: 'asc' }],
        }),
      );
    });

    it('applies search across code and name', async () => {
      prisma.businessPartner.findMany.mockResolvedValue([]);
      prisma.businessPartner.count.mockResolvedValue(0);

      await request(app.getHttpServer())
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

      const response = await request(app.getHttpServer())
        .get(`/api/v1/business-partners/${partnerId}`)
        .expect(200);

      expect(response.body as PartnerJson).toEqual(expectedPartnerBody);
    });
  });
});
