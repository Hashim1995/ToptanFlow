import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/client';
import { Prisma } from '../../generated/prisma/client.js';
import { coerceCashTransactionDateTime } from '../common/datetime/baku-datetime.js';
import { BusinessCodeSequenceKey } from '../number-sequences/business-code-sequence-key';
import { NumberSequencesService } from '../number-sequences/number-sequences.service';
import { PrismaService } from '../prisma/prisma.service';

// Mirrors CashTransactionDirection enum from Prisma schema.
export const CashTransactionDirectionValue = {
  IN: 'IN',
  OUT: 'OUT',
} as const;
export type CashTransactionDirectionValue =
  (typeof CashTransactionDirectionValue)[keyof typeof CashTransactionDirectionValue];

// Mirrors CashTransactionType enum from Prisma schema.
export const CashTransactionTypeValue = {
  CUSTOMER_RECEIPT: 'CUSTOMER_RECEIPT',
  SUPPLIER_PAYMENT: 'SUPPLIER_PAYMENT',
  OTHER_INCOME: 'OTHER_INCOME',
  EXPENSE: 'EXPENSE',
  OWNER_DEPOSIT: 'OWNER_DEPOSIT',
  OWNER_WITHDRAWAL: 'OWNER_WITHDRAWAL',
  OPENING_BALANCE: 'OPENING_BALANCE',
  MANUAL_ADJUSTMENT: 'MANUAL_ADJUSTMENT',
  TRANSFER_OUT: 'TRANSFER_OUT',
  TRANSFER_IN: 'TRANSFER_IN',
  REVERSAL: 'REVERSAL',
} as const;
export type CashTransactionTypeValue =
  (typeof CashTransactionTypeValue)[keyof typeof CashTransactionTypeValue];

export type ApplyCashTransactionInput = {
  cashAccountId: string;
  direction: CashTransactionDirectionValue;
  type: CashTransactionTypeValue;
  /** Always positive (ADR-033). */
  amount: Decimal | string;
  transactionDate: Date | string;
  notes?: string | null;
  /**
   * Required when OUT would make balance negative (ADR-037).
   * For REVERSAL type, caller may always supply a reason to bypass the check.
   */
  negativeBalanceOverrideReason?: string | null;
  partnerId?: string | null;
  saleId?: string | null;
  purchaseId?: string | null;
  expenseCategoryId?: string | null;
  cashTransferId?: string | null;
  reversalOfTransactionId?: string | null;
  createdByUserId: string;
};

export type CancelCashTransactionInput = {
  transactionId: string;
  cancelReason: string;
  cancelledByUserId: string;
};

export type CashTransactionResult = {
  id: string;
  transactionNumber: string;
  cashAccountId: string;
  direction: CashTransactionDirectionValue;
  type: CashTransactionTypeValue;
  status: string;
  amount: string;
  balanceBefore: string;
  balanceAfter: string;
  transactionDate: Date;
};

type LockedCashAccountRow = {
  id: string;
  currentBalance: Decimal | string;
  isActive: boolean;
};

type LockedCashTransactionRow = {
  id: string;
  transactionNumber: string;
  cashAccountId: string;
  direction: string;
  type: string;
  amount: Decimal | string;
  status: string;
  transactionDate: Date;
  reversedById: string | null;
};

type CashTx = {
  $queryRaw<T = unknown>(
    query: TemplateStringsArray,
    ...values: unknown[]
  ): Promise<T>;
  cashAccount: {
    update(args: {
      where: { id: string };
      data: { currentBalance: Decimal };
    }): Promise<unknown>;
  };
  cashTransaction: {
    create(args: {
      data: {
        transactionNumber: string;
        cashAccountId: string;
        direction: string;
        type: string;
        status: string;
        amount: Decimal;
        transactionDate: Date;
        notes: string | null;
        balanceBefore: Decimal;
        balanceAfter: Decimal;
        negativeBalanceOverrideReason: string | null;
        partnerId: string | null;
        saleId: string | null;
        purchaseId: string | null;
        expenseCategoryId: string | null;
        cashTransferId: string | null;
        reversalOfTransactionId: string | null;
        postedAt: Date;
        postedByUserId: string;
        createdByUserId: string;
      };
      select: {
        id: true;
        transactionNumber: true;
        cashAccountId: true;
        direction: true;
        type: true;
        amount: true;
        balanceBefore: true;
        balanceAfter: true;
        transactionDate: true;
        status: true;
      };
    }): Promise<{
      id: string;
      transactionNumber: string;
      cashAccountId: string;
      direction: string;
      type: string;
      amount: Decimal;
      balanceBefore: Decimal;
      balanceAfter: Decimal;
      transactionDate: Date;
      status: string;
    }>;
    update(args: {
      where: { id: string };
      data: {
        status: string;
        cancelledAt: Date;
        cancelledByUserId: string;
        cancelReason: string;
      };
    }): Promise<unknown>;
  };
};

