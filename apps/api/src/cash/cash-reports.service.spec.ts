import { NotFoundException } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/client';
import { CashReportsService } from './cash-reports.service';

describe('CashReportsService', () => {
  const accountId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

  const prisma = {
    cashAccount: {
      findUnique: jest.fn(),
      aggregate: jest.fn(),
      count: jest.fn(),
    },
    cashTransaction: {
      findMany: jest.fn(),
      aggregate: jest.fn(),
      count: jest.fn(),
    },
  };

  let service: CashReportsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new CashReportsService(prisma as never);
  });

  describe('getAccountStatement', () => {
    it('builds opening/running/closing including cancelled + reversal pair', async () => {
      prisma.cashAccount.findUnique.mockResolvedValue({
        id: accountId,
        name: 'Ofis',
        code: 'CSH-ACC-1',
        currentBalance: new Decimal('80.00'),
      });
      // Prior Posted IN 100
      prisma.cashTransaction.findMany
        .mockResolvedValueOnce([
          { direction: 'IN', amount: new Decimal('100.00') },
        ])
        .mockResolvedValueOnce([
          {
            id: 't1',
            transactionNumber: 'CSH-1',
            transactionDate: new Date('2026-08-02T10:00:00.000Z'),
            type: 'EXPENSE',
            direction: 'OUT',
            status: 'POSTED',
            amount: new Decimal('20.00'),
            notes: null,
            cancelReason: null,
            saleId: null,
            purchaseId: null,
            partner: null,
            expenseCategory: { name: 'Kirayə' },
          },
          {
            id: 't2',
            transactionNumber: 'CSH-2',
            transactionDate: new Date('2026-08-02T11:00:00.000Z'),
            type: 'CUSTOMER_RECEIPT',
            direction: 'IN',
            status: 'CANCELLED',
            amount: new Decimal('50.00'),
            notes: null,
            cancelReason: 'Səhv',
            saleId: null,
            purchaseId: null,
            partner: { name: 'Müştəri' },
            expenseCategory: null,
          },
          {
            id: 't3',
            transactionNumber: 'CSH-3',
            transactionDate: new Date('2026-08-02T11:05:00.000Z'),
            type: 'REVERSAL',
            direction: 'OUT',
            status: 'POSTED',
            amount: new Decimal('50.00'),
            notes: 'Səhv',
            cancelReason: null,
            saleId: null,
            purchaseId: null,
            partner: null,
            expenseCategory: null,
          },
        ]);

      const result = await service.getAccountStatement(accountId, {
        dateFrom: new Date('2026-08-02T00:00:00.000Z'),
        dateTo: new Date('2026-08-02T23:59:59.999Z'),
      });

      expect(result.openingBalance).toBe('100.00');
      expect(result.lines).toHaveLength(3);
      expect(result.lines[0].runningBalance).toBe('80.00');
      // Cancelled original still shows +50 effect; reversal then -50 → net zero.
      expect(result.lines[1].signedEffect).toBe('50.00');
      expect(result.lines[1].runningBalance).toBe('130.00');
      expect(result.lines[2].signedEffect).toBe('-50.00');
      expect(result.closingBalance).toBe('80.00');
    });

    it('throws when account missing', async () => {
      prisma.cashAccount.findUnique.mockResolvedValue(null);
      await expect(
        service.getAccountStatement(accountId, {}),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('getPeriodSummary', () => {
    it('excludes transfers and reversals from income/expense turnover', async () => {
      prisma.cashAccount.findUnique.mockResolvedValue({ id: accountId });
      prisma.cashTransaction.findMany
        .mockResolvedValueOnce([
          {
            type: 'CUSTOMER_RECEIPT',
            amount: new Decimal('200.00'),
            expenseCategoryId: null,
            expenseCategory: null,
          },
          {
            type: 'SUPPLIER_PAYMENT',
            amount: new Decimal('40.00'),
            expenseCategoryId: null,
            expenseCategory: null,
          },
          {
            type: 'EXPENSE',
            amount: new Decimal('30.00'),
            expenseCategoryId: 'cat-1',
            expenseCategory: { name: 'Kirayə' },
          },
        ])
        .mockResolvedValueOnce([
          {
            amount: new Decimal('30.00'),
            expenseCategoryId: 'cat-1',
            expenseCategory: { name: 'Kirayə' },
          },
        ]);
      prisma.cashTransaction.aggregate.mockResolvedValue({
        _sum: { amount: new Decimal('75.00') },
      });
      prisma.cashTransaction.count
        .mockResolvedValueOnce(2)
        .mockResolvedValueOnce(1);
      prisma.cashAccount.aggregate.mockResolvedValue({
        _sum: { currentBalance: new Decimal('500.00') },
        _count: { _all: 3 },
      });
      prisma.cashAccount.count.mockResolvedValue(1);

      const result = await service.getPeriodSummary({
        cashAccountId: accountId,
      });

      expect(result.cashInTotal).toBe('200.00');
      expect(result.cashOutTotal).toBe('40.00');
      expect(result.expenseTotal).toBe('30.00');
      expect(result.partnerCashInTotal).toBe('200.00');
      expect(result.partnerCashOutTotal).toBe('40.00');
      expect(result.transferTotal).toBe('75.00');
      expect(result.cancelledCount).toBe(2);
      expect(result.reversalCount).toBe(1);
      expect(result.negativeAccountCount).toBe(1);
      expect(result.totalCompanyCash).toBe('500.00');
      expect(result.expensesByCategory).toEqual([
        {
          expenseCategoryId: 'cat-1',
          expenseCategoryName: 'Kirayə',
          total: '30.00',
        },
      ]);
    });
  });
});
