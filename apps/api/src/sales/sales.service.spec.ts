import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/client';
import {
  PartnerDebtBalanceService,
  PartnerDebtMovementKind,
} from '../business-partners/partner-debt-balance.service';
import { BusinessCodeSequenceKey } from '../number-sequences/business-code-sequence-key';
import { NumberSequencesService } from '../number-sequences/number-sequences.service';
import {
  ProductQuantityKind,
  ProductQuantityService,
} from '../products/product-quantity.service';
import { DocumentStatusApi } from './dto/document-status.enum';
import { SalesService, recalculateLines } from './sales.service';

describe('recalculateLines', () => {
  it('computes line and document totals from quantity and price', () => {
    const result = recalculateLines(
      [
        {
          quantity: '10.0000',
          unitPrice: '100.0000',
          discountAmount: '50.0000',
        },
      ],
      '50.0000',
    );
    expect(result.subtotalAmount.toFixed(4)).toBe('1000.0000');
    expect(result.lines[0].lineTotal.toFixed(4)).toBe('950.0000');
    expect(result.totalAmount.toFixed(4)).toBe('900.0000');
  });

  it('rejects line discount greater than line subtotal', () => {
    expect(() =>
      recalculateLines([
        { quantity: '1', unitPrice: '10', discountAmount: '20' },
      ]),
    ).toThrow(BadRequestException);
  });
});

