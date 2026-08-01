import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/client';
import { SortOrder } from '../common/sorting/sort-order.enum';
import { BusinessCodeSequenceKey } from '../number-sequences/business-code-sequence-key';
import { NumberSequencesService } from '../number-sequences/number-sequences.service';
import { BusinessPartnersService } from './business-partners.service';

describe('BusinessPartnersService', () => {
  const partnerId = '11111111-1111-4111-8111-111111111111';

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
    createdAt: new Date('2026-07-28T00:00:00.000Z'),
    updatedAt: new Date('2026-07-28T00:00:00.000Z'),
  };

  const numberSequences = {
    nextCode: jest.fn(),
  };

  const prisma = {
    $transaction: jest.fn((fn: (tx: unknown) => unknown) =>
      Promise.resolve(fn(prisma)),
    ),
    businessPartner: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  let service: BusinessPartnersService;

  beforeEach(() => {
    jest.clearAllMocks();
    numberSequences.nextCode.mockResolvedValue('0000001');
    prisma.businessPartner.findMany.mockResolvedValue([]);
    service = new BusinessPartnersService(
      prisma as never,
      numberSequences as unknown as NumberSequencesService,
    );
  });

  describe('create', () => {
    it('allocates backend code inside transaction for customer-only partner', async () => {
      prisma.businessPartner.create.mockResolvedValue(basePartner);

      const result = await service.create({
        name: 'Nümunə MMC',
        isCustomer: true,
        isSupplier: false,
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
            currentDebtBalance: expect.any(Decimal) as Decimal,
            isActive: true,
          }) as object,
        }),
      );
      expect(result.isCustomer).toBe(true);
      expect(result.isSupplier).toBe(false);
      expect(result.currentDebtBalance).toBe('0.0000');
      expect(result).not.toHaveProperty('defaultCurrencyId');
      expect(result).not.toHaveProperty('defaultCurrency');
      expect(result).not.toHaveProperty('sales');
      expect(result).not.toHaveProperty('purchases');
      expect(result).not.toHaveProperty('cashTransactions');
    });

    it('creates a supplier-only partner', async () => {
      prisma.businessPartner.create.mockResolvedValue({
        ...basePartner,
        isCustomer: false,
        isSupplier: true,
      });

      const result = await service.create({
        name: 'Təchizatçı',
        isCustomer: false,
        isSupplier: true,
      });

      expect(result.isCustomer).toBe(false);
      expect(result.isSupplier).toBe(true);
    });

    it('creates a both-role partner', async () => {
      prisma.businessPartner.create.mockResolvedValue({
        ...basePartner,
        isCustomer: true,
        isSupplier: true,
      });

      const result = await service.create({
        name: 'Hər iki rol',
        isCustomer: true,
        isSupplier: true,
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
        }),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.businessPartner.create).not.toHaveBeenCalled();
    });

    it('trims name on create', async () => {
      prisma.businessPartner.create.mockResolvedValue(basePartner);

      await service.create({
        name: ' Nümunə MMC ',
        isCustomer: true,
        isSupplier: false,
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
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('converts blank optional contact fields to null', async () => {
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
      prisma.businessPartner.create.mockResolvedValue(basePartner);

      await service.create({
        name: 'Test',
        isCustomer: true,
        isSupplier: false,
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

    it('maps Prisma P2002 to ConflictException', async () => {
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
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('excludes server-managed fields from create data', async () => {
      prisma.businessPartner.create.mockResolvedValue(basePartner);

      await service.create({
        name: 'Test',
        isCustomer: true,
        isSupplier: false,
      });

      const createCalls = prisma.businessPartner.create.mock.calls as Array<
        [{ data: Record<string, unknown> }]
      >;
      const data = createCalls[0][0].data;
      expect(data).not.toHaveProperty('id');
      expect(data).not.toHaveProperty('createdAt');
      expect(data).not.toHaveProperty('updatedAt');
      expect(data).not.toHaveProperty('sales');
      expect(data).not.toHaveProperty('defaultCurrencyId');
      expect(data.isActive).toBe(true);
      expect(data.code).toBe('0000001');
      expect(data.currentDebtBalance).toEqual(expect.any(Decimal));
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
      expect(result.data[0].currentDebtBalance).toBe('0.0000');
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

    it('applies isActive and role filters with AND', async () => {
      prisma.businessPartner.findMany.mockResolvedValue([]);
      prisma.businessPartner.count.mockResolvedValue(0);

      await service.list({
        isActive: true,
        isCustomer: true,
        isSupplier: true,
      });

      expect(prisma.businessPartner.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            AND: [
              { isActive: true },
              { isCustomer: true },
              { isSupplier: true },
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
      expect(select).not.toHaveProperty('defaultCurrency');
      expect(select).toHaveProperty('currentDebtBalance');
    });
  });

  describe('findOne', () => {
    it('returns an active partner with debt balance', async () => {
      prisma.businessPartner.findUnique.mockResolvedValue({
        ...basePartner,
        currentDebtBalance: new Decimal('1250.5000'),
      });

      const result = await service.findOne(partnerId);

      expect(result.id).toBe(partnerId);
      expect(result.currentDebtBalance).toBe('1250.5000');
      expect(result).not.toHaveProperty('defaultCurrency');
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

  describe('update', () => {
    beforeEach(() => {
      prisma.businessPartner.findUnique.mockResolvedValue(basePartner);
    });

    it('rejects an empty update body', async () => {
      await expect(service.update(partnerId, {})).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(prisma.businessPartner.update).not.toHaveBeenCalled();
    });

    it('never maps code into Prisma update data unless reactivation requested', async () => {
      prisma.businessPartner.update.mockResolvedValue({
        ...basePartner,
        name: 'Only name',
      });

      await service.update(partnerId, { name: 'Only name' });

      const updateCalls = prisma.businessPartner.update.mock.calls as Array<
        [{ data: Record<string, unknown> }]
      >;
      expect(updateCalls[0][0].data).not.toHaveProperty('code');
      expect(updateCalls[0][0].data).not.toHaveProperty('isActive');
      expect(updateCalls[0][0].data).not.toHaveProperty('currentDebtBalance');
      expect(updateCalls[0][0].data).toEqual({ name: 'Only name' });
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

      const result = await service.update(partnerId, { isActive: true });

      expect(prisma.businessPartner.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { isActive: true },
        }),
      );
      expect(result.isActive).toBe(true);
    });

    it('updates trimmed name and rejects blank name', async () => {
      prisma.businessPartner.update.mockResolvedValue({
        ...basePartner,
        name: 'Yeni ad',
      });

      await service.update(partnerId, { name: ' Yeni ad ' });

      expect(prisma.businessPartner.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { name: 'Yeni ad' },
        }),
      );

      await expect(
        service.update(partnerId, { name: '   ' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('clears nullable contact fields with null', async () => {
      prisma.businessPartner.update.mockResolvedValue({
        ...basePartner,
        phone: null,
        email: null,
        notes: null,
      });

      await service.update(partnerId, {
        phone: null,
        email: null,
        notes: null,
      });

      expect(prisma.businessPartner.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { phone: null, email: null, notes: null },
        }),
      );
    });

    it('rejects role update that would leave both roles false', async () => {
      await expect(
        service.update(partnerId, { isCustomer: false }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.businessPartner.update).not.toHaveBeenCalled();
    });

    it('allows adding supplier role while clearing customer when supplier remains', async () => {
      prisma.businessPartner.update.mockResolvedValue({
        ...basePartner,
        isCustomer: false,
        isSupplier: true,
      });

      await service.update(partnerId, {
        isCustomer: false,
        isSupplier: true,
      });

      expect(prisma.businessPartner.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { isCustomer: false, isSupplier: true },
        }),
      );
    });

    it('updates inactive partner without reactivating', async () => {
      prisma.businessPartner.findUnique.mockResolvedValue({
        ...basePartner,
        isActive: false,
      });
      prisma.businessPartner.update.mockResolvedValue({
        ...basePartner,
        isActive: false,
        name: 'Inactive edit',
      });

      const result = await service.update(partnerId, {
        name: 'Inactive edit',
      });

      expect(result.isActive).toBe(false);
      expect(prisma.businessPartner.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { name: 'Inactive edit' },
        }),
      );
    });

    it('throws NotFoundException when partner is missing', async () => {
      prisma.businessPartner.findUnique.mockResolvedValue(null);

      await expect(
        service.update(partnerId, { name: 'X' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('preserves code in the response after update', async () => {
      prisma.businessPartner.update.mockResolvedValue({
        ...basePartner,
        name: 'Yenilənmiş',
      });

      const result = await service.update(partnerId, { name: 'Yenilənmiş' });

      expect(result.code).toBe('0000001');
    });
  });

  describe('deactivate', () => {
    it('sets isActive false for active partner', async () => {
      prisma.businessPartner.findUnique.mockResolvedValue(basePartner);
      prisma.businessPartner.update.mockResolvedValue({
        ...basePartner,
        isActive: false,
      });

      const result = await service.deactivate(partnerId);

      expect(prisma.businessPartner.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { isActive: false },
        }),
      );
      expect(result.isActive).toBe(false);
      expect(result.code).toBe('0000001');
    });

    it('returns success without second update when already inactive', async () => {
      prisma.businessPartner.findUnique.mockResolvedValue({
        ...basePartner,
        isActive: false,
      });

      const result = await service.deactivate(partnerId);

      expect(prisma.businessPartner.update).not.toHaveBeenCalled();
      expect(result.isActive).toBe(false);
      expect(result.currentDebtBalance).toBe('0.0000');
    });

    it('throws NotFoundException when partner is missing', async () => {
      prisma.businessPartner.findUnique.mockResolvedValue(null);

      await expect(service.deactivate(partnerId)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('soft duplicate flag (US-016)', () => {
    const otherPartner = {
      id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      code: '0000002',
      name: 'Nümunə MMC',
      phone: '+994 50 123 45 67',
      taxNumber: '1234567891',
      isCustomer: true,
      isSupplier: false,
      isActive: true,
    };

    it('rejects create with 409 when possible duplicates match', async () => {
      prisma.businessPartner.findMany.mockResolvedValue([otherPartner]);

      await expect(
        service.create({
          name: '  NÜMUNƏ   MMC  ',
          isCustomer: true,
          isSupplier: false,
        }),
      ).rejects.toMatchObject({
        response: expect.objectContaining({
          message: 'Possible duplicate business partners found',
          code: 'BUSINESS_PARTNER_DUPLICATE_SUSPECTED',
          candidates: [
            expect.objectContaining({
              id: otherPartner.id,
              matchedFields: ['name'],
            }),
          ],
        }),
      });
      expect(prisma.businessPartner.create).not.toHaveBeenCalled();
    });

    it('creates when acknowledgeDuplicate is true despite matches', async () => {
      prisma.businessPartner.findMany.mockResolvedValue([otherPartner]);
      prisma.businessPartner.create.mockResolvedValue(basePartner);

      const result = await service.create({
        name: 'Nümunə MMC',
        isCustomer: true,
        isSupplier: false,
        acknowledgeDuplicate: true,
      });

      expect(result.code).toBe('0000001');
      expect(prisma.businessPartner.create).toHaveBeenCalled();
    });

    it('includes inactive partners in soft-duplicate create check', async () => {
      prisma.businessPartner.findMany.mockResolvedValue([
        { ...otherPartner, isActive: false },
      ]);

      await expect(
        service.create({
          name: 'Nümunə MMC',
          isCustomer: true,
          isSupplier: false,
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('rejects update with 409 when identity helpers collide with another partner', async () => {
      prisma.businessPartner.findUnique.mockResolvedValue(basePartner);
      prisma.businessPartner.findMany.mockResolvedValue([otherPartner]);

      await expect(
        service.update(partnerId, { name: 'Nümunə MMC' }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(prisma.businessPartner.update).not.toHaveBeenCalled();
    });

    it('updates when acknowledgeDuplicate is true', async () => {
      prisma.businessPartner.findUnique.mockResolvedValue(basePartner);
      prisma.businessPartner.findMany.mockResolvedValue([otherPartner]);
      prisma.businessPartner.update.mockResolvedValue({
        ...basePartner,
        name: 'Nümunə MMC',
      });

      const result = await service.update(partnerId, {
        name: 'Nümunə MMC',
        acknowledgeDuplicate: true,
      });

      expect(result.name).toBe('Nümunə MMC');
      expect(prisma.businessPartner.update).toHaveBeenCalled();
    });

    it('skips soft-duplicate check on update when identity helpers unchanged', async () => {
      prisma.businessPartner.findUnique.mockResolvedValue(basePartner);
      prisma.businessPartner.update.mockResolvedValue({
        ...basePartner,
        notes: 'Only notes',
      });

      await service.update(partnerId, { notes: 'Only notes' });

      expect(prisma.businessPartner.findMany).not.toHaveBeenCalled();
    });
  });
});
