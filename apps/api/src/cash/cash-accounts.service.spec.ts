import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/client';
import { SortOrder } from '../common/sorting/sort-order.enum';
import { CashAccountsService } from './cash-accounts.service';
import { CashAccountSortByField } from './dto/list-cash-accounts-query.dto';

describe('CashAccountsService', () => {
  const actorId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const accountId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  const responsibleUserId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';

  const baseAccount = {
    id: accountId,
    name: 'Ofis kassası',
    code: 'CA-0000001',
    currentBalance: new Decimal('1000.00'),
    notes: null as string | null,
    responsibleUserId,
    isActive: true,
    deactivatedAt: null as Date | null,
    deactivationReason: null as string | null,
    createdAt: new Date('2026-08-01T00:00:00.000Z'),
    updatedAt: new Date('2026-08-01T00:00:00.000Z'),
    createdByUserId: actorId,
    responsibleUser: { id: responsibleUserId, fullName: 'Responsible user' },
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
    cashTransaction: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
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
    cancelPostedTransaction: jest.fn(),
  };

  let service: CashAccountsService;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.user.findUnique.mockResolvedValue({
      id: responsibleUserId,
      isActive: true,
    });
    prisma.cashTransaction.findMany.mockResolvedValue([]);
    prisma.$transaction.mockImplementation(
      async (fn: (tx: unknown) => Promise<unknown>) => fn(prisma),
    );
    service = new CashAccountsService(
      prisma as never,
      numberSequences as never,
      cashBalance as never,
      {
        notifyCashAccountCreated: jest.fn(),
        notifyOpeningBalanceCorrected: jest.fn(),
      } as never,
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

      const result = await service.create(
        { name: 'Ofis kassası', responsibleUserId },
        actorId,
      );

      expect(result.code).toBe('CA-0000001');
      expect(result.currentBalance).toBe('0.00');
      expect(result.openingBalance).toBe('0.00');
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
        {
          name: 'Ofis kassası',
          responsibleUserId,
          openingBalance: '1000.00',
        },
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
      expect(result.openingBalance).toBe('1000.00');
    });

    it('throws ConflictException on duplicate name', async () => {
      prisma.$transaction.mockRejectedValue({ code: 'P2002' });

      await expect(
        service.create({ name: 'Ofis kassası', responsibleUserId }, actorId),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('reports a distinct conflict when the user already owns an account', async () => {
      prisma.$transaction.mockRejectedValue({
        code: 'P2002',
        meta: { target: ['responsibleUserId'] },
      });

      await expect(
        service.create({ name: 'Yeni kassa', responsibleUserId }, actorId),
      ).rejects.toMatchObject({
        response: { code: 'CASH_ACCOUNT_RESPONSIBLE_USER_CONFLICT' },
      });
    });
  });

  describe('list / get / update', () => {
    it('lists with pagination meta', async () => {
      prisma.cashAccount.findMany.mockResolvedValue([baseAccount]);
      prisma.cashAccount.count.mockResolvedValue(1);
      prisma.cashTransaction.findMany.mockResolvedValue([
        {
          cashAccountId: accountId,
          amount: new Decimal('1000.00'),
        },
      ]);

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
      expect(result.data[0].openingBalance).toBe('1000.00');
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

    it('rejects an ownership change by an ordinary user', async () => {
      prisma.cashAccount.findUnique.mockResolvedValue(baseAccount);

      await expect(
        service.update(
          accountId,
          { responsibleUserId: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd' },
          false,
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(prisma.cashAccount.update).not.toHaveBeenCalled();
    });

    it('rejects an opening-balance change by an ordinary user', async () => {
      prisma.cashAccount.findUnique.mockResolvedValue(baseAccount);

      await expect(
        service.update(accountId, { openingBalance: '500.00' }, false, actorId),
      ).rejects.toMatchObject({
        response: { code: 'SUPERADMIN_REQUIRED' },
      });
      expect(cashBalance.cancelPostedTransaction).not.toHaveBeenCalled();
      expect(cashBalance.applyPostedTransaction).not.toHaveBeenCalled();
    });

    it('allows a Super Admin to assign an active unowned user', async () => {
      const nextOwner = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
      prisma.cashAccount.findUnique.mockResolvedValue(baseAccount);
      prisma.user.findUnique.mockResolvedValue({
        id: nextOwner,
        isActive: true,
      });
      prisma.cashAccount.update.mockResolvedValue({
        ...baseAccount,
        responsibleUserId: nextOwner,
        responsibleUser: { id: nextOwner, fullName: 'Yeni məsul şəxs' },
      });

      const result = await service.update(
        accountId,
        { responsibleUserId: nextOwner },
        true,
        actorId,
      );

      expect(result.responsibleUserId).toBe(nextOwner);
    });

    it('allows a Super Admin to correct opening balance via reverse+repost', async () => {
      const openingTxnId = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
      prisma.cashAccount.findUnique.mockResolvedValue(baseAccount);
      prisma.cashAccount.findUniqueOrThrow.mockResolvedValue({
        ...baseAccount,
        currentBalance: new Decimal('500.00'),
      });
      prisma.cashTransaction.findFirst.mockResolvedValue({
        id: openingTxnId,
        amount: new Decimal('1000.00'),
      });
      prisma.cashTransaction.findMany.mockResolvedValue([
        {
          cashAccountId: accountId,
          amount: new Decimal('500.00'),
        },
      ]);
      cashBalance.cancelPostedTransaction.mockResolvedValue({});
      cashBalance.applyPostedTransaction.mockResolvedValue({
        id: 'txn-2',
        balanceAfter: '500.00',
      });

      const result = await service.update(
        accountId,
        { openingBalance: '500.00' },
        true,
        actorId,
      );

      expect(cashBalance.cancelPostedTransaction).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          transactionId: openingTxnId,
          cancelledByUserId: actorId,
          cancelReason: expect.stringContaining(
            'from 1000.00 to 500.00',
          ) as string,
        }),
      );
      expect(cashBalance.applyPostedTransaction).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          type: 'OPENING_BALANCE',
          amount: '500.00',
          direction: 'IN',
          notes: expect.stringContaining('from 1000.00 to 500.00') as string,
        }),
      );
      expect(prisma.cashAccount.update).not.toHaveBeenCalled();
      expect(result.openingBalance).toBe('500.00');
    });

    it('posts opening balance when Super Admin sets it on a zero-opening account', async () => {
      prisma.cashAccount.findUnique.mockResolvedValue({
        ...baseAccount,
        currentBalance: new Decimal('0.00'),
      });
      prisma.cashAccount.findUniqueOrThrow.mockResolvedValue({
        ...baseAccount,
        currentBalance: new Decimal('250.00'),
      });
      prisma.cashTransaction.findFirst.mockResolvedValue(null);
      prisma.cashTransaction.findMany.mockResolvedValue([
        {
          cashAccountId: accountId,
          amount: new Decimal('250.00'),
        },
      ]);
      cashBalance.applyPostedTransaction.mockResolvedValue({
        id: 'txn-3',
        balanceAfter: '250.00',
      });

      const result = await service.update(
        accountId,
        { openingBalance: '250.00' },
        true,
        actorId,
      );

      expect(cashBalance.cancelPostedTransaction).not.toHaveBeenCalled();
      expect(cashBalance.applyPostedTransaction).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          type: 'OPENING_BALANCE',
          amount: '250.00',
        }),
      );
      expect(result.openingBalance).toBe('250.00');
    });

    it('skips balance mutation when Super Admin resubmits the same opening', async () => {
      prisma.cashAccount.findUnique.mockResolvedValue(baseAccount);
      prisma.cashAccount.findUniqueOrThrow.mockResolvedValue(baseAccount);
      prisma.cashTransaction.findFirst.mockResolvedValue({
        id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
        amount: new Decimal('1000.00'),
      });
      prisma.cashTransaction.findMany.mockResolvedValue([
        {
          cashAccountId: accountId,
          amount: new Decimal('1000.00'),
        },
      ]);

      await service.update(
        accountId,
        { openingBalance: '1000.00' },
        true,
        actorId,
      );

      expect(cashBalance.cancelPostedTransaction).not.toHaveBeenCalled();
      expect(cashBalance.applyPostedTransaction).not.toHaveBeenCalled();
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
