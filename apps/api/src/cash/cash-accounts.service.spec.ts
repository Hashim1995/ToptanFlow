import { ConflictException, NotFoundException } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/client';
import { SortOrder } from '../common/sorting/sort-order.enum';
import { CashAccountsService } from './cash-accounts.service';
import { CashAccountSortByField } from './dto/list-cash-accounts-query.dto';

describe('CashAccountsService', () => {
  const actorId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const accountId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

  const baseAccount = {
    id: accountId,
    name: 'Ofis kassası',
    code: 'CA-0000001',
    currentBalance: new Decimal('1000.00'),
    notes: null as string | null,
    responsibleUserId: null as string | null,
    isActive: true,
    deactivatedAt: null as Date | null,
    deactivationReason: null as string | null,
    createdAt: new Date('2026-08-01T00:00:00.000Z'),
    updatedAt: new Date('2026-08-01T00:00:00.000Z'),
    createdByUserId: actorId,
    responsibleUser: null as { id: string; fullName: string } | null,
  };

  const prisma = {
    $transaction: jest.fn(),
    cashAccount: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      update: jest.fn(),
      aggregate: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  };

  const numberSequences = {
    nextCode: jest.fn().mockResolvedValue('0000001'),
  };

  const cashBalance = {
    applyPostedTransaction: jest.fn(),
  };

  let service: CashAccountsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new CashAccountsService(
      prisma as never,
      numberSequences as never,
      cashBalance as never,
    );
  });

  describe('create', () => {
    it('creates account with zero balance and allocates CA code', async () => {
      prisma.$transaction.mockImplementation(
        async (fn: (tx: unknown) => Promise<unknown>) => {
          const tx = {
            cashAccount: {
              create: jest.fn().mockResolvedValue({
                ...baseAccount,
                currentBalance: new Decimal(0),
              }),
              findUniqueOrThrow: jest.fn().mockResolvedValue({
                ...baseAccount,
                currentBalance: new Decimal(0),
              }),
            },
          };
          return fn(tx);
        },
      );

      const result = await service.create({ name: 'Ofis kassası' }, actorId);

      expect(result.code).toBe('CA-0000001');
      expect(result.currentBalance).toBe('0.00');
      expect(cashBalance.applyPostedTransaction).not.toHaveBeenCalled();
    });

    it('posts OPENING_BALANCE when openingBalance > 0', async () => {
      prisma.$transaction.mockImplementation(
        async (fn: (tx: unknown) => Promise<unknown>) => {
          const tx = {
            cashAccount: {
              create: jest.fn().mockResolvedValue({
                ...baseAccount,
                currentBalance: new Decimal(0),
              }),
              findUniqueOrThrow: jest.fn().mockResolvedValue(baseAccount),
            },
          };
          cashBalance.applyPostedTransaction.mockResolvedValue({
            id: 'txn-1',
            balanceAfter: '1000.00',
          });
          return fn(tx);
        },
      );

      const result = await service.create(
        { name: 'Ofis kassası', openingBalance: '1000.00' },
        actorId,
      );

      expect(cashBalance.applyPostedTransaction).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          type: 'OPENING_BALANCE',
          amount: '1000.00',
          direction: 'IN',
        }),
      );
      expect(result.currentBalance).toBe('1000.00');
    });

    it('throws ConflictException on duplicate name', async () => {
      prisma.$transaction.mockRejectedValue({ code: 'P2002' });

      await expect(
        service.create({ name: 'Ofis kassası' }, actorId),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('list / get / update', () => {
    it('lists with pagination meta', async () => {
      prisma.cashAccount.findMany.mockResolvedValue([baseAccount]);
      prisma.cashAccount.count.mockResolvedValue(1);

      const result = await service.list({
        page: 1,
        pageSize: 20,
        isActive: true,
        sortBy: CashAccountSortByField.name,
        sortOrder: SortOrder.ASC,
      });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.data[0].currentBalance).toBe('1000.00');
    });

    it('getById throws when missing', async () => {
      prisma.cashAccount.findUnique.mockResolvedValue(null);
      await expect(service.getById(accountId)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('update does not accept currentBalance field (metadata only)', async () => {
      prisma.cashAccount.findUnique.mockResolvedValue(baseAccount);
      prisma.cashAccount.update.mockResolvedValue({
        ...baseAccount,
        name: 'Yeni ad',
      });

      const result = await service.update(accountId, { name: 'Yeni ad' });

      expect(prisma.cashAccount.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.not.objectContaining({
            currentBalance: expect.anything(),
          }) as object,
        }),
      );
      expect(result.name).toBe('Yeni ad');
    });
  });

  describe('deactivate / reactivate', () => {
    it('deactivates an active account', async () => {
      prisma.cashAccount.findUnique.mockResolvedValue(baseAccount);
      prisma.cashAccount.update.mockResolvedValue({
        ...baseAccount,
        isActive: false,
        deactivatedAt: new Date(),
        deactivationReason: 'Bağlandı',
      });

      const result = await service.deactivate(accountId, actorId, 'Bağlandı');
      expect(result.isActive).toBe(false);
      expect(result.deactivationReason).toBe('Bağlandı');
    });

    it('reactivates an inactive account', async () => {
      prisma.cashAccount.findUnique.mockResolvedValue({
        ...baseAccount,
        isActive: false,
      });
      prisma.cashAccount.update.mockResolvedValue({
        ...baseAccount,
        isActive: true,
        deactivatedAt: null,
        deactivationReason: null,
      });

      const result = await service.reactivate(accountId);
      expect(result.isActive).toBe(true);
    });
  });

  describe('totalCompanyCash', () => {
    it('sums active account balances only', async () => {
      prisma.cashAccount.aggregate.mockResolvedValue({
        _sum: { currentBalance: new Decimal('6500.00') },
        _count: { _all: 3 },
      });

      const result = await service.totalCompanyCash();
      expect(result.totalCompanyCash).toBe('6500.00');
      expect(result.activeAccountCount).toBe(3);
      expect(prisma.cashAccount.aggregate).toHaveBeenCalledWith({
        where: { isActive: true },
        _sum: { currentBalance: true },
        _count: { _all: true },
      });
    });
  });
});
