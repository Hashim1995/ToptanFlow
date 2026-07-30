import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { SortOrder } from '../common/sorting/sort-order.enum';
import { BusinessCodeSequenceKey } from '../number-sequences/business-code-sequence-key';
import { NumberSequencesService } from '../number-sequences/number-sequences.service';
import { WarehouseKindApi } from './dto/warehouse-kind.enum';
import { WarehousesService } from './warehouses.service';

describe('WarehousesService', () => {
  const warehouseId = '11111111-1111-4111-8111-111111111111';
  const otherId = '22222222-2222-4222-8222-222222222222';

  const baseWarehouse = {
    id: warehouseId,
    code: '0000001',
    name: 'Əsas anbar',
    kind: WarehouseKindApi.GENERAL,
    isActive: true,
    createdAt: new Date('2026-07-31T00:00:00.000Z'),
    updatedAt: new Date('2026-07-31T00:00:00.000Z'),
  };

  const numberSequences = {
    nextCode: jest.fn(),
  };

  const prisma = {
    $transaction: jest.fn((fn: (tx: unknown) => unknown) =>
      Promise.resolve(fn(prisma)),
    ),
    warehouse: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  let service: WarehousesService;

  beforeEach(() => {
    jest.clearAllMocks();
    numberSequences.nextCode.mockResolvedValue('0000001');
    service = new WarehousesService(
      prisma as never,
      numberSequences as unknown as NumberSequencesService,
    );
  });

  describe('create', () => {
    it('allocates backend code inside transaction and trims name', async () => {
      prisma.warehouse.create.mockResolvedValue(baseWarehouse);

      const result = await service.create({
        name: ' Əsas anbar ',
        kind: WarehouseKindApi.GENERAL,
      });

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(numberSequences.nextCode).toHaveBeenCalledWith(
        prisma,
        BusinessCodeSequenceKey.WAREHOUSE,
      );
      expect(prisma.warehouse.create).toHaveBeenCalledWith({
        data: {
          code: '0000001',
          name: 'Əsas anbar',
          kind: WarehouseKindApi.GENERAL,
          isActive: true,
        },
        select: expect.any(Object) as object,
      });
      expect(result.code).toBe('0000001');
      expect(result.name).toBe('Əsas anbar');
    });

    it('rejects empty name after trimming', async () => {
      await expect(
        service.create({ name: '   ', kind: WarehouseKindApi.GENERAL }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.warehouse.create).not.toHaveBeenCalled();
    });

    it('throws ConflictException on duplicate code from Prisma', async () => {
      prisma.warehouse.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('Unique constraint', {
          code: 'P2002',
          clientVersion: '7.9.1',
        }),
      );

      await expect(
        service.create({
          name: 'Əsas anbar',
          kind: WarehouseKindApi.GENERAL,
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('list', () => {
    it('returns paginated data with meta and applies filters', async () => {
      prisma.warehouse.findMany.mockResolvedValue([baseWarehouse]);
      prisma.warehouse.count.mockResolvedValue(1);

      const result = await service.list({
        page: 1,
        pageSize: 20,
        search: 'əsas',
        isActive: true,
        kind: WarehouseKindApi.GENERAL,
        sortBy: 'code',
        sortOrder: SortOrder.ASC,
      });

      expect(result.data).toHaveLength(1);
      expect(result.meta).toEqual({
        page: 1,
        pageSize: 20,
        total: 1,
        totalPages: 1,
      });
      expect(prisma.warehouse.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: expect.any(Array) as unknown[],
          }) as object,
        }) as object,
      );
    });
  });

  describe('findOne', () => {
    it('returns warehouse by id', async () => {
      prisma.warehouse.findUnique.mockResolvedValue(baseWarehouse);
      const result = await service.findOne(warehouseId);
      expect(result.id).toBe(warehouseId);
    });

    it('throws NotFoundException when missing', async () => {
      prisma.warehouse.findUnique.mockResolvedValue(null);
      await expect(service.findOne(otherId)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('updates name and kind; never accepts client code', async () => {
      prisma.warehouse.findUnique.mockResolvedValue(baseWarehouse);
      prisma.warehouse.update.mockResolvedValue({
        ...baseWarehouse,
        name: 'Zədələnmiş anbar',
        kind: WarehouseKindApi.DAMAGED,
      });

      const result = await service.update(warehouseId, {
        name: ' Zədələnmiş anbar ',
        kind: WarehouseKindApi.DAMAGED,
      });

      expect(prisma.warehouse.update).toHaveBeenCalledWith({
        where: { id: warehouseId },
        data: {
          name: 'Zədələnmiş anbar',
          kind: WarehouseKindApi.DAMAGED,
        },
        select: expect.any(Object) as object,
      });
      expect(result.name).toBe('Zədələnmiş anbar');
      expect(result.kind).toBe(WarehouseKindApi.DAMAGED);
    });

    it('reactivates via isActive true', async () => {
      prisma.warehouse.findUnique.mockResolvedValue({
        ...baseWarehouse,
        isActive: false,
      });
      prisma.warehouse.update.mockResolvedValue({
        ...baseWarehouse,
        isActive: true,
      });

      const result = await service.update(warehouseId, { isActive: true });
      expect(result.isActive).toBe(true);
    });

    it('rejects empty body', async () => {
      await expect(service.update(warehouseId, {})).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('throws NotFoundException when missing', async () => {
      prisma.warehouse.findUnique.mockResolvedValue(null);
      await expect(
        service.update(warehouseId, { name: 'X' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('deactivate', () => {
    it('soft-deactivates an active warehouse', async () => {
      prisma.warehouse.findUnique.mockResolvedValue(baseWarehouse);
      prisma.warehouse.update.mockResolvedValue({
        ...baseWarehouse,
        isActive: false,
      });

      const result = await service.deactivate(warehouseId);
      expect(result.isActive).toBe(false);
      expect(prisma.warehouse.delete).not.toHaveBeenCalled();
    });

    it('is idempotent when already inactive', async () => {
      prisma.warehouse.findUnique.mockResolvedValue({
        ...baseWarehouse,
        isActive: false,
      });

      const result = await service.deactivate(warehouseId);
      expect(result.isActive).toBe(false);
      expect(prisma.warehouse.update).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when missing', async () => {
      prisma.warehouse.findUnique.mockResolvedValue(null);
      await expect(service.deactivate(warehouseId)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
