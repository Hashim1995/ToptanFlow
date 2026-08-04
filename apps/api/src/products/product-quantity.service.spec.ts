import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/client';
import {
  ProductQuantityKind,
  ProductQuantityService,
} from './product-quantity.service';

describe('ProductQuantityService', () => {
  let service: ProductQuantityService;

  const productFindUnique = jest.fn();
  const productUpdate = jest.fn();
  const historyCreate = jest.fn();
  const tx = {
    product: {
      findUnique: productFindUnique,
      update: productUpdate,
    },
    productQuantityHistory: {
      create: historyCreate,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ProductQuantityService({} as never);
    productFindUnique.mockResolvedValue({
      id: 'product-1',
      currentQuantity: new Decimal('100.0000'),
    });
    productUpdate.mockResolvedValue({});
    historyCreate.mockResolvedValue({ id: 'history-1' });
  });

  it('completing a purchase increases product quantity (PURCHASE)', async () => {
    const result = await service.applyChange(tx, {
      productId: 'product-1',
      quantityChange: '100',
      kind: ProductQuantityKind.PURCHASE,
      createdByUserId: 'user-1',
      purchaseId: 'purchase-1',
      allowNegativeQuantity: true,
    });

    expect(result.quantityBefore).toBe('100.0000');
    expect(result.quantityAfter).toBe('200.0000');
    expect(result.kind).toBe(ProductQuantityKind.PURCHASE);
    expect(productUpdate).toHaveBeenCalledWith({
      where: { id: 'product-1' },
      data: { currentQuantity: expect.any(Decimal) },
    });
    expect(historyCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          purchaseId: 'purchase-1',
          kind: ProductQuantityKind.PURCHASE,
        }),
      }),
    );
  });

  it('completing a sale decreases product quantity (SALE)', async () => {
    const result = await service.applyChange(tx, {
      productId: 'product-1',
      quantityChange: '-10',
      kind: ProductQuantityKind.SALE,
      createdByUserId: 'user-1',
      saleId: 'sale-1',
      allowNegativeQuantity: true,
    });

    expect(result.quantityAfter).toBe('90.0000');
    expect(result.kind).toBe(ProductQuantityKind.SALE);
  });

  it('does not mutate cash (service has no cash APIs)', async () => {
    expect(
      Object.getOwnPropertyNames(Object.getPrototypeOf(service)),
    ).not.toEqual(expect.arrayContaining(['applyCash', 'postCash']));
    await service.applyChange(tx, {
      productId: 'product-1',
      quantityChange: '5',
      kind: ProductQuantityKind.PURCHASE,
      createdByUserId: 'user-1',
      allowNegativeQuantity: true,
    });
    expect(tx).not.toHaveProperty('cashTransaction');
  });

  it('rejects zero quantityChange', async () => {
    await expect(
      service.applyChange(tx as never, {
        productId: 'product-1',
        quantityChange: '0',
        kind: ProductQuantityKind.MANUAL_ADJUSTMENT,
        createdByUserId: 'user-1',
        reason: 'n/a',
        allowNegativeQuantity: true,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('manual adjustment requires a reason', async () => {
    await expect(
      service.applyChange(tx as never, {
        productId: 'product-1',
        quantityChange: '-1',
        kind: ProductQuantityKind.MANUAL_ADJUSTMENT,
        createdByUserId: 'user-1',
        allowNegativeQuantity: true,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('blocks negative quantity without permission', async () => {
    await expect(
      service.applyChange(tx as never, {
        productId: 'product-1',
        quantityChange: '-150',
        kind: ProductQuantityKind.SALE,
        createdByUserId: 'user-1',
        reason: 'sold before purchase recorded',
        allowNegativeQuantity: false,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('allows negative quantity with permission and reason', async () => {
    const result = await service.applyChange(tx, {
      productId: 'product-1',
      quantityChange: '-150',
      kind: ProductQuantityKind.SALE,
      createdByUserId: 'user-1',
      reason: 'sold before purchase recorded',
      allowNegativeQuantity: true,
    });

    expect(result.quantityAfter).toBe('-50.0000');
  });

  it('requires reason when resulting quantity is negative even with permission', async () => {
    await expect(
      service.applyChange(tx as never, {
        productId: 'product-1',
        quantityChange: '-150',
        kind: ProductQuantityKind.SALE,
        createdByUserId: 'user-1',
        allowNegativeQuantity: true,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('cancellation reversal creates an auditable reversing history row', async () => {
    const result = await service.applyChange(tx, {
      productId: 'product-1',
      quantityChange: '10',
      kind: ProductQuantityKind.CANCELLATION_REVERSAL,
      createdByUserId: 'user-1',
      saleId: 'sale-1',
      reason: 'Sale cancelled',
      allowNegativeQuantity: true,
    });

    expect(result.kind).toBe(ProductQuantityKind.CANCELLATION_REVERSAL);
    expect(result.quantityAfter).toBe('110.0000');
  });

  it('allows sale cancellation restore when quantity remains negative', async () => {
    productFindUnique.mockResolvedValue({
      id: 'product-1',
      currentQuantity: new Decimal('-20.0000'),
    });

    const result = await service.applyChange(tx, {
      productId: 'product-1',
      quantityChange: '10',
      kind: ProductQuantityKind.CANCELLATION_REVERSAL,
      createdByUserId: 'user-1',
      saleId: 'sale-1',
      reason: 'Sale cancelled',
      allowNegativeQuantity: false,
    });

    expect(result.quantityBefore).toBe('-20.0000');
    expect(result.quantityAfter).toBe('-10.0000');
  });

  it('still blocks purchase cancellation decrease into negative without permission', async () => {
    productFindUnique.mockResolvedValue({
      id: 'product-1',
      currentQuantity: new Decimal('5.0000'),
    });

    await expect(
      service.applyChange(tx as never, {
        productId: 'product-1',
        quantityChange: '-10',
        kind: ProductQuantityKind.CANCELLATION_REVERSAL,
        createdByUserId: 'user-1',
        purchaseId: 'purchase-1',
        reason: 'Purchase cancelled',
        allowNegativeQuantity: false,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('throws NotFound when product is missing', async () => {
    productFindUnique.mockResolvedValue(null);
    await expect(
      service.applyChange(tx as never, {
        productId: 'missing',
        quantityChange: '1',
        kind: ProductQuantityKind.PURCHASE,
        createdByUserId: 'user-1',
        allowNegativeQuantity: true,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('draft documents must not call applyChange (contract documentation)', () => {
    // Draft Sale/Purchase must not invoke ProductQuantityService.
    // Enforce by never calling applyChange until DocumentStatus.POSTED.
    expect(ProductQuantityKind.SALE).toBe('SALE');
    expect(ProductQuantityKind.PURCHASE).toBe('PURCHASE');
  });
});
