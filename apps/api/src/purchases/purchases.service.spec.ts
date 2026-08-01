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
import { NumberSequencesService } from '../number-sequences/number-sequences.service';
import {
  ProductQuantityKind,
  ProductQuantityService,
} from '../products/product-quantity.service';
import { DocumentStatusApi } from './dto/document-status.enum';
import { PurchasesService, recalculateLines } from './purchases.service';

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

describe('PurchasesService', () => {
  let service: PurchasesService;

  const numberSequences = {
    nextCode: jest.fn().mockResolvedValue('0000001'),
  };
  const productQuantity = {
    applyChange: jest.fn().mockResolvedValue({}),
  };
  const partnerDebt = {
    applyChange: jest.fn().mockResolvedValue({}),
  };

  const partner = {
    id: 'partner-1',
    code: '0000001',
    name: 'Təchizatçı',
    currentDebtBalance: new Decimal('400'),
    isSupplier: true,
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
    receivedQuantity: new Decimal('10'),
    invoicedQuantity: null,
    unitCost: new Decimal('100'),
    discountAmount: new Decimal(0),
    lineSubtotal: new Decimal('1000'),
    lineTotal: new Decimal('1000'),
    notes: null,
    createdAt: new Date('2026-07-31T00:00:00.000Z'),
  };

  const detail = {
    id: 'purchase-1',
    documentNumber: 'PUR-0000001',
    partnerId: 'partner-1',
    partner,
    businessDate: new Date('2026-07-31T00:00:00.000Z'),
    status: DocumentStatusApi.DRAFT,
    supplierInvoiceNumber: null,
    subtotalAmount: new Decimal('1000'),
    discountAmount: new Decimal(0),
    totalAmount: new Decimal('1000'),
    notes: null,
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
  };

  const prisma: Record<string, any> = {
    $transaction: jest.fn((fn: (tx: unknown) => unknown) =>
      Promise.resolve(fn(prisma)),
    ),
    purchase: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
    },
    businessPartner: { findUnique: jest.fn() },
    product: { findMany: jest.fn(), update: jest.fn() },
    purchaseItem: { update: jest.fn() },
    businessPartnerDebtMovement: { findFirst: jest.fn() },
    cashTransaction: { create: jest.fn() },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.$transaction.mockImplementation((fn: (tx: unknown) => unknown) =>
      Promise.resolve(fn(prisma)),
    );
    numberSequences.nextCode.mockResolvedValue('0000001');
    prisma.businessPartner.findUnique.mockResolvedValue({
      isActive: true,
      isSupplier: true,
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
    prisma.purchase.create.mockResolvedValue({ id: 'purchase-1' });
    prisma.purchase.findUnique.mockResolvedValue(detail);
    prisma.purchase.updateMany.mockResolvedValue({ count: 1 });
    prisma.purchase.update.mockResolvedValue({});
    prisma.purchaseItem.update.mockResolvedValue({});
    prisma.product.update.mockResolvedValue({});
    prisma.businessPartnerDebtMovement.findFirst.mockResolvedValue({
      id: 'dm-1',
    });

    service = new PurchasesService(
      prisma as never,
      numberSequences as unknown as NumberSequencesService,
      productQuantity as unknown as ProductQuantityService,
      partnerDebt as unknown as PartnerDebtBalanceService,
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
    expect(result.documentNumber).toBe('PUR-0000001');
    expect(result.status).toBe(DocumentStatusApi.DRAFT);
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
    expect(result.documentNumber).toBe('PUR-0000001');
    expect(result.status).toBe(DocumentStatusApi.DRAFT);
  });

  it('lists with filters and pagination', async () => {
    prisma.purchase.findMany.mockResolvedValue([
      {
        ...detail,
        _count: { items: 1 },
      },
    ]);
    prisma.purchase.count.mockResolvedValue(1);
    const result = await service.list({
      page: 1,
      pageSize: 20,
      documentNumber: 'PUR',
      partnerId: 'partner-1',
      status: DocumentStatusApi.DRAFT,
      businessDateFrom: '2026-07-01',
      businessDateTo: '2026-07-31',
    });
    expect(result.meta.total).toBe(1);
    expect(result.data[0].itemCount).toBe(1);
    expect(result.data[0].partner.name).toBe('Təchizatçı');
  });

  it('rejects update/delete of non-draft', async () => {
    prisma.purchase.findUnique.mockResolvedValue({
      ...detail,
      status: DocumentStatusApi.POSTED,
      items: [item],
    });
    await expect(
      service.update('purchase-1', { notes: 'x' }),
    ).rejects.toBeInstanceOf(ConflictException);
    await expect(service.remove('purchase-1')).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('posts draft: quantity up, debt down, no cash', async () => {
    await service.post('purchase-1', 'user-1');
    expect(prisma.purchase.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'purchase-1', status: 'DRAFT' },
      }),
    );
    expect(productQuantity.applyChange).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ kind: ProductQuantityKind.PURCHASE }),
    );
    expect(partnerDebt.applyChange).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        kind: PartnerDebtMovementKind.PURCHASE,
      }),
    );
    const signed = partnerDebt.applyChange.mock.calls[0][1].signedAmount;
    expect(new Decimal(signed.toString()).toFixed(4)).toBe('-1000.0000');
    expect(prisma.cashTransaction.create).not.toHaveBeenCalled();
  });

  it('blocks concurrent second post', async () => {
    prisma.purchase.updateMany.mockResolvedValue({ count: 0 });
    await expect(service.post('purchase-1', 'user-1')).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(productQuantity.applyChange).not.toHaveBeenCalled();
  });

  it('cancels posted purchase with reversals', async () => {
    prisma.purchase.findUnique
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
    await service.cancel('purchase-1', 'user-1', { reason: 'Səhv' });
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
        kind: PartnerDebtMovementKind.PURCHASE_CANCELLATION,
        reversalOfId: 'dm-1',
      }),
    );
  });

  it('rejects blank cancel reason and concurrent cancel', async () => {
    await expect(
      service.cancel('purchase-1', 'user-1', { reason: '  ' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    prisma.purchase.updateMany.mockResolvedValue({ count: 0 });
    await expect(
      service.cancel('purchase-1', 'user-1', { reason: 'Yenidən' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('returns not found', async () => {
    prisma.purchase.findUnique.mockResolvedValue(null);
    await expect(service.findOne('x')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
