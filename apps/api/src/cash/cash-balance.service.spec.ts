import { ConflictException } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/client';
import {
  CashBalanceService,
  CashTransactionDirectionValue,
  CashTransactionTypeValue,
} from './cash-balance.service';

describe('CashBalanceService', () => {
  const numberSequences = {
    nextCode: jest.fn().mockResolvedValue('0000001'),
  };
  const prisma = {} as never;

  const service = new CashBalanceService(prisma, numberSequences as never);

  function mockTx(account: {
    id: string;
    currentBalance: Decimal;
    isActive: boolean;
  }) {
    return {
      $queryRaw: jest
        .fn()
        .mockImplementation((strings: TemplateStringsArray) => {
          const sql = strings.join(' ');
          if (sql.includes('"CashAccount"')) {
            return Promise.resolve([
              {
                id: account.id,
                currentBalance: account.currentBalance,
                isActive: account.isActive,
              },
            ]);
          }
          return Promise.resolve([]);
        }),
      cashAccount: {
        update: jest.fn().mockImplementation(({ data }) => {
          account.currentBalance = data.currentBalance;
          return Promise.resolve(undefined);
        }),
      },
      cashTransaction: {
        create: jest.fn().mockImplementation(({ data }) =>
          Promise.resolve({
            id: 'txn-1',
            transactionNumber: data.transactionNumber,
            cashAccountId: data.cashAccountId,
            direction: data.direction,
            type: data.type,
            amount: data.amount,
            balanceBefore: data.balanceBefore,
            balanceAfter: data.balanceAfter,
            transactionDate: data.transactionDate,
            status: data.status,
          }),
        ),
        update: jest.fn(),
      },
    };
  }

  beforeEach(() => {
    numberSequences.nextCode.mockClear();
    numberSequences.nextCode.mockResolvedValue('0000001');
  });

  it('posts Cash In and increases balance with before/after', async () => {
    const account = {
      id: 'acc-1',
      currentBalance: new Decimal('100.00'),
      isActive: true,
    };
    const tx = mockTx(account);

    const result = await service.applyPostedTransaction(tx as never, {
      cashAccountId: 'acc-1',
      direction: CashTransactionDirectionValue.IN,
      type: CashTransactionTypeValue.OTHER_INCOME,
      amount: '50.00',
      transactionDate: new Date('2026-08-01'),
      createdByUserId: 'user-1',
    });

    expect(result.balanceBefore).toBe('100.00');
    expect(result.balanceAfter).toBe('150.00');
    expect(result.transactionNumber).toBe('CSH-0000001');
    expect(account.currentBalance.toFixed(2)).toBe('150.00');
    expect(tx.$queryRaw).toHaveBeenCalled();
  });

  it('blocks Cash Out when insufficient without override reason', async () => {
    const account = {
      id: 'acc-1',
      currentBalance: new Decimal('200.00'),
      isActive: true,
    };
    const tx = mockTx(account);

    await expect(
      service.applyPostedTransaction(tx as never, {
        cashAccountId: 'acc-1',
        direction: CashTransactionDirectionValue.OUT,
        type: CashTransactionTypeValue.OWNER_WITHDRAWAL,
        amount: '350.00',
        transactionDate: new Date(),
        createdByUserId: 'user-1',
      }),
    ).rejects.toMatchObject({
      response: expect.objectContaining({ code: 'CASH_INSUFFICIENT_BALANCE' }),
    });
  });

  it('allows negative Cash Out with override reason', async () => {
    const account = {
      id: 'acc-1',
      currentBalance: new Decimal('100.00'),
      isActive: true,
    };
    const tx = mockTx(account);

    const result = await service.applyPostedTransaction(tx as never, {
      cashAccountId: 'acc-1',
      direction: CashTransactionDirectionValue.OUT,
      type: CashTransactionTypeValue.OWNER_WITHDRAWAL,
      amount: '150.00',
      transactionDate: new Date(),
      createdByUserId: 'user-1',
      negativeBalanceOverrideReason: 'Urgent payment',
    });

    expect(result.balanceAfter).toBe('-50.00');
  });

  it('rejects inactive account for new posts', async () => {
    const account = {
      id: 'acc-1',
      currentBalance: new Decimal('10.00'),
      isActive: false,
    };
    const tx = mockTx(account);

    await expect(
      service.applyPostedTransaction(tx as never, {
        cashAccountId: 'acc-1',
        direction: CashTransactionDirectionValue.IN,
        type: CashTransactionTypeValue.OTHER_INCOME,
        amount: '5.00',
        transactionDate: new Date(),
        createdByUserId: 'user-1',
      }),
    ).rejects.toMatchObject({
      response: expect.objectContaining({ code: 'CASH_ACCOUNT_INACTIVE' }),
    });
  });

  it('cancels Cash In into negative balance without ADR-037 override', async () => {
    // Account spent the Cash In proceeds; balance is below the original receipt.
    const account = {
      id: 'acc-1',
      currentBalance: new Decimal('20.00'),
      isActive: true,
    };
    const tx = mockTx(account);

    tx.$queryRaw = jest
      .fn()
      .mockImplementation((strings: TemplateStringsArray) => {
        const sql = strings.join(' ');
        if (sql.includes('"CashAccount"')) {
          return Promise.resolve([
            {
              id: account.id,
              currentBalance: account.currentBalance,
              isActive: account.isActive,
            },
          ]);
        }
        if (sql.includes('"CashTransaction"')) {
          return Promise.resolve([
            {
              id: 'cash-in-1',
              transactionNumber: 'CSH-0000001',
              cashAccountId: 'acc-1',
              direction: 'IN',
              type: 'CUSTOMER_RECEIPT',
              amount: new Decimal('100.00'),
              status: 'POSTED',
              transactionDate: new Date(),
              reversedById: null,
            },
          ]);
        }
        return Promise.resolve([]);
      });
    tx.cashTransaction.update = jest.fn().mockResolvedValue({});
    numberSequences.nextCode.mockResolvedValueOnce('0000002');

    const reversal = await service.cancelPostedTransaction(tx as never, {
      transactionId: 'cash-in-1',
      cancelReason: 'Səhv mədaxil',
      cancelledByUserId: 'user-1',
    });

    expect(reversal.type).toBe(CashTransactionTypeValue.REVERSAL);
    expect(reversal.direction).toBe(CashTransactionDirectionValue.OUT);
    expect(account.currentBalance.toFixed(2)).toBe('-80.00');
    expect(tx.cashTransaction.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: CashTransactionTypeValue.REVERSAL,
          negativeBalanceOverrideReason: null,
        }),
      }),
    );
  });

  it('still blocks Cash Out creation into negative without override', async () => {
    const account = {
      id: 'acc-1',
      currentBalance: new Decimal('10.00'),
      isActive: true,
    };
    const tx = mockTx(account);

    await expect(
      service.applyPostedTransaction(tx as never, {
        cashAccountId: 'acc-1',
        direction: CashTransactionDirectionValue.OUT,
        type: CashTransactionTypeValue.SUPPLIER_PAYMENT,
        amount: '50.00',
        transactionDate: new Date(),
        createdByUserId: 'user-1',
      }),
    ).rejects.toMatchObject({
      response: expect.objectContaining({ code: 'CASH_INSUFFICIENT_BALANCE' }),
    });
  });

  it('cancels posted transaction with reversal and prevents double cancel', async () => {
    const account = {
      id: 'acc-1',
      currentBalance: new Decimal('150.00'),
      isActive: true,
    };
    const tx = mockTx(account);

    tx.$queryRaw = jest
      .fn()
      .mockImplementation((strings: TemplateStringsArray) => {
        const sql = strings.join(' ');
        if (sql.includes('"CashAccount"')) {
          return Promise.resolve([
            {
              id: account.id,
              currentBalance: account.currentBalance,
              isActive: account.isActive,
            },
          ]);
        }
        if (sql.includes('"CashTransaction"')) {
          return Promise.resolve([
            {
              id: 'orig-1',
              transactionNumber: 'CSH-0000001',
              cashAccountId: 'acc-1',
              direction: 'IN',
              type: 'OTHER_INCOME',
              amount: new Decimal('50.00'),
              status: 'POSTED',
              transactionDate: new Date(),
              reversedById: null,
            },
          ]);
        }
        return Promise.resolve([]);
      });
    tx.cashTransaction.update = jest.fn().mockResolvedValue({});

    numberSequences.nextCode.mockResolvedValueOnce('0000002');

    const reversal = await service.cancelPostedTransaction(tx as never, {
      transactionId: 'orig-1',
      cancelReason: 'Wrong amount',
      cancelledByUserId: 'user-1',
    });

    expect(reversal.type).toBe(CashTransactionTypeValue.REVERSAL);
    expect(account.currentBalance.toFixed(2)).toBe('100.00');

    tx.$queryRaw = jest
      .fn()
      .mockImplementation((strings: TemplateStringsArray) => {
        const sql = strings.join(' ');
        if (sql.includes('"CashTransaction"')) {
          return Promise.resolve([
            {
              id: 'orig-1',
              status: 'CANCELLED',
              type: 'OTHER_INCOME',
              direction: 'IN',
              amount: new Decimal('50.00'),
              cashAccountId: 'acc-1',
              transactionNumber: 'CSH-0000001',
              transactionDate: new Date(),
              reversedById: 'txn-1',
            },
          ]);
        }
        return Promise.resolve([]);
      });

    await expect(
      service.cancelPostedTransaction(tx as never, {
        transactionId: 'orig-1',
        cancelReason: 'again',
        cancelledByUserId: 'user-1',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects cancelling a reversal transaction', async () => {
    const account = {
      id: 'acc-1',
      currentBalance: new Decimal('100.00'),
      isActive: true,
    };
    const tx = mockTx(account);
    tx.$queryRaw = jest.fn().mockResolvedValue([
      {
        id: 'rev-1',
        transactionNumber: 'CSH-0000009',
        cashAccountId: 'acc-1',
        direction: 'OUT',
        type: 'REVERSAL',
        amount: new Decimal('10.00'),
        status: 'POSTED',
        transactionDate: new Date(),
        reversedById: null,
      },
    ]);

    await expect(
      service.cancelPostedTransaction(tx as never, {
        transactionId: 'rev-1',
        cancelReason: 'nope',
        cancelledByUserId: 'user-1',
      }),
    ).rejects.toMatchObject({
      response: expect.objectContaining({
        code: 'CASH_CANNOT_CANCEL_REVERSAL',
      }),
    });
  });

  it('preserves 0.01 decimal precision', async () => {
    const account = {
      id: 'acc-1',
      currentBalance: new Decimal('0.00'),
      isActive: true,
    };
    const tx = mockTx(account);

    const result = await service.applyPostedTransaction(tx as never, {
      cashAccountId: 'acc-1',
      direction: CashTransactionDirectionValue.IN,
      type: CashTransactionTypeValue.OTHER_INCOME,
      amount: '0.01',
      transactionDate: new Date(),
      createdByUserId: 'user-1',
    });

    expect(result.amount).toBe('0.01');
    expect(result.balanceAfter).toBe('0.01');
  });

  it('throws when cash account row is missing under lock', async () => {
    const tx = {
      $queryRaw: jest.fn().mockResolvedValue([]),
      cashAccount: { update: jest.fn() },
      cashTransaction: { create: jest.fn(), update: jest.fn() },
    };

    await expect(
      service.applyPostedTransaction(tx as never, {
        cashAccountId: 'missing',
        direction: CashTransactionDirectionValue.IN,
        type: CashTransactionTypeValue.OTHER_INCOME,
        amount: '1.00',
        transactionDate: new Date(),
        createdByUserId: 'user-1',
      }),
    ).rejects.toMatchObject({
      response: expect.objectContaining({ code: 'CASH_ACCOUNT_NOT_FOUND' }),
    });
  });
});