/**
 * Domain service for CashAccount.currentBalance + CashTransaction (ADR-033,
 * ADR-035, ADR-036, ADR-037). Must be called inside a Prisma transaction.
 * Does not touch partner debt or product quantity (ADR-028).
 */
@Injectable()
export class CashBalanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly numberSequences: NumberSequencesService,
  ) {}

  /**
   * Posts a new cash transaction against one account. ADR-036: posted immediately
   * (no draft state). ADR-037: blocks negative balance unless override reason given.
   * Locks the CashAccount row (`FOR UPDATE`) so concurrent posts cannot corrupt balance.
   */
  async applyPostedTransaction(
    tx: Prisma.TransactionClient,
    input: ApplyCashTransactionInput,
  ): Promise<CashTransactionResult> {
    const amount = this.parseAmount(input.amount);
    const txClient = tx as unknown as CashTx;

    const account = await this.lockCashAccount(txClient, input.cashAccountId);

    // Reversals may post against inactive accounts (history integrity).
    if (!account.isActive && input.type !== CashTransactionTypeValue.REVERSAL) {
      throw new BadRequestException({
        message: 'Cash account is inactive',
        code: 'CASH_ACCOUNT_INACTIVE',
      });
    }

    const balanceBefore = new Decimal(account.currentBalance.toString());
    const signedDelta =
      input.direction === CashTransactionDirectionValue.IN
        ? amount
        : amount.negated();
    const balanceAfter = balanceBefore.plus(signedDelta).toDecimalPlaces(2);

    // ADR-037: controlled negative for ordinary OUT posts (Cash Out / Expense /
    // Transfer Out creation). Cancellation reversals (REVERSAL) always restore
    // the pre-post state and must not be blocked by insufficient balance —
    // especially Cash In cancel, which must succeed even when the account would
    // go negative (CHANGE-006). Cancel reason ≠ ADR-037 override reason.
    if (
      input.type !== CashTransactionTypeValue.REVERSAL &&
      input.direction === CashTransactionDirectionValue.OUT &&
      balanceAfter.lt(0)
    ) {
      const override = (input.negativeBalanceOverrideReason ?? '').trim();
      if (override.length === 0) {
        throw new BadRequestException({
          message:
            'Insufficient cash balance. Provide negativeBalanceOverrideReason to allow negative balance (ADR-037).',
          code: 'CASH_INSUFFICIENT_BALANCE',
        });
      }
    }

    await txClient.cashAccount.update({
      where: { id: input.cashAccountId },
      data: { currentBalance: balanceAfter },
    });

    const sequence = await this.numberSequences.nextCode(
      tx,
      BusinessCodeSequenceKey.CASH_TRANSACTION,
    );
    const transactionNumber = `CSH-${sequence}`;

    const now = new Date();
    const created = await txClient.cashTransaction.create({
      data: {
        transactionNumber,
        cashAccountId: input.cashAccountId,
        direction: input.direction,
        type: input.type,
        status: 'POSTED',
        amount,
        transactionDate:
          input.transactionDate instanceof Date
            ? input.transactionDate
            : (coerceCashTransactionDateTime(input.transactionDate) ??
              new Date(input.transactionDate)),
        notes: input.notes?.trim() || null,
        balanceBefore,
        balanceAfter,
        negativeBalanceOverrideReason:
          (input.negativeBalanceOverrideReason ?? '').trim() || null,
        partnerId: input.partnerId ?? null,
        saleId: input.saleId ?? null,
        purchaseId: input.purchaseId ?? null,
        expenseCategoryId: input.expenseCategoryId ?? null,
        cashTransferId: input.cashTransferId ?? null,
        reversalOfTransactionId: input.reversalOfTransactionId ?? null,
        postedAt: now,
        postedByUserId: input.createdByUserId,
        createdByUserId: input.createdByUserId,
      },
      select: {
        id: true,
        transactionNumber: true,
        cashAccountId: true,
        direction: true,
        type: true,
        amount: true,
        balanceBefore: true,
        balanceAfter: true,
        transactionDate: true,
        status: true,
      },
    });

    return {
      id: created.id,
      transactionNumber: created.transactionNumber,
      cashAccountId: created.cashAccountId,
      direction: created.direction as CashTransactionDirectionValue,
      type: created.type as CashTransactionTypeValue,
      status: created.status,
      amount: new Decimal(created.amount.toString()).toFixed(2),
      balanceBefore: balanceBefore.toFixed(2),
      balanceAfter: balanceAfter.toFixed(2),
      transactionDate: created.transactionDate,
    };
  }

  /**
   * Cancels a posted transaction by creating an immutable reversal transaction
   * in the opposite direction (ADR-035). Prevents double-cancel. Reversal may
   * go negative without an extra override reason since it corrects a prior posting.
   */
  async cancelPostedTransaction(
    tx: Prisma.TransactionClient,
    input: CancelCashTransactionInput,
  ): Promise<CashTransactionResult> {
    const reason = input.cancelReason.trim();
    if (reason.length === 0) {
      throw new BadRequestException({
        message: 'Cancel reason is required',
        code: 'CASH_CANCEL_REASON_REQUIRED',
      });
    }

    const txClient = tx as unknown as CashTx;
    const original = await this.lockCashTransaction(
      txClient,
      input.transactionId,
    );

    if (original.type === CashTransactionTypeValue.REVERSAL) {
      throw new BadRequestException({
        message: 'Reversal transactions cannot be cancelled',
        code: 'CASH_CANNOT_CANCEL_REVERSAL',
      });
    }
    if (original.status !== 'POSTED') {
      throw new ConflictException({
        message: 'Only posted cash transactions can be cancelled',
        code: 'CASH_TRANSACTION_NOT_POSTED',
      });
    }
    if (original.reversedById !== null) {
      throw new ConflictException({
        message: 'Cash transaction has already been reversed and cancelled',
        code: 'CASH_TRANSACTION_ALREADY_CANCELLED',
      });
    }

    const reversalDirection =
      original.direction === CashTransactionDirectionValue.IN
        ? CashTransactionDirectionValue.OUT
        : CashTransactionDirectionValue.IN;

    // Reversal of Cash In (and any IN) may leave the account negative.
    // REVERSAL bypasses ADR-037 inside applyPostedTransaction — do not require
    // negativeBalanceOverrideReason for cancellation.
    const reversalResult = await this.applyPostedTransaction(tx, {
      cashAccountId: original.cashAccountId,
      direction: reversalDirection,
      type: CashTransactionTypeValue.REVERSAL,
      amount: new Decimal(original.amount.toString()),
      transactionDate: new Date(),
      notes: reason,
      reversalOfTransactionId: original.id,
      createdByUserId: input.cancelledByUserId,
    });

    await txClient.cashTransaction.update({
      where: { id: input.transactionId },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancelledByUserId: input.cancelledByUserId,
        cancelReason: reason,
      },
    });

    return reversalResult;
  }

  private async lockCashAccount(
    tx: CashTx,
    cashAccountId: string,
  ): Promise<LockedCashAccountRow> {
    const rows = await tx.$queryRaw<LockedCashAccountRow[]>`
      SELECT id, "currentBalance", "isActive"
      FROM "CashAccount"
      WHERE id = ${cashAccountId}
      FOR UPDATE
    `;
    if (rows.length === 0) {
      throw new NotFoundException({
        message: 'Cash account not found',
        code: 'CASH_ACCOUNT_NOT_FOUND',
      });
    }
    return rows[0];
  }

  private async lockCashTransaction(
    tx: CashTx,
    transactionId: string,
  ): Promise<LockedCashTransactionRow> {
    const rows = await tx.$queryRaw<LockedCashTransactionRow[]>`
      SELECT
        t.id,
        t."transactionNumber",
        t."cashAccountId",
        t.direction::text AS direction,
        t.type::text AS type,
        t.amount,
        t.status::text AS status,
        t."transactionDate",
        r.id AS "reversedById"
      FROM "CashTransaction" t
      LEFT JOIN "CashTransaction" r ON r."reversalOfTransactionId" = t.id
      WHERE t.id = ${transactionId}
      FOR UPDATE OF t
    `;
    if (rows.length === 0) {
      throw new NotFoundException({
        message: 'Cash transaction not found',
        code: 'CASH_TRANSACTION_NOT_FOUND',
      });
    }
    return rows[0];
  }

  private parseAmount(value: Decimal | string): Decimal {
    const d = value instanceof Decimal ? value : new Decimal(value.toString());
    if (!d.isFinite()) {
      throw new BadRequestException('amount must be a finite decimal');
    }
    if (d.lte(0)) {
      throw new BadRequestException('amount must be greater than zero');
    }
    return d.toDecimalPlaces(2);
  }
}
