import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { SortOrder } from '../common/sorting/sort-order.enum';
import { PrismaService } from '../prisma/prisma.service';
import { ProductCategoriesService } from './product-categories.service';

describe('ProductCategoriesService', () => {
  const categoryId = '11111111-1111-4111-8111-111111111111';
  const otherId = '22222222-2222-4222-8222-222222222222';

  const baseCategory = {
    id: categoryId,
    name: 'Tekstil',
    isActive: true,
    createdAt: new Date('2026-07-28T00:00:00.000Z'),
    updatedAt: new Date('2026-07-28T00:00:00.000Z'),
  };

  const prisma = {
    productCategory: {
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

  let service: ProductCategoriesService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ProductCategoriesService(prisma as unknown as PrismaService);
  });

  describe('create', () => {
    it('creates a category successfully and trims name', async () => {
      prisma.productCategory.findFirst.mockResolvedValue(null);
      prisma.productCategory.create.mockResolvedValue(baseCategory);

      const result = await service.create({
        name: ' Tekstil ',
      });

      expect(prisma.productCategory.create).toHaveBeenCalledWith({
        data: { name: 'Tekstil' },
        select: expect.any(Object) as object,
      });
      expect(result.name).toBe('Tekstil');
      expect(result.isActive).toBe(true);
    });

    it('throws ConflictException when name already exists', async () => {
      prisma.productCategory.findFirst.mockResolvedValue({ id: otherId });

      await expect(service.create({ name: 'Tekstil' })).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(prisma.productCategory.create).not.toHaveBeenCalled();
    });

    it('throws ConflictException on duplicate name from Prisma', async () => {
      prisma.productCategory.findFirst.mockResolvedValue(null);
      prisma.productCategory.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('Unique constraint', {
          code: 'P2002',
          clientVersion: '7.9.1',
        }),
      );

      await expect(service.create({ name: 'Tekstil' })).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('rejects empty name after trimming', async () => {
      await expect(service.create({ name: '   ' })).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(prisma.productCategory.create).not.toHaveBeenCalled();
    });
  });

  describe('list', () => {
    it('returns paginated data with meta', async () => {
      prisma.productCategory.findMany.mockResolvedValue([baseCategory]);
      prisma.productCategory.count.mockResolvedValue(1);

      const result = await service.list({
        page: 1,
        pageSize: 20,
        search: 'tek',
        isActive: true,
        sortBy: 'name',
        sortOrder: SortOrder.ASC,
      });

      expect(prisma.productCategory.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 20,
          orderBy: { name: SortOrder.ASC },
          where: {
            AND: [
              { isActive: true },
              { name: { contains: 'tek', mode: 'insensitive' } },
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
    it('throws NotFoundException when category is missing', async () => {
      prisma.productCategory.findUnique.mockResolvedValue(null);

      await expect(service.findOne(categoryId)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('returns inactive categories by id', async () => {
      prisma.productCategory.findUnique.mockResolvedValue({
        ...baseCategory,
        isActive: false,
      });

      const result = await service.findOne(categoryId);
      expect(result.isActive).toBe(false);
    });
  });

  describe('update', () => {
    it('rejects an empty update body', async () => {
      await expect(service.update(categoryId, {})).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(prisma.productCategory.findUnique).not.toHaveBeenCalled();
    });

    it('updates allowed fields', async () => {
      prisma.productCategory.findUnique.mockResolvedValue(baseCategory);
      prisma.productCategory.findFirst.mockResolvedValue(null);
      prisma.productCategory.update.mockResolvedValue({
        ...baseCategory,
        name: 'Updated',
      });

      const result = await service.update(categoryId, { name: ' Updated ' });

      expect(prisma.productCategory.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: categoryId },
          data: { name: 'Updated' },
        }),
      );
      expect(result.name).toBe('Updated');
    });

    it('throws ConflictException when another category uses the name', async () => {
      prisma.productCategory.findUnique.mockResolvedValue(baseCategory);
      prisma.productCategory.findFirst.mockResolvedValue({ id: otherId });

      await expect(
        service.update(categoryId, { name: 'Digər' }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(prisma.productCategory.update).not.toHaveBeenCalled();
    });

    it('allows updating to the same normalized name', async () => {
      prisma.productCategory.findUnique.mockResolvedValue(baseCategory);
      prisma.productCategory.findFirst.mockResolvedValue(null);
      prisma.productCategory.update.mockResolvedValue(baseCategory);

      await service.update(categoryId, { name: ' Tekstil ' });

      expect(prisma.productCategory.findFirst).toHaveBeenCalled();
      expect(prisma.productCategory.update).toHaveBeenCalled();
    });

    it('rejects empty name after trimming', async () => {
      prisma.productCategory.findUnique.mockResolvedValue(baseCategory);

      await expect(
        service.update(categoryId, { name: '   ' }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.productCategory.update).not.toHaveBeenCalled();
    });
  });

  describe('deactivate', () => {
    it('sets isActive to false', async () => {
      prisma.productCategory.findUnique.mockResolvedValue(baseCategory);
      prisma.productCategory.update.mockResolvedValue({
        ...baseCategory,
        isActive: false,
      });

      const result = await service.deactivate(categoryId);

      expect(prisma.productCategory.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: categoryId },
          data: { isActive: false },
        }),
      );
      expect(result.isActive).toBe(false);
    });

    it('is idempotent when already inactive', async () => {
      const inactive = { ...baseCategory, isActive: false };
      prisma.productCategory.findUnique.mockResolvedValue(inactive);

      const result = await service.deactivate(categoryId);

      expect(prisma.productCategory.update).not.toHaveBeenCalled();
      expect(result.isActive).toBe(false);
    });

    it('throws NotFoundException when category is missing', async () => {
      prisma.productCategory.findUnique.mockResolvedValue(null);

      await expect(service.deactivate(categoryId)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('never uses Prisma hard delete APIs', async () => {
      prisma.productCategory.findUnique.mockResolvedValue(baseCategory);
      prisma.productCategory.update.mockResolvedValue({
        ...baseCategory,
        isActive: false,
      });

      await service.deactivate(categoryId);

      expect(prisma.productCategory.delete).not.toHaveBeenCalled();
      expect(prisma.productCategory.deleteMany).not.toHaveBeenCalled();
    });
  });
});