describe('SalesService', () => {
  let service: SalesService;

  const numberSequences = {
    nextCode: jest.fn().mockResolvedValue('0000001'),
  };
  const productQuantity = {
    applyChange: jest.fn().mockResolvedValue({}),
  };
  const partnerDebt = {
    applyChange: jest.fn().mockResolvedValue({}),
  };
  const cashBalance = {
    applyPostedTransaction: jest.fn().mockResolvedValue({ id: 'cash-1' }),
  };

  const partner = {
    id: 'partner-1',
    code: '0000001',
    name: 'Müştəri',
    currentDebtBalance: new Decimal('400'),
    isCustomer: true,
    isActive: true,
  };
  const createdBy = { id: 'user-1', username: 'u', fullName: 'User' };
  const item = {
    id: 'item-1',
    productId: 'prod-1',
    unitId: 'unit-1',
    productCodeSnapshot: '0000001',
    productNameSnapshot: 'Parça',
    unitNameSnapshot: 'ədəd',
    quantity: new Decimal('10'),
    unitPrice: new Decimal('100'),
    discountAmount: new Decimal(0),
    lineSubtotal: new Decimal('1000'),
    lineTotal: new Decimal('1000'),
    notes: null,
    costAtPosting: null,
    createdAt: new Date('2026-07-31T00:00:00.000Z'),
  };

  const detail = {
    id: 'sale-1',
    documentNumber: 'SAL-0000001',
    partnerId: 'partner-1',
    partner,
    businessDate: new Date('2026-07-31T00:00:00.000Z'),
    status: DocumentStatusApi.DRAFT,
    subtotalAmount: new Decimal('1000'),
    discountAmount: new Decimal(0),
    totalAmount: new Decimal('1000'),
    notes: null,
    negativeQuantityOverrideReason: null,
    postedAt: null,
    postedByUserId: null,
    postedBy: null,
    cancelledAt: null,
    cancelledByUserId: null,
    cancelledBy: null,
    cancelReason: null,
    createdAt: new Date('2026-07-31T00:00:00.000Z'),
    updatedAt: new Date('2026-07-31T00:00:00.000Z'),
    createdByUserId: 'user-1',
    createdBy,
    items: [item],
    productQuantityHistory: [],
    partnerDebtMovements: [],
    cashTransactions: [],
  };

  const prisma: Record<string, any> = {
    $transaction: jest.fn((fn: (tx: unknown) => unknown) =>
      Promise.resolve(fn(prisma)),
    ),
    sale: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
    },
    businessPartner: { findUnique: jest.fn() },
    product: { findMany: jest.fn(), findUnique: jest.fn() },
    saleItem: { update: jest.fn() },
    businessPartnerDebtMovement: { findFirst: jest.fn() },
    cashTransaction: {
      create: jest.fn(),
      count: jest.fn().mockResolvedValue(0),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.$transaction.mockImplementation((fn: (tx: unknown) => unknown) =>
      Promise.resolve(fn(prisma)),
    );
    numberSequences.nextCode.mockResolvedValue('0000001');
    productQuantity.applyChange.mockResolvedValue({});
    partnerDebt.applyChange.mockResolvedValue({});
    cashBalance.applyPostedTransaction.mockResolvedValue({ id: 'cash-1' });
    prisma.businessPartner.findUnique.mockResolvedValue({
      isActive: true,
      isCustomer: true,
    });
    prisma.product.findMany.mockResolvedValue([
      {
        id: 'prod-1',
        code: '0000001',
        name: 'Parça',
        isActive: true,
        unit: { id: 'unit-1', name: 'ədəd' },
      },
    ]);
    prisma.product.findUnique.mockResolvedValue({
      currentQuantity: new Decimal('100'),
      code: '0000001',
    });
    prisma.sale.create.mockResolvedValue({ id: 'sale-1' });
    prisma.sale.findUnique.mockResolvedValue(detail);
    prisma.sale.updateMany.mockResolvedValue({ count: 1 });
    prisma.sale.update.mockResolvedValue({});
    prisma.saleItem.update.mockResolvedValue({});
    prisma.businessPartnerDebtMovement.findFirst.mockResolvedValue({
      id: 'dm-1',
    });
    prisma.cashTransaction.count.mockResolvedValue(0);

    service = new SalesService(
      prisma as never,
      numberSequences as unknown as NumberSequencesService,
      productQuantity as unknown as ProductQuantityService,
      partnerDebt as unknown as PartnerDebtBalanceService,
      cashBalance as never,
    );
  });

  const createDto = {
    partnerId: 'partner-1',
    businessDate: '2026-07-31',
    items: [
      { productId: 'prod-1', quantity: '10.0000', unitPrice: '100.0000' },
    ],
  };

  it('creates draft without quantity, debt, or cash effects', async () => {
    const result = await service.create('user-1', createDto);
    expect(result.documentNumber).toBe('SAL-0000001');
    expect(result.status).toBe(DocumentStatusApi.DRAFT);
    expect(numberSequences.nextCode).toHaveBeenCalledWith(
      expect.anything(),
      BusinessCodeSequenceKey.SALE,
    );
    expect(productQuantity.applyChange).not.toHaveBeenCalled();
    expect(partnerDebt.applyChange).not.toHaveBeenCalled();
    expect(prisma.cashTransaction.create).not.toHaveBeenCalled();
  });

  it('allows the same product on multiple lines', async () => {
    const result = await service.create('user-1', {
      ...createDto,
      items: [
        createDto.items[0],
        { ...createDto.items[0], quantity: '1', unitPrice: '90.0000' },
      ],
    });
    expect(result.documentNumber).toBe('SAL-0000001');
    expect(result.status).toBe(DocumentStatusApi.DRAFT);
  });

  it('lists with filters and pagination', async () => {
    prisma.sale.findMany.mockResolvedValue([
      {
        ...detail,
        _count: { items: 1 },
        cashTransactions: [],
      },
    ]);
    prisma.sale.count.mockResolvedValue(1);
    const result = await service.list({
      page: 1,
      pageSize: 20,
      documentNumber: 'SAL',
      partnerId: 'partner-1',
      status: DocumentStatusApi.DRAFT,
      businessDateFrom: '2026-07-01',
      businessDateTo: '2026-07-31',
    });
    expect(result.meta.total).toBe(1);
    expect(result.data[0].itemCount).toBe(1);
    expect(result.data[0].hasLinkedCashOperation).toBe(false);
    expect(result.data[0].partner.name).toBe('Müştəri');
    expect(result.data[0].partner.isCustomer).toBe(true);
  });

  it('rejects update/delete of non-draft', async () => {
    prisma.sale.findUnique.mockResolvedValue({
      ...detail,
      status: DocumentStatusApi.POSTED,
      items: [item],
    });
    await expect(
      service.update('sale-1', { notes: 'x' }),
    ).rejects.toBeInstanceOf(ConflictException);
    await expect(service.remove('sale-1')).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('posts draft: quantity down, debt up, no cash', async () => {
    await service.post('sale-1', 'user-1');
    expect(prisma.sale.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'sale-1', status: 'DRAFT' },
      }),
    );
    expect(productQuantity.applyChange).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        kind: ProductQuantityKind.SALE,
        quantityChange: expect.anything(),
        allowNegativeQuantity: true,
      }),
    );
    const qtyChange =
      productQuantity.applyChange.mock.calls[0][1].quantityChange;
    expect(new Decimal(qtyChange.toString()).toFixed(4)).toBe('-10.0000');
    expect(partnerDebt.applyChange).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        kind: PartnerDebtMovementKind.SALE,
      }),
    );
    const signed = partnerDebt.applyChange.mock.calls[0][1].signedAmount;
    expect(new Decimal(signed.toString()).toFixed(4)).toBe('1000.0000');
    expect(prisma.cashTransaction.create).not.toHaveBeenCalled();
    expect(cashBalance.applyPostedTransaction).not.toHaveBeenCalled();
  });

  it('posts with partial immediate payment: separate cash + receipt debt', async () => {
    await service.post('sale-1', 'user-1', {
      immediatePayment: {
        cashAccountId: 'cash-acc-1',
        amount: '400.00',
      },
    });
    expect(partnerDebt.applyChange).toHaveBeenCalledTimes(2);
    expect(partnerDebt.applyChange).toHaveBeenNthCalledWith(
      1,
      expect.anything(),
      expect.objectContaining({ kind: PartnerDebtMovementKind.SALE }),
    );
    expect(partnerDebt.applyChange).toHaveBeenNthCalledWith(
      2,
      expect.anything(),
      expect.objectContaining({
        kind: PartnerDebtMovementKind.CASH_RECEIPT,
        cashTransactionId: 'cash-1',
        saleId: 'sale-1',
      }),
    );
    const receiptSigned = partnerDebt.applyChange.mock.calls[1][1].signedAmount;
    expect(new Decimal(receiptSigned.toString()).toFixed(4)).toBe('-400.0000');
    expect(cashBalance.applyPostedTransaction).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        cashAccountId: 'cash-acc-1',
        amount: '400.00',
        saleId: 'sale-1',
        partnerId: 'partner-1',
      }),
    );
  });

  it('posts with overpayment immediate payment', async () => {
    await service.post('sale-1', 'user-1', {
      immediatePayment: {
        cashAccountId: 'cash-acc-1',
        amount: '1500.00',
      },
    });
    const receiptSigned = partnerDebt.applyChange.mock.calls[1][1].signedAmount;
    expect(new Decimal(receiptSigned.toString()).toFixed(4)).toBe('-1500.0000');
  });

  it('rolls back post when immediate cash fails', async () => {
    cashBalance.applyPostedTransaction.mockRejectedValue(
      new BadRequestException('cash fail'),
    );
    await expect(
      service.post('sale-1', 'user-1', {
        immediatePayment: {
          cashAccountId: 'cash-acc-1',
          amount: '100.00',
        },
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('blocks cancel when linked posted cash exists', async () => {
    prisma.sale.findUnique.mockResolvedValue({
      ...detail,
      status: DocumentStatusApi.POSTED,
      items: [item],
    });
    prisma.cashTransaction.count.mockResolvedValue(1);
    await expect(
      service.cancel('sale-1', 'user-1', { reason: 'Səhv' }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(productQuantity.applyChange).not.toHaveBeenCalled();
    expect(partnerDebt.applyChange).not.toHaveBeenCalled();
  });

  it('rejects post without reason when insufficient quantity', async () => {
    prisma.product.findUnique.mockResolvedValue({
      currentQuantity: new Decimal('5'),
      code: '0000001',
    });
    await expect(service.post('sale-1', 'user-1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(productQuantity.applyChange).not.toHaveBeenCalled();
    expect(partnerDebt.applyChange).not.toHaveBeenCalled();
  });

  it('allows post with reason when insufficient quantity', async () => {
    prisma.product.findUnique.mockResolvedValue({
      currentQuantity: new Decimal('5'),
      code: '0000001',
    });
    await service.post('sale-1', 'user-1', {
      negativeQuantityReason: 'Təcili satış',
    });
    expect(productQuantity.applyChange).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        kind: ProductQuantityKind.SALE,
        reason: 'Təcili satış',
        allowNegativeQuantity: true,
      }),
    );
    expect(partnerDebt.applyChange).toHaveBeenCalled();
  });

  it('blocks concurrent second post', async () => {
    prisma.sale.updateMany.mockResolvedValue({ count: 0 });
    await expect(service.post('sale-1', 'user-1')).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(productQuantity.applyChange).not.toHaveBeenCalled();
  });

  it('cancels posted sale with reversals', async () => {
    prisma.sale.findUnique
      .mockResolvedValueOnce({
        ...detail,
        status: DocumentStatusApi.POSTED,
        items: [item],
      })
      .mockResolvedValue({
        ...detail,
        status: DocumentStatusApi.CANCELLED,
        cancelReason: 'Səhv',
      });
    await service.cancel('sale-1', 'user-1', { reason: 'Səhv' });
    expect(productQuantity.applyChange).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        kind: ProductQuantityKind.CANCELLATION_REVERSAL,
        reason: 'Səhv',
      }),
    );
    expect(partnerDebt.applyChange).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        kind: PartnerDebtMovementKind.SALE_CANCELLATION,
        reversalOfId: 'dm-1',
      }),
    );
    const signed = partnerDebt.applyChange.mock.calls[0][1].signedAmount;
    expect(new Decimal(signed.toString()).toFixed(4)).toBe('-1000.0000');
  });

  it('rejects blank cancel reason and concurrent cancel', async () => {
    await expect(
      service.cancel('sale-1', 'user-1', { reason: '  ' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    prisma.sale.updateMany.mockResolvedValue({ count: 0 });
    await expect(
      service.cancel('sale-1', 'user-1', { reason: 'Yenidən' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('sale cancel does not mutate cash', async () => {
    prisma.sale.findUnique
      .mockResolvedValueOnce({
        ...detail,
        status: DocumentStatusApi.POSTED,
        items: [item],
      })
      .mockResolvedValue({
        ...detail,
        status: DocumentStatusApi.CANCELLED,
        cancelReason: 'Səhv',
      });
    await service.cancel('sale-1', 'user-1', { reason: 'Səhv' });
    expect(cashBalance.applyPostedTransaction).not.toHaveBeenCalled();
    expect(productQuantity.applyChange).toHaveBeenCalled();
    expect(partnerDebt.applyChange).toHaveBeenCalled();
  });

  it('blocks posting a cancelled sale again', async () => {
    prisma.sale.findUnique.mockResolvedValue({
      ...detail,
      status: DocumentStatusApi.CANCELLED,
      items: [item],
    });
    prisma.sale.updateMany.mockResolvedValue({ count: 0 });
    await expect(service.post('sale-1', 'user-1')).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(productQuantity.applyChange).not.toHaveBeenCalled();
    expect(partnerDebt.applyChange).not.toHaveBeenCalled();
  });

  it('allows draft sale update', async () => {
    prisma.sale.findUnique
      .mockResolvedValueOnce({
        ...detail,
        status: DocumentStatusApi.DRAFT,
        items: [item],
      })
      .mockResolvedValue({
        ...detail,
        status: DocumentStatusApi.DRAFT,
        notes: 'Yenilənmiş',
        items: [item],
      });
    await service.update('sale-1', { notes: 'Yenilənmiş' });
    expect(prisma.sale.update).toHaveBeenCalled();
  });

  it('returns not found', async () => {
    prisma.sale.findUnique.mockResolvedValue(null);
    await expect(service.findOne('x')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
