import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/client';
import { SortOrder } from '../common/sorting/sort-order.enum';
import { BusinessCodeSequenceKey } from '../number-sequences/business-code-sequence-key';
import { NumberSequencesService } from '../number-sequences/number-sequences.service';
import { ProductTypeApi } from './dto/product-type.enum';
import { ProductsService } from './products.service';

describe('ProductsService', () => {
  const productId = '11111111-1111-4111-8111-111111111111';
  const unitId = '22222222-2222-4222-8222-222222222222';
  const categoryId = '66666666-6666-4666-8666-666666666666';

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
    standardSalePrice: new Decimal('12.5000'),
    latestPurchasePrice: new Decimal('10'),
    criticalStockThreshold: null,
    isActive: true,
    createdAt: new Date('2026-07-28T00:00:00.000Z'),
    updatedAt: new Date('2026-07-28T00:00:00.000Z'),
    unit: unitSummary,
    category: categorySummary,
  };

  const numberSequences = {
    nextCode: jest.fn(),
  };

  const prisma = {
    $transaction: jest.fn((fn: (tx: typeof prisma) => unknown) =>
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

  let service: ProductsService;

  beforeEach(() => {
    jest.clearAllMocks();
    numberSequences.nextCode.mockResolvedValue('0000001');
    service = new ProductsService(
      prisma,
      numberSequences as unknown as NumberSequencesService,
    );
  });

  describe('create', () => {
    it('allocates backend code inside transaction and trims name', async () => {
      prisma.unit.findUnique.mockResolvedValue({ id: unitId, isActive: true });
      prisma.product.create.mockResolvedValue({
        ...baseProduct,
        categoryId: null,
        category: null,
      });

      await service.create({
        name: ' Parça məhsul ',
        type: ProductTypeApi.FINISHED_GOOD,
        unitId,
      });

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(numberSequences.nextCode).toHaveBeenCalledWith(
        prisma,
        BusinessCodeSequenceKey.PRODUCT,
      );
      expect(prisma.product.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            code: '0000001',
            name: 'Parça məhsul',
            categoryId: null,
            isActive: true,
          }) as object,
        }),
      );
    });

    it('stores null categoryId when omitted or explicitly null', async () => {
      prisma.unit.findUnique.mockResolvedValue({ id: unitId, isActive: true });
      prisma.product.create.mockResolvedValue({
        ...baseProduct,
        categoryId: null,
        category: null,
      });

      await service.create({
        name: 'Test',
        type: ProductTypeApi.RAW_MATERIAL,
        unitId,
      });

      expect(prisma.product.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ categoryId: null }) as object,
        }),
      );
      expect(prisma.productCategory.findUnique).not.toHaveBeenCalled();

      prisma.product.create.mockClear();

      await service.create({
        name: 'Test',
        type: ProductTypeApi.RAW_MATERIAL,
        unitId,
        categoryId: null,
      });

      expect(prisma.product.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ categoryId: null }) as object,
        }),
      );
      expect(prisma.productCategory.findUnique).not.toHaveBeenCalled();
    });

    it('assigns active categoryId when provided', async () => {
      prisma.unit.findUnique.mockResolvedValue({ id: unitId, isActive: true });
      prisma.productCategory.findUnique.mockResolvedValue({
        id: categoryId,
        isActive: true,
      });
      prisma.product.create.mockResolvedValue(baseProduct);

      await service.create({
        name: 'Test',
        type: ProductTypeApi.FINISHED_GOOD,
        unitId,
        categoryId,
      });

      expect(prisma.productCategory.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: categoryId } }),
      );
      expect(prisma.product.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ categoryId }) as object,
        }),
      );
    });

    it('throws NotFoundException when category does not exist', async () => {
      prisma.unit.findUnique.mockResolvedValue({ id: unitId, isActive: true });
      prisma.productCategory.findUnique.mockResolvedValue(null);

      await expect(
        service.create({
          name: 'Test',
          type: ProductTypeApi.FINISHED_GOOD,
          unitId,
          categoryId,
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.product.create).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when category is inactive', async () => {
      prisma.unit.findUnique.mockResolvedValue({ id: unitId, isActive: true });
      prisma.productCategory.findUnique.mockResolvedValue({
        id: categoryId,
        isActive: false,
      });

      await expect(
        service.create({
          name: 'Test',
          type: ProductTypeApi.FINISHED_GOOD,
          unitId,
          categoryId,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.product.create).not.toHaveBeenCalled();
    });

    it('persists exact decimal string values', async () => {
      prisma.unit.findUnique.mockResolvedValue({ id: unitId, isActive: true });
      prisma.product.create.mockResolvedValue(baseProduct);

      await service.create({
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
              standardSalePrice: Decimal;
              latestPurchasePrice: Decimal;
              criticalStockThreshold: Decimal;
            };
          },
        ]
      >;
      const createArg = calls[0][0];
      expect(
        createArg.data.standardSalePrice.equals(new Decimal('12.5000')),
      ).toBe(true);
      expect(createArg.data.latestPurchasePrice.equals(new Decimal('0'))).toBe(
        true,
      );
      expect(
        createArg.data.criticalStockThreshold.equals(
          new Decimal('99999999999999.9999'),
        ),
      ).toBe(true);
    });

    it('throws NotFoundException when unit does not exist', async () => {
      prisma.unit.findUnique.mockResolvedValue(null);

      await expect(
        service.create({
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
          name: 'Test',
          type: ProductTypeApi.FINISHED_GOOD,
          unitId,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.product.create).not.toHaveBeenCalled();
    });

    it('throws ConflictException on duplicate code from Prisma', async () => {
      prisma.unit.findUnique.mockResolvedValue({ id: unitId, isActive: true });
      prisma.product.create.mockRejectedValue({
        code: 'P2002',
        clientVersion: '7.9.1',
      });

      await expect(
        service.create({
          name: 'Duplicate',
          type: ProductTypeApi.FINISHED_GOOD,
          unitId,
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('returns serialized decimal fields, unit summary, and category summary', async () => {
      prisma.unit.findUnique.mockResolvedValue({ id: unitId, isActive: true });
      prisma.productCategory.findUnique.mockResolvedValue({
        id: categoryId,
        isActive: true,
      });
      prisma.product.create.mockResolvedValue(baseProduct);

      const result = await service.create({
        name: 'Parça məhsul',
        type: ProductTypeApi.FINISHED_GOOD,
        unitId,
        categoryId,
      });

      expect(result.standardSalePrice).toBe('12.5000');
      expect(result.latestPurchasePrice).toBe('10.0000');
      expect(result.criticalStockThreshold).toBeNull();
      expect(result.categoryId).toBe(categoryId);
      expect(result.category).toEqual(categorySummary);
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
      expect(result.data[0].category).toEqual(categorySummary);
    });

    it('builds search where clause including category name', async () => {
      prisma.product.findMany.mockResolvedValue([]);
      prisma.product.count.mockResolvedValue(0);

      await service.list({ search: 'tx' });

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { code: { contains: 'tx', mode: 'insensitive' } },
              { name: { contains: 'tx', mode: 'insensitive' } },
              { category: { name: { contains: 'tx', mode: 'insensitive' } } },
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

    it('applies unitId and categoryId filters', async () => {
      prisma.product.findMany.mockResolvedValue([]);
      prisma.product.count.mockResolvedValue(0);

      await service.list({
        unitId,
        categoryId,
      });

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            AND: [{ unitId }, { categoryId }],
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
      expect(result.categoryId).toBe(categoryId);
      expect(result.category?.name).toBe('Tekstil');
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

  describe('update', () => {
    beforeEach(() => {
      prisma.product.findUnique.mockResolvedValue(baseProduct);
    });

    it('rejects an empty update body', async () => {
      await expect(service.update(productId, {})).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(prisma.product.update).not.toHaveBeenCalled();
    });

    it('never maps code into Prisma update data', async () => {
      prisma.product.update.mockResolvedValue({
        ...baseProduct,
        name: 'Only name',
      });

      await service.update(productId, { name: 'Only name' });

      const updateCalls = prisma.product.update.mock.calls as Array<
        [{ data: Record<string, unknown> }]
      >;
      expect(updateCalls[0][0].data).not.toHaveProperty('code');
      expect(updateCalls[0][0].data).toEqual({ name: 'Only name' });
    });

    it('maps Prisma P2002 to ConflictException', async () => {
      prisma.product.update.mockRejectedValue({
        code: 'P2002',
        clientVersion: '7.9.1',
      });

      await expect(
        service.update(productId, { name: 'Updated name' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('updates trimmed name and rejects blank name', async () => {
      prisma.product.update.mockResolvedValue({
        ...baseProduct,
        name: 'Yeni ad',
      });

      await service.update(productId, { name: ' Yeni ad ' });

      expect(prisma.product.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { name: 'Yeni ad' },
        }),
      );

      await expect(
        service.update(productId, { name: '   ' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('updates type and clears categoryId with null', async () => {
      prisma.product.update.mockResolvedValue({
        ...baseProduct,
        type: ProductTypeApi.RAW_MATERIAL,
        categoryId: null,
        category: null,
      });

      await service.update(productId, {
        type: ProductTypeApi.RAW_MATERIAL,
        categoryId: null,
      });

      expect(prisma.product.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: ProductTypeApi.RAW_MATERIAL,
            categoryId: null,
          }) as object,
        }),
      );
      expect(prisma.productCategory.findUnique).not.toHaveBeenCalled();
    });

    it('assigns active categoryId on update', async () => {
      const otherCategoryId = '77777777-7777-4777-8777-777777777777';
      prisma.productCategory.findUnique.mockResolvedValue({
        id: otherCategoryId,
        isActive: true,
      });
      prisma.product.update.mockResolvedValue({
        ...baseProduct,
        categoryId: otherCategoryId,
        category: {
          id: otherCategoryId,
          name: 'Digər',
          isActive: true,
        },
      });

      await service.update(productId, { categoryId: otherCategoryId });

      expect(prisma.productCategory.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: otherCategoryId } }),
      );
      expect(prisma.product.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { categoryId: otherCategoryId },
        }),
      );
    });

    it('throws NotFoundException for nonexistent category', async () => {
      prisma.productCategory.findUnique.mockResolvedValue(null);

      await expect(
        service.update(productId, { categoryId }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.product.update).not.toHaveBeenCalled();
    });

    it('throws BadRequestException for inactive category assignment', async () => {
      prisma.productCategory.findUnique.mockResolvedValue({
        id: categoryId,
        isActive: false,
      });

      await expect(
        service.update(productId, { categoryId }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.product.update).not.toHaveBeenCalled();
    });

    it('omits categoryId from Prisma update when not provided', async () => {
      prisma.product.update.mockResolvedValue(baseProduct);

      await service.update(productId, { name: 'Only name' });

      expect(prisma.product.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { name: 'Only name' },
        }),
      );
      expect(prisma.productCategory.findUnique).not.toHaveBeenCalled();
    });

    it('clears decimal fields with null and persists string decimals', async () => {
      prisma.product.update.mockResolvedValue(baseProduct);

      await service.update(productId, {
        standardSalePrice: null,
        latestPurchasePrice: '0',
        criticalStockThreshold: null,
      });

      const updateCalls = prisma.product.update.mock.calls as Array<
        [
          {
            data: {
              standardSalePrice: Decimal | null;
              latestPurchasePrice: Decimal | null;
              criticalStockThreshold: Decimal | null;
            };
          },
        ]
      >;
      const data = updateCalls[0][0].data;
      expect(data.standardSalePrice).toBeNull();
      expect(data.criticalStockThreshold).toBeNull();
      expect(data.latestPurchasePrice?.equals(new Decimal('0'))).toBe(true);
    });

    it('omits unchanged fields from Prisma update data', async () => {
      prisma.product.update.mockResolvedValue(baseProduct);

      await service.update(productId, { name: 'Only name' });

      expect(prisma.product.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { name: 'Only name' },
        }),
      );
      expect(prisma.unit.findUnique).not.toHaveBeenCalled();
    });

    it('validates unit when unitId is present', async () => {
      const newUnitId = '33333333-3333-4333-8333-333333333333';
      prisma.unit.findUnique.mockResolvedValue({
        id: newUnitId,
        isActive: true,
      });
      prisma.product.update.mockResolvedValue({
        ...baseProduct,
        unitId: newUnitId,
      });

      await service.update(productId, { unitId: newUnitId });

      expect(prisma.unit.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: newUnitId } }),
      );
    });

    it('throws NotFoundException for nonexistent unit', async () => {
      prisma.unit.findUnique.mockResolvedValue(null);

      await expect(
        service.update(productId, {
          unitId: '44444444-4444-4444-8444-444444444444',
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws BadRequestException for inactive unit assignment', async () => {
      prisma.unit.findUnique.mockResolvedValue({
        id: '44444444-4444-4444-8444-444444444444',
        isActive: false,
      });

      await expect(
        service.update(productId, {
          unitId: '44444444-4444-4444-8444-444444444444',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('allows update of another field when product references inactive unit', async () => {
      const inactiveUnitId = '55555555-5555-4555-8555-555555555555';
      prisma.product.findUnique.mockResolvedValue({
        ...baseProduct,
        unitId: inactiveUnitId,
        unit: { ...unitSummary, id: inactiveUnitId, isActive: false },
      });
      prisma.product.update.mockResolvedValue({
        ...baseProduct,
        unitId: inactiveUnitId,
        name: 'Düzəliş',
        unit: { ...unitSummary, id: inactiveUnitId, isActive: false },
      });

      await service.update(productId, { name: 'Düzəliş' });

      expect(prisma.unit.findUnique).not.toHaveBeenCalled();
      expect(prisma.product.update).toHaveBeenCalled();
    });

    it('rejects explicit reassignment to the same inactive unit', async () => {
      const inactiveUnitId = '55555555-5555-4555-8555-555555555555';
      prisma.product.findUnique.mockResolvedValue({
        ...baseProduct,
        unitId: inactiveUnitId,
        unit: { ...unitSummary, id: inactiveUnitId, isActive: false },
      });
      prisma.unit.findUnique.mockResolvedValue({
        id: inactiveUnitId,
        isActive: false,
      });

      await expect(
        service.update(productId, { unitId: inactiveUnitId }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('updates inactive product without reactivating', async () => {
      prisma.product.findUnique.mockResolvedValue({
        ...baseProduct,
        isActive: false,
      });
      prisma.product.update.mockResolvedValue({
        ...baseProduct,
        isActive: false,
        name: 'Inactive edit',
      });

      const result = await service.update(productId, { name: 'Inactive edit' });

      expect(result.isActive).toBe(false);
      expect(prisma.product.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { name: 'Inactive edit' },
        }),
      );
    });

    it('throws NotFoundException when product is missing', async () => {
      prisma.product.findUnique.mockResolvedValue(null);

      await expect(
        service.update(productId, { name: 'X' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('maps response decimals, nested unit, and category', async () => {
      prisma.product.update.mockResolvedValue(baseProduct);

      const result = await service.update(productId, { name: 'Parça məhsul' });

      expect(result.standardSalePrice).toBe('12.5000');
      expect(result.unit).toEqual(unitSummary);
      expect(result.categoryId).toBe(categoryId);
      expect(result.category).toEqual(categorySummary);
    });
  });

  describe('deactivate', () => {
    it('sets isActive false for active product', async () => {
      prisma.product.findUnique.mockResolvedValue(baseProduct);
      prisma.product.update.mockResolvedValue({
        ...baseProduct,
        isActive: false,
      });

      const result = await service.deactivate(productId);

      expect(prisma.product.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { isActive: false },
        }),
      );
      expect(result.isActive).toBe(false);
    });

    it('returns success without second update when already inactive', async () => {
      prisma.product.findUnique.mockResolvedValue({
        ...baseProduct,
        isActive: false,
      });

      const result = await service.deactivate(productId);

      expect(prisma.product.update).not.toHaveBeenCalled();
      expect(result.isActive).toBe(false);
      expect(result.standardSalePrice).toBe('12.5000');
      expect(result.unit).toEqual(unitSummary);
      expect(result.category).toEqual(categorySummary);
    });

    it('throws NotFoundException when product is missing', async () => {
      prisma.product.findUnique.mockResolvedValue(null);

      await expect(service.deactivate(productId)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('does not call product delete', async () => {
      prisma.product.findUnique.mockResolvedValue(baseProduct);
      prisma.product.update.mockResolvedValue({
        ...baseProduct,
        isActive: false,
      });

      await service.deactivate(productId);

      expect(prisma.product.delete).not.toHaveBeenCalled();
    });

    it('does not allocate a new business code on deactivate', async () => {
      prisma.product.findUnique.mockResolvedValue(baseProduct);
      prisma.product.update.mockResolvedValue({
        ...baseProduct,
        isActive: false,
      });
      numberSequences.nextCode.mockClear();

      await service.deactivate(productId);

      expect(numberSequences.nextCode).not.toHaveBeenCalled();
    });
  });
});
