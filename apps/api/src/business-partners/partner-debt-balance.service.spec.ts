import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/client';
import {
  PartnerDebtBalanceService,
  PartnerDebtMovementKind,
} from './partner-debt-balance.service';

describe('PartnerDebtBalanceService', () => {
  let service: PartnerDebtBalanceService;

  const partnerFindUnique = jest.fn();
  const partnerUpdate = jest.fn();
  const movementCreate = jest.fn();
  const tx = {
    businessPartner: {
      findUnique: partnerFindUnique,
      update: partnerUpdate,
    },
    businessPartnerDebtMovement: {
      create: movementCreate,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PartnerDebtBalanceService({} as never);
    partnerFindUnique.mockResolvedValue({
      id: 'partner-1',
      currentDebtBalance: new Decimal('200.0000'),
    });
    partnerUpdate.mockResolvedValue({});
    movementCreate.mockResolvedValue({ id: 'movement-1' });
  });

  it('completed Sale increases partner balance', async () => {
    const result = await service.applyChange(tx, {
      partnerId: 'partner-1',
      signedAmount: '500',
      kind: PartnerDebtMovementKind.SALE,
      createdByUserId: 'user-1',
      saleId: 'sale-1',
    });
    expect(result.balanceBefore).toBe('200.0000');
    expect(result.balanceAfter).toBe('700.0000');
  });

  it('completed Purchase decreases partner balance', async () => {
    const result = await service.applyChange(tx, {
      partnerId: 'partner-1',
      signedAmount: '-1000',
      kind: PartnerDebtMovementKind.PURCHASE,
      createdByUserId: 'user-1',
      purchaseId: 'purchase-1',
    });
    expect(result.balanceAfter).toBe('-800.0000');
  });

  it('customer Cash Receipt decreases partner balance', async () => {
    const result = await service.applyChange(tx, {
      partnerId: 'partner-1',
      signedAmount: '-300',
      kind: PartnerDebtMovementKind.CASH_RECEIPT,
      createdByUserId: 'user-1',
      cashTransactionId: 'cash-1',
    });
    expect(result.balanceAfter).toBe('-100.0000');
  });

  it('supplier Cash Payment increases partner balance', async () => {
    partnerFindUnique.mockResolvedValue({
      id: 'partner-1',
      currentDebtBalance: new Decimal('-600.0000'),
    });
    const result = await service.applyChange(tx, {
      partnerId: 'partner-1',
      signedAmount: '250',
      kind: PartnerDebtMovementKind.CASH_PAYMENT,
      createdByUserId: 'user-1',
      cashTransactionId: 'cash-2',
    });
    expect(result.balanceAfter).toBe('-350.0000');
  });

  it('balance may cross from positive to negative', async () => {
    const result = await service.applyChange(tx, {
      partnerId: 'partner-1',
      signedAmount: '-500',
      kind: PartnerDebtMovementKind.PURCHASE,
      createdByUserId: 'user-1',
    });
    expect(result.balanceBefore).toBe('200.0000');
    expect(result.balanceAfter).toBe('-300.0000');
  });

  it('balance may cross from negative to positive', async () => {
    partnerFindUnique.mockResolvedValue({
      id: 'partner-1',
      currentDebtBalance: new Decimal('-100.0000'),
    });
    const result = await service.applyChange(tx, {
      partnerId: 'partner-1',
      signedAmount: '400',
      kind: PartnerDebtMovementKind.SALE,
      createdByUserId: 'user-1',
    });
    expect(result.balanceAfter).toBe('300.0000');
  });

  it('customer advance (cash before sale) creates negative balance', async () => {
    partnerFindUnique.mockResolvedValue({
      id: 'partner-1',
      currentDebtBalance: new Decimal('0'),
    });
    const result = await service.applyChange(tx, {
      partnerId: 'partner-1',
      signedAmount: '-500',
      kind: PartnerDebtMovementKind.CASH_RECEIPT,
      createdByUserId: 'user-1',
    });
    expect(result.balanceAfter).toBe('-500.0000');
  });

  it('supplier prepayment creates positive balance', async () => {
    partnerFindUnique.mockResolvedValue({
      id: 'partner-1',
      currentDebtBalance: new Decimal('0'),
    });
    const result = await service.applyChange(tx, {
      partnerId: 'partner-1',
      signedAmount: '500',
      kind: PartnerDebtMovementKind.CASH_PAYMENT,
      createdByUserId: 'user-1',
    });
    expect(result.balanceAfter).toBe('500.0000');
  });

  it('sale cancellation reverses sale effect', async () => {
    const result = await service.applyChange(tx, {
      partnerId: 'partner-1',
      signedAmount: '-500',
      kind: PartnerDebtMovementKind.SALE_CANCELLATION,
      createdByUserId: 'user-1',
      saleId: 'sale-1',
      reason: 'Sale cancelled',
    });
    expect(result.balanceAfter).toBe('-300.0000');
    expect(result.kind).toBe(PartnerDebtMovementKind.SALE_CANCELLATION);
  });

  it('purchase cancellation reverses purchase effect', async () => {
    partnerFindUnique.mockResolvedValue({
      id: 'partner-1',
      currentDebtBalance: new Decimal('-600.0000'),
    });
    const result = await service.applyChange(tx, {
      partnerId: 'partner-1',
      signedAmount: '1000',
      kind: PartnerDebtMovementKind.PURCHASE_CANCELLATION,
      createdByUserId: 'user-1',
      purchaseId: 'purchase-1',
      reason: 'Purchase cancelled',
    });
    expect(result.balanceAfter).toBe('400.0000');
  });

  it('returns create auditable reverse effects', async () => {
    const result = await service.applyChange(tx, {
      partnerId: 'partner-1',
      signedAmount: '-100',
      kind: PartnerDebtMovementKind.SALE_RETURN,
      createdByUserId: 'user-1',
      saleId: 'sale-1',
    });
    expect(result.kind).toBe(PartnerDebtMovementKind.SALE_RETURN);
    expect(movementCreate).toHaveBeenCalled();
  });

  it('rejects zero signedAmount (drafts must not call applyChange)', async () => {
    await expect(
      service.applyChange(tx as never, {
        partnerId: 'partner-1',
        signedAmount: '0',
        kind: PartnerDebtMovementKind.SALE,
        createdByUserId: 'user-1',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('manual adjustment requires reason', async () => {
    await expect(
      service.applyChange(tx as never, {
        partnerId: 'partner-1',
        signedAmount: '10',
        kind: PartnerDebtMovementKind.MANUAL_ADJUSTMENT,
        createdByUserId: 'user-1',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('keeps source references on movement create', async () => {
    await service.applyChange(tx, {
      partnerId: 'partner-1',
      signedAmount: '50',
      kind: PartnerDebtMovementKind.SALE,
      createdByUserId: 'user-1',
      saleId: 'sale-9',
    });
    expect(movementCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          saleId: 'sale-9',
          balanceBefore: expect.any(Decimal),
          balanceAfter: expect.any(Decimal),
        }),
      }),
    );
  });

  it('throws NotFound when partner is missing', async () => {
    partnerFindUnique.mockResolvedValue(null);
    await expect(
      service.applyChange(tx as never, {
        partnerId: 'missing',
        signedAmount: '1',
        kind: PartnerDebtMovementKind.SALE,
        createdByUserId: 'user-1',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('does not expose cash mutation APIs (ADR-028)', () => {
    expect(
      Object.getOwnPropertyNames(Object.getPrototypeOf(service)),
    ).not.toEqual(expect.arrayContaining(['postCash', 'mutateCash']));
  });
});
