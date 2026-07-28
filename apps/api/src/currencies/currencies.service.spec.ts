import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CurrenciesService } from './currencies.service';

describe('CurrenciesService', () => {
  const currencyId = '11111111-1111-4111-8111-111111111111';
  const otherId = '22222222-2222-4222-8222-222222222222';

  const baseCurrency = {
    id: currencyId,
    code: 'USD',
    name: 'ABŞ dolları',
    symbol: '$',
    isActive: true,
    createdAt: new Date('2026-07-28T00:00:00.000Z'),
    updatedAt: new Date('2026-07-28T00:00:00.000Z'),
  };

  const prisma = {
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

  let service: CurrenciesService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new CurrenciesService(prisma as unknown as PrismaService);
  });

  describe('create', () => {
    it('creates a currency successfully', async () => {
      prisma.currency.create.mockResolvedValue(baseCurrency);

      const result = await service.create({
        code: ' usd ',
        name: ' ABŞ dolları ',
        symbol: ' $ ',
      });

      expect(prisma.currency.create).toHaveBeenCalledWith({
        data: {
          code: 'USD',
          name: 'ABŞ dolları',
          symbol: '$',
        },
        select: expect.any(Object) as object,
      });
      expect(result.code).toBe('USD');
    });

    it('normalizes code to uppercase', async () => {
      prisma.currency.create.mockResolvedValue({
        ...baseCurrency,
        code: 'EUR',
      });

      await service.create({ code: 'eur', name: 'Avro' });

      expect(prisma.currency.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ code: 'EUR' }) as object,
        }),
      );
    });

    it('stores empty symbol as null', async () => {
      prisma.currency.create.mockResolvedValue({
        ...baseCurrency,
        symbol: null,
      });

      await service.create({ code: 'USD', name: 'ABŞ dolları', symbol: '  ' });

      expect(prisma.currency.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ symbol: null }) as object,
        }),
      );
    });

    it('throws ConflictException on duplicate code from Prisma', async () => {
      prisma.currency.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('Unique constraint', {
          code: 'P2002',
          clientVersion: '7.9.1',
        }),
      );

      await expect(
        service.create({ code: 'USD', name: 'Duplicate' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('rejects empty code after trimming', async () => {
      await expect(
        service.create({ code: '   ', name: 'Valid' }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.currency.create).not.toHaveBeenCalled();
    });
  });

  describe('list', () => {
    it('returns paginated data with meta', async () => {
      prisma.currency.findMany.mockResolvedValue([baseCurrency]);
      prisma.currency.count.mockResolvedValue(1);

      const result = await service.list({
        page: 1,
        pageSize: 20,
        search: 'usd',
        isActive: true,
        sortBy: 'name',
        sortOrder: 'asc',
      });

      expect(prisma.currency.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 20,
          orderBy: { name: 'asc' },
          where: {
            AND: [
              { isActive: true },
              {
                OR: [
                  { code: { contains: 'usd', mode: 'insensitive' } },
                  { name: { contains: 'usd', mode: 'insensitive' } },
                  { symbol: { contains: 'usd', mode: 'insensitive' } },
                ],
              },
            ],
          },
        }),
      );
      expect(result.meta).toEqual({
        page: 1,
        pageSize: 20,
        total: 1,
        totalPages: 1,
      });
      expect(result.data).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('throws NotFoundException when currency is missing', async () => {
      prisma.currency.findUnique.mockResolvedValue(null);

      await expect(service.findOne(currencyId)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('returns inactive currencies by id', async () => {
      prisma.currency.findUnique.mockResolvedValue({
        ...baseCurrency,
        isActive: false,
      });

      const result = await service.findOne(currencyId);
      expect(result.isActive).toBe(false);
    });
  });

  describe('update', () => {
    it('updates allowed fields', async () => {
      prisma.currency.findUnique.mockResolvedValue(baseCurrency);
      prisma.currency.update.mockResolvedValue({
        ...baseCurrency,
        name: 'Updated',
      });

      const result = await service.update(currencyId, { name: ' Updated ' });

      expect(prisma.currency.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: currencyId },
          data: { name: 'Updated' },
        }),
      );
      expect(result.name).toBe('Updated');
    });

    it('throws ConflictException when another currency uses the code', async () => {
      prisma.currency.findUnique.mockResolvedValue(baseCurrency);
      prisma.currency.findFirst.mockResolvedValue({ id: otherId });

      await expect(
        service.update(currencyId, { code: 'EUR' }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(prisma.currency.update).not.toHaveBeenCalled();
    });

    it('allows updating to the same normalized code', async () => {
      prisma.currency.findUnique.mockResolvedValue(baseCurrency);
      prisma.currency.update.mockResolvedValue(baseCurrency);

      await service.update(currencyId, { code: 'usd' });

      expect(prisma.currency.findFirst).not.toHaveBeenCalled();
      expect(prisma.currency.update).toHaveBeenCalled();
    });
  });

  describe('deactivate', () => {
    it('sets isActive to false', async () => {
      prisma.currency.findUnique.mockResolvedValue(baseCurrency);
      prisma.currency.update.mockResolvedValue({
        ...baseCurrency,
        isActive: false,
      });

      const result = await service.deactivate(currencyId);

      expect(prisma.currency.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: currencyId },
          data: { isActive: false },
        }),
      );
      expect(result.isActive).toBe(false);
    });

    it('is idempotent when already inactive', async () => {
      const inactive = { ...baseCurrency, isActive: false };
      prisma.currency.findUnique.mockResolvedValue(inactive);

      const result = await service.deactivate(currencyId);

      expect(prisma.currency.update).not.toHaveBeenCalled();
      expect(result.isActive).toBe(false);
    });

    it('throws NotFoundException when currency is missing', async () => {
      prisma.currency.findUnique.mockResolvedValue(null);

      await expect(service.deactivate(currencyId)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('never uses Prisma hard delete APIs', async () => {
      prisma.currency.findUnique.mockResolvedValue(baseCurrency);
      prisma.currency.update.mockResolvedValue({
        ...baseCurrency,
        isActive: false,
      });

      await service.deactivate(currencyId);

      expect(prisma.currency.delete).not.toHaveBeenCalled();
      expect(prisma.currency.deleteMany).not.toHaveBeenCalled();
    });
  });
});
