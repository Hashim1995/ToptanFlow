import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { SortOrder } from '../common/sorting/sort-order.enum';
import { BusinessCodeSequenceKey } from '../number-sequences/business-code-sequence-key';
import { NumberSequencesService } from '../number-sequences/number-sequences.service';
import { BusinessPartnersService } from './business-partners.service';

describe('BusinessPartnersService', () => {
  const partnerId = '11111111-1111-4111-8111-111111111111';
  const currencyId = '22222222-2222-4222-8222-222222222222';

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
    createdAt: new Date('2026-07-28T00:00:00.000Z'),
    updatedAt: new Date('2026-07-28T00:00:00.000Z'),
    defaultCurrency: currencySummary,
  };

  const numberSequences = {
    nextCode: jest.fn(),
  };

  const prisma = {
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

  let service: BusinessPartnersService;

  beforeEach(() => {
    jest.clearAllMocks();
    numberSequences.nextCode.mockResolvedValue('0000001');
    service = new BusinessPartnersService(
      prisma,
      numberSequences as unknown as NumberSequencesService,
    );
  });

  describe('create', () => {
    it('allocates backend code inside transaction for customer-only partner', async () => {
      prisma.currency.findUnique.mockResolvedValue({
        id: currencyId,
        isActive: true,
      });
      prisma.businessPartner.create.mockResolvedValue(basePartner);

      const result = await service.create({
        name: 'Nümunə MMC',
        isCustomer: true,
        isSupplier: false,
        defaultCurrencyId: currencyId,
      });

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(numberSequences.nextCode).toHaveBeenCalledWith(
        prisma,
        BusinessCodeSequenceKey.BUSINESS_PARTNER,
      );
      expect(prisma.businessPartner.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            code: '0000001',
            name: 'Nümunə MMC',
            isActive: true,
          }) as object,
        }),
      );
      expect(result.isCustomer).toBe(true);
      expect(result.isSupplier).toBe(false);
      expect(result.defaultCurrency).toEqual(currencySummary);
      expect(result).not.toHaveProperty('sales');
      expect(result).not.toHaveProperty('purchases');
      expect(result).not.toHaveProperty('cashTransactions');
      expect(result).not.toHaveProperty('balance');
    });

    it('creates a supplier-only partner', async () => {
      prisma.currency.findUnique.mockResolvedValue({
        id: currencyId,
        isActive: true,
      });
      prisma.businessPartner.create.mockResolvedValue({
        ...basePartner,
        isCustomer: false,
        isSupplier: true,
      });

      const result = await service.create({
        name: 'Təchizatçı',
        isCustomer: false,
        isSupplier: true,
        defaultCurrencyId: currencyId,
      });

      expect(result.isCustomer).toBe(false);
      expect(result.isSupplier).toBe(true);
    });

    it('creates a both-role partner', async () => {
      prisma.currency.findUnique.mockResolvedValue({
        id: currencyId,
        isActive: true,
      });
      prisma.businessPartner.create.mockResolvedValue({
        ...basePartner,
        isCustomer: true,
        isSupplier: true,
      });

      const result = await service.create({
        name: 'Hər iki rol',
        isCustomer: true,
        isSupplier: true,
        defaultCurrencyId: currencyId,
      });

      expect(result.isCustomer).toBe(true);
      expect(result.isSupplier).toBe(true);
    });

    it('rejects both roles false', async () => {
      await expect(
        service.create({
          name: 'Invalid',
          isCustomer: false,
          isSupplier: false,
          defaultCurrencyId: currencyId,
        }),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.businessPartner.create).not.toHaveBeenCalled();
    });

    it('trims name on create', async () => {
      prisma.currency.findUnique.mockResolvedValue({
        id: currencyId,
        isActive: true,
      });
      prisma.businessPartner.create.mockResolvedValue(basePartner);

      await service.create({
        name: ' Nümunə MMC ',
        isCustomer: true,
        isSupplier: false,
        defaultCurrencyId: currencyId,
      });

      expect(prisma.businessPartner.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: 'Nümunə MMC',
          }) as object,
        }),
      );
    });

    it('rejects blank name', async () => {
      await expect(
        service.create({
          name: '   ',
          isCustomer: true,
          isSupplier: false,
          defaultCurrencyId: currencyId,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('converts blank optional contact fields to null', async () => {
      prisma.currency.findUnique.mockResolvedValue({
        id: currencyId,
        isActive: true,
      });
      prisma.businessPartner.create.mockResolvedValue({
        ...basePartner,
        phone: null,
        email: null,
        taxNumber: null,
        address: null,
        notes: null,
      });

      await service.create({
        name: 'Test',
        isCustomer: true,
        isSupplier: false,
        defaultCurrencyId: currencyId,
        phone: '   ',
        email: '   ',
        taxNumber: '   ',
        address: '   ',
        notes: '   ',
      });

      expect(prisma.businessPartner.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            phone: null,
            email: null,
            taxNumber: null,
            address: null,
            notes: null,
          }) as object,
        }),
      );
    });

    it('preserves a valid email after trim', async () => {
      prisma.currency.findUnique.mockResolvedValue({
        id: currencyId,
        isActive: true,
      });
      prisma.businessPartner.create.mockResolvedValue(basePartner);

      await service.create({
        name: 'Test',
        isCustomer: true,
        isSupplier: false,
        defaultCurrencyId: currencyId,
        email: ' info@example.com ',
      });

      expect(prisma.businessPartner.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: 'info@example.com',
          }) as object,
        }),
      );
    });

    it('throws NotFoundException when currency does not exist', async () => {
      prisma.currency.findUnique.mockResolvedValue(null);

      await expect(
        service.create({
          name: 'Test',
          isCustomer: true,
          isSupplier: false,
          defaultCurrencyId: currencyId,
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.businessPartner.create).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when currency is inactive', async () => {
      prisma.currency.findUnique.mockResolvedValue({
        id: currencyId,
        isActive: false,
      });

      await expect(
        service.create({
          name: 'Test',
          isCustomer: true,
          isSupplier: false,
          defaultCurrencyId: currencyId,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.businessPartner.create).not.toHaveBeenCalled();
    });

    it('maps Prisma P2002 to ConflictException', async () => {
      prisma.currency.findUnique.mockResolvedValue({
        id: currencyId,
        isActive: true,
      });
      prisma.businessPartner.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('Unique constraint', {
          code: 'P2002',
          clientVersion: '7.9.1',
        }),
      );

      await expect(
        service.create({
          name: 'Duplicate',
          isCustomer: true,
          isSupplier: false,
          defaultCurrencyId: currencyId,
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('excludes server-managed fields from create data', async () => {
      prisma.currency.findUnique.mockResolvedValue({
        id: currencyId,
        isActive: true,
      });
      prisma.businessPartner.create.mockResolvedValue(basePartner);

      await service.create({
        name: 'Test',
        isCustomer: true,
        isSupplier: false,
        defaultCurrencyId: currencyId,
      });

      const createCalls = prisma.businessPartner.create.mock.calls as Array<
        [{ data: Record<string, unknown> }]
      >;
      const data = createCalls[0][0].data;
      expect(data).not.toHaveProperty('id');
      expect(data).not.toHaveProperty('createdAt');
      expect(data).not.toHaveProperty('updatedAt');
      expect(data).not.toHaveProperty('sales');
      expect(data.isActive).toBe(true);
      expect(data.code).toBe('0000001');
    });
  });

  describe('list', () => {
    it('returns default pagination and sorting', async () => {
      prisma.businessPartner.findMany.mockResolvedValue([basePartner]);
      prisma.businessPartner.count.mockResolvedValue(1);

      const result = await service.list({});

      expect(result.meta).toEqual({
        page: 1,
        pageSize: 20,
        total: 1,
        totalPages: 1,
      });
      expect(prisma.businessPartner.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 20,
          orderBy: [{ code: SortOrder.ASC }, { id: 'asc' }],
        }),
      );
    });

    it('builds search where clause across intended fields', async () => {
      prisma.businessPartner.findMany.mockResolvedValue([]);
      prisma.businessPartner.count.mockResolvedValue(0);

      await service.list({ search: 'bp' });

      expect(prisma.businessPartner.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { code: { contains: 'bp', mode: 'insensitive' } },
              { name: { contains: 'bp', mode: 'insensitive' } },
              { phone: { contains: 'bp', mode: 'insensitive' } },
              { email: { contains: 'bp', mode: 'insensitive' } },
              { taxNumber: { contains: 'bp', mode: 'insensitive' } },
            ],
          },
        }),
      );
    });

    it('omits whitespace-only search', async () => {
      prisma.businessPartner.findMany.mockResolvedValue([]);
      prisma.businessPartner.count.mockResolvedValue(0);

      await service.list({ search: '   ' });

      expect(prisma.businessPartner.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: undefined,
        }),
      );
    });

    it('applies isActive, role, and currency filters with AND', async () => {
      prisma.businessPartner.findMany.mockResolvedValue([]);
      prisma.businessPartner.count.mockResolvedValue(0);

      await service.list({
        isActive: true,
        isCustomer: true,
        isSupplier: true,
        defaultCurrencyId: currencyId,
      });

      expect(prisma.businessPartner.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            AND: [
              { isActive: true },
              { isCustomer: true },
              { isSupplier: true },
              { defaultCurrencyId: currencyId },
            ],
          },
        }),
      );
    });

    it('does not load sales, purchases, or cashTransactions', async () => {
      prisma.businessPartner.findMany.mockResolvedValue([]);
      prisma.businessPartner.count.mockResolvedValue(0);

      await service.list({});

      const findManyCalls = prisma.businessPartner.findMany.mock.calls as Array<
        [{ select: Record<string, unknown> }]
      >;
      const select = findManyCalls[0][0].select;
      expect(select).not.toHaveProperty('sales');
      expect(select).not.toHaveProperty('purchases');
      expect(select).not.toHaveProperty('cashTransactions');
    });
  });

  describe('findOne', () => {
    it('returns an active partner with nested currency', async () => {
      prisma.businessPartner.findUnique.mockResolvedValue(basePartner);

      const result = await service.findOne(partnerId);

      expect(result.id).toBe(partnerId);
      expect(result.defaultCurrency).toEqual(currencySummary);
    });

    it('returns an inactive partner', async () => {
      prisma.businessPartner.findUnique.mockResolvedValue({
        ...basePartner,
        isActive: false,
      });

      const result = await service.findOne(partnerId);

      expect(result.isActive).toBe(false);
    });

    it('throws NotFoundException when partner is missing', async () => {
      prisma.businessPartner.findUnique.mockResolvedValue(null);

      await expect(service.findOne(partnerId)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
