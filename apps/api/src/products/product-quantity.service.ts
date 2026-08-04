import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client.js';
import { Decimal } from '@prisma/client/runtime/client';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Product quantity mutation kinds (ADR-029).
 * Mirrors Prisma `ProductQuantityHistoryKind`.
 */
export const ProductQuantityKind = {
  PURCHASE: 'PURCHASE',
  PURCHASE_RETURN: 'PURCHASE_RETURN',
  SALE: 'SALE',
  SALE_RETURN: 'SALE_RETURN',
  INITIAL_QUANTITY: 'INITIAL_QUANTITY',
  MANUAL_ADJUSTMENT: 'MANUAL_ADJUSTMENT',
  CANCELLATION_REVERSAL: 'CANCELLATION_REVERSAL',
} as const;

export type ProductQuantityKind =
  (typeof ProductQuantityKind)[keyof typeof ProductQuantityKind];

export type ApplyProductQuantityChangeInput = {
  productId: string;
  quantityChange: Decimal | string;
  kind: ProductQuantityKind;
  createdByUserId: string;
  reason?: string | null;
  saleId?: string | null;
  purchaseId?: string | null;
  relatedDocumentType?: string | null;
  relatedDocumentId?: string | null;
  /**
   * When true (ADR-025 v1: all active users), a *decrease* that would leave
   * quantity &lt; 0 is allowed if `reason` is non-empty. When false, that
   * decrease is blocked even with a reason. Increases that leave quantity
   * still negative (e.g. sale cancellation restoring stock into an existing
   * deficit) do not require this flag — they improve quantity, not worsen it.
   */
  allowNegativeQuantity: boolean;
};

export type ApplyProductQuantityChangeResult = {
  historyId: string;
  productId: string;
  quantityBefore: string;
  quantityAfter: string;
  quantityChange: string;
  kind: ProductQuantityKind;
};

type ProductQuantityTransaction = {
  product: {
    findUnique(args: {
      where: { id: string };
      select: { id: true; currentQuantity: true };
    }): Promise<{ id: string; currentQuantity: Decimal } | null>;
    update(args: {
      where: { id: string };
      data: { currentQuantity: Decimal };
    }): Promise<unknown>;
  };
  productQuantityHistory: {
    create(args: {
      data: {
        productId: string;
        kind: ProductQuantityKind;
        quantityChange: Decimal;
        quantityBefore: Decimal;
        quantityAfter: Decimal;
        reason: string | null;
        saleId: string | null;
        purchaseId: string | null;
        relatedDocumentType: string | null;
        relatedDocumentId: string | null;
        createdByUserId: string;
      };
      select: { id: true };
    }): Promise<{ id: string }>;
  };
};

/**
 * Domain service for Product.currentQuantity + ProductQuantityHistory (ADR-029).
 * Purchase/Sale Nest modules must call this inside their posting transaction.
 * Cash must never be mutated here (ADR-028).
 */
@Injectable()
export class ProductQuantityService {
  constructor(private readonly prisma: PrismaService) {}

  async applyChange(
    tx: Prisma.TransactionClient,
    input: ApplyProductQuantityChangeInput,
  ): Promise<ApplyProductQuantityChangeResult> {
    const change = this.toDecimal(input.quantityChange);
    if (change.isZero()) {
      throw new BadRequestException('quantityChange must not be zero');
    }

    const transaction = tx as unknown as ProductQuantityTransaction;
    const product = await transaction.product.findUnique({
      where: { id: input.productId },
      select: { id: true, currentQuantity: true },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const quantityBefore = new Decimal(product.currentQuantity.toString());
    const quantityAfter = quantityBefore.plus(change);

    if (input.kind === ProductQuantityKind.MANUAL_ADJUSTMENT) {
      this.assertNonEmptyReason(input.reason);
    }

    // Only decreases need negative-quantity authorization (ADR-027 / ADR-029).
    // An increase that leaves quantity still negative (sale cancel into an
    // existing deficit) must not be blocked — otherwise posted sales that
    // previously went negative cannot be cancelled.
    if (change.isNegative() && quantityAfter.isNegative()) {
      if (!input.allowNegativeQuantity) {
        throw new ForbiddenException(
          'Negative product quantity is not permitted without authorization',
        );
      }
      this.assertNonEmptyReason(input.reason);
    }

    await transaction.product.update({
      where: { id: input.productId },
      data: { currentQuantity: quantityAfter },
    });

    const history = await transaction.productQuantityHistory.create({
      data: {
        productId: input.productId,
        kind: input.kind,
        quantityChange: change,
        quantityBefore,
        quantityAfter,
        reason: input.reason?.trim() || null,
        saleId: input.saleId ?? null,
        purchaseId: input.purchaseId ?? null,
        relatedDocumentType: input.relatedDocumentType ?? null,
        relatedDocumentId: input.relatedDocumentId ?? null,
        createdByUserId: input.createdByUserId,
      },
      select: { id: true },
    });

    return {
      historyId: history.id,
      productId: input.productId,
      quantityBefore: quantityBefore.toFixed(4),
      quantityAfter: quantityAfter.toFixed(4),
      quantityChange: change.toFixed(4),
      kind: input.kind,
    };
  }

  /**
   * Convenience for unit tests / future posting: apply inside a new transaction.
   * Does not touch Cash, receivable, or payable (ADR-028).
   */
  async applyChangeInTransaction(
    input: ApplyProductQuantityChangeInput,
  ): Promise<ApplyProductQuantityChangeResult> {
    return this.prisma.$transaction((tx) => this.applyChange(tx, input));
  }

  private toDecimal(value: Decimal | string): Decimal {
    const decimal = value instanceof Decimal ? value : new Decimal(value);
    if (!decimal.isFinite()) {
      throw new BadRequestException('quantityChange must be a finite decimal');
    }
    return decimal;
  }

  private assertNonEmptyReason(reason: string | null | undefined): void {
    if (!reason || reason.trim().length === 0) {
      throw new BadRequestException(
        'reason is required for this quantity change',
      );
    }
  }
}
