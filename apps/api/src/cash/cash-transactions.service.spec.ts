import { NotFoundException } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/client';
import { CashTransactionsService } from './cash-transactions.service';

describe('CashTransactionsService', () => {
  const actorId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const accountId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  const txnId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
  const categoryId = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
  const partnerId = 'ffffffff-ffff-4fff-8fff-ffffffffffff';
  const saleId = '11111111-1111-4111-8111-111111111111';
  const purchaseId = '22222222-2222-4222-8222-222222222222';
  const debtMovementId = '33333333-3333-4333-8333-333333333333';
  const reversalTxnId = '44444444-4444-4444-8444-444444444444';

  const baseTxn = {
    id: txnId,
    transactionNumber: 'CSH-0000001',
    cashAccountId: accountId,
    direction: 'IN',
    type: 'CUSTOMER_RECEIPT',
    status: 'POSTED',
    amount: new Decimal('50.00'),
    balanceBefore: new Decimal('100.00'),
    balanceAfter: new Decimal('150.00'),
    transactionDate: new Date('2026-08-01T10:00:00.000Z'),
    notes: null as string | null,
    negativeBalanceOverrideReason: null as string | null,
    cancelReason: null as string | null,
    expenseCategoryId: null as string | null,
    partnerId: null as string | null,
    saleId: null as string | null,
    purchaseId: null as string | null,
    cashTransferId: null as string | null,
    createdByUserId: actorId,
    createdAt: new Date('2026-08-01T10:00:00.000Z'),
    cashAccount: { name: 'Ofis kassası' },
    expenseCategory: null as { name: string } | null,
    partner: null as { name: string } | null,
    createdBy: { fullName: 'Test User' },
  };

  const prisma = {
    $transaction: jest.fn(),
    cashTransaction: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    cashTransfer: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    businessPartner: {
      findUnique: jest.fn(),
    },
    sale: {
      findUnique: jest.fn(),
    },
    purchase: {
      findUnique: jest.fn(),
    },
    $queryRaw: jest.fn(),
  };

  const cashBalance = {
    applyPostedTransaction: jest.fn(),
    cancelPostedTransaction: jest.fn(),
  };

  const expenseCategories = {
    assertActiveCategory: jest.fn().mockResolvedValue(undefined),
  };

  const partnerDebt = {
    applyChange: jest.fn(),
  };

  const numberSequences = {
    nextCode: jest.fn().mockResolvedValue('0000001'),
  };

  let service: CashTransactionsService;

  beforeEach(() => {
    jest.clearAllMocks();
    expenseCategories.assertActiveCategory.mockResolvedValue(undefined);
    numberSequences.nextCode.mockResolvedValue('0000001');
    service = new CashTransactionsService(
      prisma as never,
      cashBalance as never,
      expenseCategories as never,
      partnerDebt as never,
      numberSequences as never,
    );
  });

  describe('cashIn', () => {
    it('posts CUSTOMER_RECEIPT with partner debt decrease', async () => {
      prisma.businessPartner.findUnique.mockResolvedValue({
        id: partnerId,
        isActive: true,
      });
      cashBalance.applyPostedTransaction.mockResolvedValue({ id: txnId });
      partnerDebt.applyChange.mockResolvedValue({});
      prisma.$transaction.mockImplementation(
        async (fn: (tx: unknown) => Promise<unknown>) => fn({}),
      );
      prisma.cashTransaction.findUnique.mockResolvedValue({
        ...baseTxn,
        partnerId,
        partner: { name: 'Müştəri A' },
        type: 'CUSTOMER_RECEIPT',
      });

      const result = await service.cashIn(
        {
          cashAccountId: accountId,
          partnerId,
          amount: '50.00',
          transactionDate: new Date('2026-08-01'),
        },
        actorId,
      );

      expect(cashBalance.applyPostedTransaction).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          direction: 'IN',
          type: 'CUSTOMER_RECEIPT',
          partnerId,
          amount: '50.00',
        }),
      );
      expect(partnerDebt.applyChange).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          partnerId,
          kind: 'CASH_RECEIPT',
        }),
      );
      expect(result.balanceAfter).toBe('150.00');
      expect(result.partnerName).toBe('Müştəri A');
    });
  });

  describe('cashOut', () => {
    it('posts SUPPLIER_PAYMENT with partner debt increase', async () => {
      const outTxn = {
        ...baseTxn,
        direction: 'OUT',
        type: 'SUPPLIER_PAYMENT',
        partnerId,
        partner: { name: 'Təchizatçı B' },
        balanceBefore: new Decimal('100.00'),
        balanceAfter: new Decimal('50.00'),
        amount: new Decimal('50.00'),
      };
      prisma.businessPartner.findUnique.mockResolvedValue({
        id: partnerId,
        isActive: true,
      });
      cashBalance.applyPostedTransaction.mockResolvedValue({ id: txnId });
      partnerDebt.applyChange.mockResolvedValue({});
      prisma.$transaction.mockImplementation(
        async (fn: (tx: unknown) => Promise<unknown>) => fn({}),
      );
      prisma.cashTransaction.findUnique.mockResolvedValue(outTxn);

      const result = await service.cashOut(
        {
          cashAccountId: accountId,
          partnerId,
          amount: '50.00',
          transactionDate: new Date('2026-08-01'),
          negativeBalanceOverrideReason: undefined,
        },
        actorId,
      );

      expect(cashBalance.applyPostedTransaction).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          direction: 'OUT',
          type: 'SUPPLIER_PAYMENT',
          partnerId,
        }),
      );
      expect(partnerDebt.applyChange).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          partnerId,
          kind: 'CASH_PAYMENT',
        }),
      );
      expect(result.direction).toBe('OUT');
    });
  });

  describe('expense', () => {
    it('asserts active category, posts EXPENSE out, no partner fields', async () => {
      const expenseTxn = {
        ...baseTxn,
        direction: 'OUT',
        type: 'EXPENSE',
        amount: new Decimal('25.00'),
        balanceBefore: new Decimal('100.00'),
        balanceAfter: new Decimal('75.00'),
        expenseCategoryId: categoryId,
        expenseCategory: { name: 'Ofis' },
        notes: 'Ofis icarəsi',
      };
      cashBalance.applyPostedTransaction.mockResolvedValue({ id: txnId });
      prisma.$transaction.mockImplementation(
        async (fn: (tx: unknown) => Promise<unknown>) => fn({}),
      );
      prisma.cashTransaction.findUnique.mockResolvedValue(expenseTxn);

      const result = await service.expense(
        {
          cashAccountId: accountId,
          expenseCategoryId: categoryId,
          amount: '25.00',
          transactionDate: new Date('2026-08-01'),
          notes: 'Ofis icarəsi',
        },
        actorId,
      );

      expect(expenseCategories.assertActiveCategory).toHaveBeenCalledWith(
        categoryId,
      );
      expect(cashBalance.applyPostedTransaction).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          direction: 'OUT',
          type: 'EXPENSE',
          expenseCategoryId: categoryId,
          notes: 'Ofis icarəsi',
        }),
      );
      expect(result.type).toBe('EXPENSE');
      expect(result.expenseCategoryName).toBe('Ofis');
      expect(result.partnerId).toBeNull();
    });

    it('rejects inactive category before posting', async () => {
      expenseCategories.assertActiveCategory.mockRejectedValue(
        new NotFoundException({ code: 'EXPENSE_CATEGORY_INACTIVE' }),
      );

      await expect(
        service.expense(
          {
            cashAccountId: accountId,
            expenseCategoryId: categoryId,
            amount: '10.00',
            transactionDate: new Date('2026-08-01'),
            notes: 'Yanacaq',
          },
          actorId,
        ),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(cashBalance.applyPostedTransaction).not.toHaveBeenCalled();
    });
  });

  describe('customerReceipt', () => {
    const receiptTxn = {
      ...baseTxn,
      direction: 'IN',
      type: 'CUSTOMER_RECEIPT',
      partnerId,
      amount: new Decimal('200.00'),
      balanceBefore: new Decimal('100.00'),
      balanceAfter: new Decimal('300.00'),
    };

    beforeEach(() => {
      prisma.businessPartner.findUnique.mockResolvedValue({
        id: partnerId,
        isActive: true,
      });
      cashBalance.applyPostedTransaction.mockResolvedValue({ id: txnId });
      partnerDebt.applyChange.mockResolvedValue({ movementId: debtMovementId });
      prisma.$transaction.mockImplementation(
        async (fn: (tx: unknown) => Promise<unknown>) => fn({}),
      );
      prisma.cashTransaction.findUnique.mockResolvedValue(receiptTxn);
    });

    it('posts CUSTOMER_RECEIPT IN and applies negative partner debt change', async () => {
      const result = await service.customerReceipt(
        {
          cashAccountId: accountId,
          partnerId,
          amount: '200.00',
          transactionDate: new Date('2026-08-01'),
        },
        actorId,
      );

      expect(cashBalance.applyPostedTransaction).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          direction: 'IN',
          type: 'CUSTOMER_RECEIPT',
          amount: '200.00',
          partnerId,
          saleId: null,
        }),
      );
      expect(partnerDebt.applyChange).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          partnerId,
          kind: 'CASH_RECEIPT',
          cashTransactionId: txnId,
          saleId: null,
        }),
      );
      // signed amount must be negative (customer owes less)
      const callArgs = partnerDebt.applyChange.mock.calls[0][1] as {
        signedAmount: { isNegative: () => boolean };
      };
      expect(callArgs.signedAmount.isNegative()).toBe(true);
      expect(result.type).toBe('CUSTOMER_RECEIPT');
    });

    it('passes saleId through when provided and validates partner match', async () => {
      prisma.sale.findUnique.mockResolvedValue({
        id: saleId,
        partnerId,
      });

      await service.customerReceipt(
        {
          cashAccountId: accountId,
          partnerId,
          amount: '200.00',
          transactionDate: new Date('2026-08-01'),
          saleId,
        },
        actorId,
      );

      expect(cashBalance.applyPostedTransaction).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ saleId }),
      );
      expect(partnerDebt.applyChange).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ saleId }),
      );
      expect(partnerDebt.applyChange).toHaveBeenCalledTimes(1);
    });

    it('throws when saleId partner does not match', async () => {
      prisma.sale.findUnique.mockResolvedValue({
        id: saleId,
        partnerId: 'different-partner',
      });

      await expect(
        service.customerReceipt(
          {
            cashAccountId: accountId,
            partnerId,
            amount: '200.00',
            transactionDate: new Date('2026-08-01'),
            saleId,
          },
          actorId,
        ),
      ).rejects.toMatchObject({ response: { code: 'SALE_PARTNER_MISMATCH' } });
      expect(cashBalance.applyPostedTransaction).not.toHaveBeenCalled();
    });

    it('throws when partner is inactive', async () => {
      prisma.businessPartner.findUnique.mockResolvedValue({
        id: partnerId,
        isActive: false,
      });

      await expect(
        service.customerReceipt(
          {
            cashAccountId: accountId,
            partnerId,
            amount: '200.00',
            transactionDate: new Date('2026-08-01'),
          },
          actorId,
        ),
      ).rejects.toMatchObject({
        response: { code: 'BUSINESS_PARTNER_INACTIVE' },
      });
      expect(cashBalance.applyPostedTransaction).not.toHaveBeenCalled();
    });

    it('throws when partner not found', async () => {
      prisma.businessPartner.findUnique.mockResolvedValue(null);

      await expect(
        service.customerReceipt(
          {
            cashAccountId: accountId,
            partnerId,
            amount: '200.00',
            transactionDate: new Date('2026-08-01'),
          },
          actorId,
        ),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(cashBalance.applyPostedTransaction).not.toHaveBeenCalled();
    });

    it('throws when sale not found', async () => {
      prisma.sale.findUnique.mockResolvedValue(null);

      await expect(
        service.customerReceipt(
          {
            cashAccountId: accountId,
            partnerId,
            amount: '100.00',
            transactionDate: new Date('2026-08-01'),
            saleId,
          },
          actorId,
        ),
      ).rejects.toMatchObject({ response: { code: 'SALE_NOT_FOUND' } });
    });
  });

  describe('supplierPayment', () => {
    const paymentTxn = {
      ...baseTxn,
      direction: 'OUT',
      type: 'SUPPLIER_PAYMENT',
      partnerId,
      amount: new Decimal('500.00'),
      balanceBefore: new Decimal('1000.00'),
      balanceAfter: new Decimal('500.00'),
    };

    beforeEach(() => {
      prisma.businessPartner.findUnique.mockResolvedValue({
        id: partnerId,
        isActive: true,
      });
      cashBalance.applyPostedTransaction.mockResolvedValue({ id: txnId });
      partnerDebt.applyChange.mockResolvedValue({ movementId: debtMovementId });
      prisma.$transaction.mockImplementation(
        async (fn: (tx: unknown) => Promise<unknown>) => fn({}),
      );
      prisma.cashTransaction.findUnique.mockResolvedValue(paymentTxn);
    });

    it('posts SUPPLIER_PAYMENT OUT and applies positive partner debt change', async () => {
      const result = await service.supplierPayment(
        {
          cashAccountId: accountId,
          partnerId,
          amount: '500.00',
          transactionDate: new Date('2026-08-01'),
        },
        actorId,
      );

      expect(cashBalance.applyPostedTransaction).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          direction: 'OUT',
          type: 'SUPPLIER_PAYMENT',
          amount: '500.00',
          partnerId,
          purchaseId: null,
        }),
      );
      expect(partnerDebt.applyChange).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          partnerId,
          kind: 'CASH_PAYMENT',
          cashTransactionId: txnId,
          purchaseId: null,
        }),
      );
      // signed amount must be positive
      const callArgs = partnerDebt.applyChange.mock.calls[0][1] as {
        signedAmount: { isPositive: () => boolean };
      };
      expect(callArgs.signedAmount.isPositive()).toBe(true);
      expect(result.type).toBe('SUPPLIER_PAYMENT');
    });

    it('passes purchaseId through when provided and validates partner match', async () => {
      prisma.purchase.findUnique.mockResolvedValue({
        id: purchaseId,
        partnerId,
      });

      await service.supplierPayment(
        {
          cashAccountId: accountId,
          partnerId,
          amount: '500.00',
          transactionDate: new Date('2026-08-01'),
          purchaseId,
        },
        actorId,
      );

      expect(cashBalance.applyPostedTransaction).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ purchaseId }),
      );
      expect(partnerDebt.applyChange).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ purchaseId }),
      );
    });

    it('throws when purchaseId partner does not match', async () => {
      prisma.purchase.findUnique.mockResolvedValue({
        id: purchaseId,
        partnerId: 'other-partner',
      });

      await expect(
        service.supplierPayment(
          {
            cashAccountId: accountId,
            partnerId,
            amount: '500.00',
            transactionDate: new Date('2026-08-01'),
            purchaseId,
          },
          actorId,
        ),
      ).rejects.toMatchObject({
        response: { code: 'PURCHASE_PARTNER_MISMATCH' },
      });
      expect(cashBalance.applyPostedTransaction).not.toHaveBeenCalled();
    });

    it('throws when purchase not found', async () => {
      prisma.purchase.findUnique.mockResolvedValue(null);

      await expect(
        service.supplierPayment(
          {
            cashAccountId: accountId,
            partnerId,
            amount: '500.00',
            transactionDate: new Date('2026-08-01'),
            purchaseId,
          },
          actorId,
        ),
      ).rejects.toMatchObject({ response: { code: 'PURCHASE_NOT_FOUND' } });
    });

    it('passes negativeBalanceOverrideReason through', async () => {
      await service.supplierPayment(
        {
          cashAccountId: accountId,
          partnerId,
          amount: '500.00',
          transactionDate: new Date('2026-08-01'),
          negativeBalanceOverrideReason: 'Overdraft approved',
        },
        actorId,
      );

      expect(cashBalance.applyPostedTransaction).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          negativeBalanceOverrideReason: 'Overdraft approved',
        }),
      );
    });
  });

  describe('cancel', () => {
    function mockCancelTx(original: {
      type: string;
      partnerId: string | null;
    }, debtMovement: { id: string; signedAmount: Decimal } | null = null) {
      return {
        cashTransaction: {
          findUnique: jest.fn().mockResolvedValue(original),
        },
        businessPartnerDebtMovement: {
          findFirst: jest.fn().mockResolvedValue(debtMovement),
        },
      };
    }

    it('calls cancelPostedTransaction and returns reversal for non-partner type', async () => {
      const reversal = {
        ...baseTxn,
        id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
        transactionNumber: 'CSH-0000002',
        type: 'REVERSAL',
        direction: 'OUT',
        balanceBefore: new Decimal('150.00'),
        balanceAfter: new Decimal('100.00'),
      };
      prisma.cashTransaction.findUnique
        .mockResolvedValueOnce({ cashTransferId: null })
        .mockResolvedValueOnce(reversal);
      cashBalance.cancelPostedTransaction.mockResolvedValue({
        id: reversal.id,
      });
      prisma.$transaction.mockImplementation(
        async (fn: (tx: unknown) => Promise<unknown>) =>
          fn(mockCancelTx({ type: 'OTHER_INCOME', partnerId: null })),
      );

      const result = await service.cancel(
        txnId,
        { reason: 'Səhv məbləğ' },
        actorId,
      );

      expect(cashBalance.cancelPostedTransaction).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          transactionId: txnId,
          cancelReason: 'Səhv məbləğ',
        }),
      );
      expect(partnerDebt.applyChange).not.toHaveBeenCalled();
      expect(result.type).toBe('REVERSAL');
    });

    it('reverses partner debt when cancelling CUSTOMER_RECEIPT', async () => {
      const reversalResult = {
        ...baseTxn,
        id: reversalTxnId,
        type: 'REVERSAL',
        direction: 'OUT',
        partnerId,
      };
      prisma.cashTransaction.findUnique
        .mockResolvedValueOnce({ cashTransferId: null })
        .mockResolvedValueOnce(reversalResult);
      cashBalance.cancelPostedTransaction.mockResolvedValue({
        id: reversalTxnId,
      });
      partnerDebt.applyChange.mockResolvedValue({ movementId: 'rev-mvmt-id' });

      const mockTx = mockCancelTx(
        { type: 'CUSTOMER_RECEIPT', partnerId },
        {
          id: debtMovementId,
          signedAmount: new Decimal('-200.00'),
        },
      );
      prisma.$transaction.mockImplementation(
        async (fn: (tx: unknown) => Promise<unknown>) => fn(mockTx),
      );

      await service.cancel(txnId, { reason: 'Ləğv edildi' }, actorId);

      expect(partnerDebt.applyChange).toHaveBeenCalledWith(
        mockTx,
        expect.objectContaining({
          partnerId,
          kind: 'REVERSAL',
          reversalOfId: debtMovementId,
          cashTransactionId: reversalTxnId,
          reason: 'Ləğv edildi',
        }),
      );
      const callArgs = partnerDebt.applyChange.mock.calls[0][1] as {
        signedAmount: { isPositive: () => boolean };
      };
      expect(callArgs.signedAmount.isPositive()).toBe(true);
    });

    it('reverses partner debt when cancelling SUPPLIER_PAYMENT', async () => {
      const reversalResult = {
        ...baseTxn,
        id: reversalTxnId,
        type: 'REVERSAL',
        direction: 'IN',
        partnerId,
      };
      prisma.cashTransaction.findUnique
        .mockResolvedValueOnce({ cashTransferId: null })
        .mockResolvedValueOnce(reversalResult);
      cashBalance.cancelPostedTransaction.mockResolvedValue({
        id: reversalTxnId,
      });
      partnerDebt.applyChange.mockResolvedValue({ movementId: 'rev-mvmt-2' });

      const mockTx = mockCancelTx(
        { type: 'SUPPLIER_PAYMENT', partnerId },
        {
          id: debtMovementId,
          signedAmount: new Decimal('500.00'),
        },
      );
      prisma.$transaction.mockImplementation(
        async (fn: (tx: unknown) => Promise<unknown>) => fn(mockTx),
      );

      await service.cancel(txnId, { reason: 'Ödəniş ləğv' }, actorId);

      expect(partnerDebt.applyChange).toHaveBeenCalledWith(
        mockTx,
        expect.objectContaining({
          partnerId,
          kind: 'REVERSAL',
          reversalOfId: debtMovementId,
        }),
      );
      const callArgs = partnerDebt.applyChange.mock.calls[0][1] as {
        signedAmount: { isNegative: () => boolean };
      };
      expect(callArgs.signedAmount.isNegative()).toBe(true);
    });

    it('skips debt reversal if no debt movement found for CUSTOMER_RECEIPT', async () => {
      const reversalResult = {
        ...baseTxn,
        id: reversalTxnId,
        type: 'REVERSAL',
        partnerId,
      };
      prisma.cashTransaction.findUnique
        .mockResolvedValueOnce({ cashTransferId: null })
        .mockResolvedValueOnce(reversalResult);
      cashBalance.cancelPostedTransaction.mockResolvedValue({
        id: reversalTxnId,
      });

      const mockTx = mockCancelTx(
        { type: 'CUSTOMER_RECEIPT', partnerId },
        null,
      );
      prisma.$transaction.mockImplementation(
        async (fn: (tx: unknown) => Promise<unknown>) => fn(mockTx),
      );

      await service.cancel(txnId, { reason: 'Test' }, actorId);
      expect(partnerDebt.applyChange).not.toHaveBeenCalled();
    });

    it('cancels expense without partner debt change', async () => {
      const reversal = {
        ...baseTxn,
        id: reversalTxnId,
        type: 'REVERSAL',
        direction: 'IN',
      };
      prisma.cashTransaction.findUnique
        .mockResolvedValueOnce({ cashTransferId: null })
        .mockResolvedValueOnce(reversal);
      cashBalance.cancelPostedTransaction.mockResolvedValue({
        id: reversalTxnId,
      });
      prisma.$transaction.mockImplementation(
        async (fn: (tx: unknown) => Promise<unknown>) =>
          fn(mockCancelTx({ type: 'EXPENSE', partnerId: null })),
      );

      await service.cancel(txnId, { reason: 'Xərc səhv' }, actorId);
      expect(cashBalance.cancelPostedTransaction).toHaveBeenCalled();
      expect(partnerDebt.applyChange).not.toHaveBeenCalled();
    });

    it('cancels transfer aggregate: both legs reversed and double cancel blocked', async () => {
      const transferId = '55555555-5555-4555-8555-555555555555';
      const outLegId = '66666666-6666-4666-8666-666666666666';
      const inLegId = '77777777-7777-4777-8777-777777777777';

      prisma.cashTransfer.findUnique
        .mockResolvedValueOnce({
          id: transferId,
          status: 'POSTED',
          legs: [
            { id: outLegId, status: 'POSTED' },
            { id: inLegId, status: 'POSTED' },
          ],
        })
        .mockResolvedValueOnce({
          id: transferId,
          transferNumber: 'CTR-0000001',
          sourceCashAccountId: accountId,
          destinationCashAccountId: '88888888-8888-4888-8888-888888888888',
          amount: new Decimal('25.00'),
          transactionDate: new Date('2026-08-01T10:00:00.000Z'),
          notes: null,
          status: 'CANCELLED',
          negativeBalanceOverrideReason: null,
          cancelReason: 'Səhv transfer',
          createdByUserId: actorId,
          createdAt: new Date('2026-08-01T10:00:00.000Z'),
          sourceCashAccount: { name: 'Ofis', currentBalance: new Decimal('100') },
          destinationCashAccount: {
            name: 'Anbar',
            currentBalance: new Decimal('50'),
          },
          legs: [
            {
              id: outLegId,
              type: 'TRANSFER_OUT',
              transactionNumber: 'CSH-1',
              balanceBefore: new Decimal('125'),
              balanceAfter: new Decimal('100'),
            },
            {
              id: inLegId,
              type: 'TRANSFER_IN',
              transactionNumber: 'CSH-2',
              balanceBefore: new Decimal('25'),
              balanceAfter: new Decimal('50'),
            },
          ],
        });
      prisma.cashTransfer.updateMany.mockResolvedValue({ count: 1 });
      cashBalance.cancelPostedTransaction.mockResolvedValue({ id: 'rev' });
      prisma.$transaction.mockImplementation(
        async (fn: (tx: unknown) => Promise<unknown>) =>
          fn({
            cashTransfer: {
              findUnique: prisma.cashTransfer.findUnique,
              updateMany: prisma.cashTransfer.updateMany,
            },
          }),
      );

      const result = await service.cancelTransfer(
        transferId,
        { reason: 'Səhv transfer' },
        actorId,
      );

      expect(prisma.cashTransfer.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: transferId, status: 'POSTED' },
        }),
      );
      expect(cashBalance.cancelPostedTransaction).toHaveBeenCalledTimes(2);
      expect(cashBalance.cancelPostedTransaction).toHaveBeenNthCalledWith(
        1,
        expect.anything(),
        expect.objectContaining({ transactionId: outLegId }),
      );
      expect(cashBalance.cancelPostedTransaction).toHaveBeenNthCalledWith(
        2,
        expect.anything(),
        expect.objectContaining({ transactionId: inLegId }),
      );
      expect(partnerDebt.applyChange).not.toHaveBeenCalled();
      expect(result.status).toBe('CANCELLED');

      prisma.cashTransfer.updateMany.mockResolvedValue({ count: 0 });
      prisma.cashTransfer.findUnique.mockResolvedValueOnce({
        id: transferId,
        status: 'CANCELLED',
        legs: [],
      });
      prisma.$transaction.mockImplementation(
        async (fn: (tx: unknown) => Promise<unknown>) =>
          fn({
            cashTransfer: {
              findUnique: prisma.cashTransfer.findUnique,
              updateMany: prisma.cashTransfer.updateMany,
            },
          }),
      );
      await expect(
        service.cancelTransfer(transferId, { reason: 'Yenidən' }, actorId),
      ).rejects.toMatchObject({
        response: { code: 'CASH_TRANSFER_NOT_POSTED' },
      });
    });

    it('delegates transfer-leg cancel to cancelTransfer', async () => {
      const transferId = '55555555-5555-4555-8555-555555555555';
      prisma.cashTransaction.findUnique.mockResolvedValueOnce({
        cashTransferId: transferId,
      });
      const cancelTransferSpy = jest
        .spyOn(service, 'cancelTransfer')
        .mockResolvedValue({
          id: transferId,
          transferNumber: 'CTR-1',
          status: 'CANCELLED',
        } as never);
      prisma.cashTransaction.findFirst.mockResolvedValue({ id: reversalTxnId });
      prisma.cashTransaction.findUnique.mockResolvedValueOnce({
        ...baseTxn,
        id: reversalTxnId,
        type: 'REVERSAL',
      });

      await service.cancel(txnId, { reason: 'Transfer ləğv' }, actorId);
      expect(cancelTransferSpy).toHaveBeenCalledWith(
        transferId,
        { reason: 'Transfer ləğv' },
        actorId,
      );
      cancelTransferSpy.mockRestore();
    });

    it('throws when transaction not found before cancel', async () => {
      prisma.cashTransaction.findUnique.mockResolvedValue(null);

      await expect(
        service.cancel(txnId, { reason: 'Test' }, actorId),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });
  });

  describe('getById / list', () => {
    it('throws when transaction missing', async () => {
      prisma.cashTransaction.findUnique.mockResolvedValue(null);
      await expect(service.getById(txnId)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('lists with filters and pagination', async () => {
      prisma.cashTransaction.findMany.mockResolvedValue([baseTxn]);
      prisma.cashTransaction.count.mockResolvedValue(1);

      const result = await service.list({
        page: 1,
        pageSize: 20,
        cashAccountId: accountId,
        direction: 'IN',
        status: 'POSTED',
      });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(prisma.cashTransaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            cashAccountId: accountId,
            direction: 'IN',
            status: 'POSTED',
          }) as object,
        }),
      );
    });
  });
});
