import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { SortOrder } from '../common/sorting/sort-order.enum';
import { ProductTypeApi } from './dto/product-type.enum';
import { PrismaService } from '../prisma/prisma.service';
import { ProductsService } from './products.service';

describe('ProductsService', () => {
  const productId = '11111111-1111-4111-8111-111111111111';
  const unitId = '22222222-2222-4222-8222-222222222222';

  const unitSummary = {
    id: unitId,
    code: 'KG',
    name: 'Kiloqram',
    allowsFractionalQuantity: true,
    isActive: true,
  };

  const baseProduct = {
    id: productId,
    code: 'TX-001',
    name: 'Parça məhsul',
    type: ProductTypeApi.FINISHED_GOOD,
    category: 'Tekstil',
    unitId,
    standardSalePrice: new Prisma.Decimal('12.5000'),
    latestPurchasePrice: new Prisma.Decimal('10'),
    criticalStockThreshold: null,
    isActive: true,
    createdAt: new Date('2026-07-28T00:00:00.000Z'),
    updatedAt: new Date('2026-07-28T00:00:00.000Z'),
    unit: unitSummary,
  };

  const prisma = {
    product: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
    },
    unit: {
      findUnique: jest.fn(),
    },
  };

  let service: ProductsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ProductsService(prisma as unknown as PrismaService);
  });

  describe('create', () => {
    it('normalizes code to uppercase and trims name', async () => {
      prisma.unit.findUnique.mockResolvedValue({ id: unitId, isActive: true });
      prisma.product.create.mockResolvedValue(baseProduct);

      await service.create({
        code: ' tx-001 ',
        name: ' Parça məhsul ',
        type: ProductTypeApi.FINISHED_GOOD,
        unitId,
      });

      expect(prisma.product.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            code: 'TX-001',
            name: 'Parça məhsul',
            isActive: true,
          }) as object,
        }),
      );
    });

    it('converts blank category to null', async () => {
      prisma.unit.findUnique.mockResolvedValue({ id: unitId, isActive: true });
      prisma.product.create.mockResolvedValue({
        ...baseProduct,
        category: null,
      });

      await service.create({
        code: 'TX-002',
        name: 'Test',
        type: ProductTypeApi.RAW_MATERIAL,
        unitId,
        category: '   ',
      });

      expect(prisma.product.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ category: null }) as object,
        }),
      );
    });

    it('persists exact decimal string values', async () => {
      prisma.unit.findUnique.mockResolvedValue({ id: unitId, isActive: true });
      prisma.product.create.mockResolvedValue(baseProduct);

      await service.create({
        code: 'TX-003',
        name: 'Test',
        type: ProductTypeApi.MIXED_USE,
        unitId,
        standardSalePrice: '12.5000',
        latestPurchasePrice: '0',
        criticalStockThreshold: '99999999999999.9999',
      });

      const calls = prisma.product.create.mock.calls as Array<
        [
          {
            data: {
              standardSalePrice: Prisma.Decimal;
              latestPurchasePrice: Prisma.Decimal;
              criticalStockThreshold: Prisma.Decimal;
            };
          },
        ]
      >;
      const createArg = calls[0][0];
      expect(
        createArg.data.standardSalePrice.equals(new Prisma.Decimal('12.5000')),
      ).toBe(true);
      expect(
        createArg.data.latestPurchasePrice.equals(new Prisma.Decimal('0')),
      ).toBe(true);
      expect(
        createArg.data.criticalStockThreshold.equals(
          new Prisma.Decimal('99999999999999.9999'),
        ),
      ).toBe(true);
    });

    it('throws NotFoundException when unit does not exist', async () => {
      prisma.unit.findUnique.mockResolvedValue(null);

      await expect(
        service.create({
          code: 'TX-004',
          name: 'Test',
          type: ProductTypeApi.FINISHED_GOOD,
          unitId,
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.product.create).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when unit is inactive', async () => {
      prisma.unit.findUnique.mockResolvedValue({ id: unitId, isActive: false });

      await expect(
        service.create({
          code: 'TX-005',
          name: 'Test',
          type: ProductTypeApi.FINISHED_GOOD,
          unitId,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.product.create).not.toHaveBeenCalled();
    });

    it('throws ConflictException on duplicate code from Prisma', async () => {
      prisma.unit.findUnique.mockResolvedValue({ id: unitId, isActive: true });
      prisma.product.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('Unique constraint', {
          code: 'P2002',
          clientVersion: '7.9.1',
        }),
      );

      await expect(
        service.create({
          code: 'TX-001',
          name: 'Duplicate',
          type: ProductTypeApi.FINISHED_GOOD,
          unitId,
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('returns serialized decimal fields and unit summary', async () => {
      prisma.unit.findUnique.mockResolvedValue({ id: unitId, isActive: true });
      prisma.product.create.mockResolvedValue(baseProduct);

      const result = await service.create({
        code: 'TX-001',
        name: 'Parça məhsul',
        type: ProductTypeApi.FINISHED_GOOD,
        unitId,
      });

      expect(result.standardSalePrice).toBe('12.5000');
      expect(result.latestPurchasePrice).toBe('10.0000');
      expect(result.criticalStockThreshold).toBeNull();
      expect(result.unit).toEqual(unitSummary);
    });
  });

  describe('list', () => {
    it('returns default pagination metadata', async () => {
      prisma.product.findMany.mockResolvedValue([baseProduct]);
      prisma.product.count.mockResolvedValue(1);

      const result = await service.list({});

      expect(result.meta).toEqual({
        page: 1,
        pageSize: 20,
        total: 1,
        totalPages: 1,
      });
      expect(result.data[0].standardSalePrice).toBe('12.5000');
    });

    it('builds search where clause', async () => {
      prisma.product.findMany.mockResolvedValue([]);
      prisma.product.count.mockResolvedValue(0);

      await service.list({ search: 'tx' });

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { code: { contains: 'tx', mode: 'insensitive' } },
              { name: { contains: 'tx', mode: 'insensitive' } },
              { category: { contains: 'tx', mode: 'insensitive' } },
            ],
          },
        }),
      );
    });

    it('applies isActive and type filters', async () => {
      prisma.product.findMany.mockResolvedValue([]);
      prisma.product.count.mockResolvedValue(0);

      await service.list({
        isActive: true,
        type: ProductTypeApi.RAW_MATERIAL,
      });

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            AND: [{ isActive: true }, { type: ProductTypeApi.RAW_MATERIAL }],
          },
        }),
      );
    });

    it('applies unitId and category filters', async () => {
      prisma.product.findMany.mockResolvedValue([]);
      prisma.product.count.mockResolvedValue(0);

      await service.list({
        unitId,
        category: 'Tekstil',
      });

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            AND: [
              { unitId },
              { category: { equals: 'Tekstil', mode: 'insensitive' } },
            ],
          },
        }),
      );
    });

    it('sorts with deterministic secondary id order', async () => {
      prisma.product.findMany.mockResolvedValue([]);
      prisma.product.count.mockResolvedValue(0);

      await service.list({ sortBy: 'name', sortOrder: SortOrder.DESC });

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: [{ name: SortOrder.DESC }, { id: 'asc' }],
        }),
      );
    });

    it('does not load sale or purchase relations', async () => {
      prisma.product.findMany.mockResolvedValue([]);
      prisma.product.count.mockResolvedValue(0);

      await service.list({});

      const findManyCalls = prisma.product.findMany.mock.calls as Array<
        [{ select: Record<string, unknown> }]
      >;
      const select = findManyCalls[0][0].select;
      expect(select).not.toHaveProperty('saleItems');
      expect(select).not.toHaveProperty('purchaseItems');
    });
  });

  describe('findOne', () => {
    it('returns a product by id', async () => {
      prisma.product.findUnique.mockResolvedValue(baseProduct);

      const result = await service.findOne(productId);

      expect(result.id).toBe(productId);
      expect(result.unit.code).toBe('KG');
    });

    it('returns inactive products by id', async () => {
      prisma.product.findUnique.mockResolvedValue({
        ...baseProduct,
        isActive: false,
      });

      const result = await service.findOne(productId);

      expect(result.isActive).toBe(false);
    });

    it('throws NotFoundException when product is missing', async () => {
      prisma.product.findUnique.mockResolvedValue(null);

      await expect(service.findOne(productId)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
