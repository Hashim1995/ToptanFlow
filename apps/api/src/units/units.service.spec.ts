import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { SortOrder } from '../common/sorting/sort-order.enum';
import { PrismaService } from '../prisma/prisma.service';
import { UnitsService } from './units.service';

describe('UnitsService', () => {
  const unitId = '11111111-1111-4111-8111-111111111111';
  const otherId = '22222222-2222-4222-8222-222222222222';

  const baseUnit = {
    id: unitId,
    code: 'KG',
    name: 'Kiloqram',
    allowsFractionalQuantity: true,
    isActive: true,
    createdAt: new Date('2026-07-28T00:00:00.000Z'),
    updatedAt: new Date('2026-07-28T00:00:00.000Z'),
  };

  const prisma = {
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

  let service: UnitsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new UnitsService(prisma as unknown as PrismaService);
  });

  describe('create', () => {
    it('creates a unit successfully', async () => {
      prisma.unit.create.mockResolvedValue(baseUnit);

      const result = await service.create({
        code: ' kg ',
        name: ' Kiloqram ',
      });

      expect(prisma.unit.create).toHaveBeenCalledWith({
        data: {
          code: 'KG',
          name: 'Kiloqram',
          allowsFractionalQuantity: true,
        },
        select: expect.any(Object) as object,
      });
      expect(result.code).toBe('KG');
    });

    it('normalizes code to uppercase', async () => {
      prisma.unit.create.mockResolvedValue({ ...baseUnit, code: 'LT' });

      await service.create({ code: 'lt', name: 'Litr' });

      expect(prisma.unit.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ code: 'LT' }) as object,
        }),
      );
    });

    it('throws ConflictException on duplicate code from Prisma', async () => {
      prisma.unit.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('Unique constraint', {
          code: 'P2002',
          clientVersion: '7.9.1',
        }),
      );

      await expect(
        service.create({ code: 'KG', name: 'Duplicate' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('rejects empty code after trimming', async () => {
      await expect(
        service.create({ code: '   ', name: 'Valid' }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.unit.create).not.toHaveBeenCalled();
    });

    it('rejects empty name after trimming', async () => {
      await expect(
        service.create({ code: 'KG', name: '   ' }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.unit.create).not.toHaveBeenCalled();
    });
  });

  describe('list', () => {
    it('returns paginated data with meta', async () => {
      prisma.unit.findMany.mockResolvedValue([baseUnit]);
      prisma.unit.count.mockResolvedValue(1);

      const result = await service.list({
        page: 1,
        pageSize: 20,
        search: 'ki',
        isActive: true,
        sortBy: 'name',
        sortOrder: SortOrder.ASC,
      });

      expect(prisma.unit.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 20,
          orderBy: { name: SortOrder.ASC },
          where: {
            AND: [
              { isActive: true },
              {
                OR: [
                  { code: { contains: 'ki', mode: 'insensitive' } },
                  { name: { contains: 'ki', mode: 'insensitive' } },
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
    it('throws NotFoundException when unit is missing', async () => {
      prisma.unit.findUnique.mockResolvedValue(null);

      await expect(service.findOne(unitId)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('returns inactive units by id', async () => {
      prisma.unit.findUnique.mockResolvedValue({
        ...baseUnit,
        isActive: false,
      });

      const result = await service.findOne(unitId);
      expect(result.isActive).toBe(false);
    });
  });

  describe('update', () => {
    it('rejects an empty update body', async () => {
      await expect(service.update(unitId, {})).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(prisma.unit.findUnique).not.toHaveBeenCalled();
    });

    it('updates allowed fields', async () => {
      prisma.unit.findUnique.mockResolvedValue(baseUnit);
      prisma.unit.update.mockResolvedValue({
        ...baseUnit,
        name: 'Updated',
      });

      const result = await service.update(unitId, { name: ' Updated ' });

      expect(prisma.unit.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: unitId },
          data: { name: 'Updated' },
        }),
      );
      expect(result.name).toBe('Updated');
    });

    it('throws ConflictException when another unit uses the code', async () => {
      prisma.unit.findUnique.mockResolvedValue(baseUnit);
      prisma.unit.findFirst.mockResolvedValue({ id: otherId });

      await expect(
        service.update(unitId, { code: 'LT' }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(prisma.unit.update).not.toHaveBeenCalled();
    });

    it('allows updating to the same normalized code', async () => {
      prisma.unit.findUnique.mockResolvedValue(baseUnit);
      prisma.unit.update.mockResolvedValue(baseUnit);

      await service.update(unitId, { code: 'kg' });

      expect(prisma.unit.findFirst).not.toHaveBeenCalled();
      expect(prisma.unit.update).toHaveBeenCalled();
    });
  });

  describe('deactivate', () => {
    it('sets isActive to false', async () => {
      prisma.unit.findUnique.mockResolvedValue(baseUnit);
      prisma.unit.update.mockResolvedValue({ ...baseUnit, isActive: false });

      const result = await service.deactivate(unitId);

      expect(prisma.unit.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: unitId },
          data: { isActive: false },
        }),
      );
      expect(result.isActive).toBe(false);
    });

    it('is idempotent when already inactive', async () => {
      const inactive = { ...baseUnit, isActive: false };
      prisma.unit.findUnique.mockResolvedValue(inactive);

      const result = await service.deactivate(unitId);

      expect(prisma.unit.update).not.toHaveBeenCalled();
      expect(result.isActive).toBe(false);
    });

    it('throws NotFoundException when unit is missing', async () => {
      prisma.unit.findUnique.mockResolvedValue(null);

      await expect(service.deactivate(unitId)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('never uses Prisma hard delete APIs', async () => {
      prisma.unit.findUnique.mockResolvedValue(baseUnit);
      prisma.unit.update.mockResolvedValue({ ...baseUnit, isActive: false });

      await service.deactivate(unitId);

      expect(prisma.unit.delete).not.toHaveBeenCalled();
      expect(prisma.unit.deleteMany).not.toHaveBeenCalled();
    });
  });
});
