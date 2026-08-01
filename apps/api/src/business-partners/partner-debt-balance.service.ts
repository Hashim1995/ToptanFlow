import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client.js';
import { Decimal } from '@prisma/client/runtime/client';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Partner debt movement kinds (ADR-030).
 * Mirrors Prisma `BusinessPartnerDebtMovementKind`.
 */
export const PartnerDebtMovementKind = {
  SALE: 'SALE',
  SALE_RETURN: 'SALE_RETURN',
  SALE_CANCELLATION: 'SALE_CANCELLATION',
  PURCHASE: 'PURCHASE',
  PURCHASE_RETURN: 'PURCHASE_RETURN',
  PURCHASE_CANCELLATION: 'PURCHASE_CANCELLATION',
  CASH_RECEIPT: 'CASH_RECEIPT',
  CASH_PAYMENT: 'CASH_PAYMENT',
  MANUAL_ADJUSTMENT: 'MANUAL_ADJUSTMENT',
  OPENING_BALANCE: 'OPENING_BALANCE',
  REVERSAL: 'REVERSAL',
} as const;

export type PartnerDebtMovementKind =
  (typeof PartnerDebtMovementKind)[keyof typeof PartnerDebtMovementKind];

export type ApplyPartnerDebtChangeInput = {
  partnerId: string;
  /**
   * Change applied to currentDebtBalance (ADR-030 sign convention).
   * Sale: positive; Cash receipt: negative; Purchase: negative;
   * Cash payment: positive.
   */
  signedAmount: Decimal | string;
  kind: PartnerDebtMovementKind;
  createdByUserId: string;
  reason?: string | null;
  saleId?: string | null;
  purchaseId?: string | null;
  cashTransactionId?: string | null;
  relatedDocumentType?: string | null;
  relatedDocumentId?: string | null;
  reversalOfId?: string | null;
};

export type ApplyPartnerDebtChangeResult = {
  movementId: string;
  partnerId: string;
  balanceBefore: string;
  balanceAfter: string;
  signedAmount: string;
  kind: PartnerDebtMovementKind;
};

type PartnerDebtTransaction = {
  businessPartner: {
    findUnique(args: {
      where: { id: string };
      select: { id: true; currentDebtBalance: true };
    }): Promise<{ id: string; currentDebtBalance: Decimal } | null>;
    update(args: {
      where: { id: string };
      data: { currentDebtBalance: Decimal };
    }): Promise<unknown>;
  };
  businessPartnerDebtMovement: {
    create(args: {
      data: {
        partnerId: string;
        kind: PartnerDebtMovementKind;
        signedAmount: Decimal;
        balanceBefore: Decimal;
        balanceAfter: Decimal;
        reason: string | null;
        saleId: string | null;
        purchaseId: string | null;
        cashTransactionId: string | null;
        relatedDocumentType: string | null;
        relatedDocumentId: string | null;
        reversalOfId: string | null;
        createdByUserId: string;
      };
      select: { id: true };
    }): Promise<{ id: string }>;
  };
};

/**
 * Domain service for BusinessPartner.currentDebtBalance + movements (ADR-030).
 * Does not mutate Cash (ADR-028). Purchase/Sale Nest modules must call this
 * inside their posting transaction.
 */
@Injectable()
export class PartnerDebtBalanceService {
  constructor(private readonly prisma: PrismaService) {}

  async applyChange(
    tx: Prisma.TransactionClient,
    input: ApplyPartnerDebtChangeInput,
  ): Promise<ApplyPartnerDebtChangeResult> {
    const signedAmount = this.toDecimal(input.signedAmount);
    if (signedAmount.isZero()) {
      throw new BadRequestException('signedAmount must not be zero');
    }

    if (input.kind === PartnerDebtMovementKind.MANUAL_ADJUSTMENT) {
      this.assertNonEmptyReason(input.reason);
    }

    const transaction = tx as unknown as PartnerDebtTransaction;
    const partner = await transaction.businessPartner.findUnique({
      where: { id: input.partnerId },
      select: { id: true, currentDebtBalance: true },
    });
    if (!partner) {
      throw new NotFoundException('Business partner not found');
    }

    const balanceBefore = new Decimal(partner.currentDebtBalance.toString());
    const balanceAfter = balanceBefore.plus(signedAmount);

    await transaction.businessPartner.update({
      where: { id: input.partnerId },
      data: { currentDebtBalance: balanceAfter },
    });

    const movement = await transaction.businessPartnerDebtMovement.create({
      data: {
        partnerId: input.partnerId,
        kind: input.kind,
        signedAmount,
        balanceBefore,
        balanceAfter,
        reason: input.reason?.trim() || null,
        saleId: input.saleId ?? null,
        purchaseId: input.purchaseId ?? null,
        cashTransactionId: input.cashTransactionId ?? null,
        relatedDocumentType: input.relatedDocumentType ?? null,
        relatedDocumentId: input.relatedDocumentId ?? null,
        reversalOfId: input.reversalOfId ?? null,
        createdByUserId: input.createdByUserId,
      },
      select: { id: true },
    });

    return {
      movementId: movement.id,
      partnerId: input.partnerId,
      balanceBefore: balanceBefore.toFixed(4),
      balanceAfter: balanceAfter.toFixed(4),
      signedAmount: signedAmount.toFixed(4),
      kind: input.kind,
    };
  }

  async applyChangeInTransaction(
    input: ApplyPartnerDebtChangeInput,
  ): Promise<ApplyPartnerDebtChangeResult> {
    return this.prisma.$transaction((tx) => this.applyChange(tx, input));
  }

  private toDecimal(value: Decimal | string): Decimal {
    const decimal = value instanceof Decimal ? value : new Decimal(value);
    if (!decimal.isFinite()) {
      throw new BadRequestException('signedAmount must be a finite decimal');
    }
    return decimal;
  }

  private assertNonEmptyReason(reason: string | null | undefined): void {
    if (!reason || reason.trim().length === 0) {
      throw new BadRequestException(
        'reason is required for this debt balance change',
      );
    }
  }
}
