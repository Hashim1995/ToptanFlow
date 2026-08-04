import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client.js';
import { Decimal } from '@prisma/client/runtime/client';
import { toApiDateTime } from '../common/datetime/baku-datetime.js';
import { SortOrder } from '../common/sorting/sort-order.enum';
import { PrismaService } from '../prisma/prisma.service';
import { BusinessCodeSequenceKey } from '../number-sequences/business-code-sequence-key';
import { NumberSequencesService } from '../number-sequences/number-sequences.service';
import {
  CashBalanceService,
  CashTransactionDirectionValue,
  CashTransactionTypeValue,
} from './cash-balance.service';
import {
  PartnerDebtBalanceService,
  PartnerDebtMovementKind,
} from '../business-partners/partner-debt-balance.service';
import {
  CancelCashTransactionDto,
  CancelCashTransferDto,
  CreateCashInDto,
  CreateCashOutDto,
  CreateCashTransferDto,
  CreateExpenseDto,
} from './dto/create-cash-transaction.dto';
import {
  CashTransactionResponseDto,
  CashTransactionSortByField,
  ListCashTransactionsQueryDto,
} from './dto/list-cash-transactions-query.dto';
import { CashTransferResponseDto } from './dto/cash-transfer-response.dto';
import { ExpenseCategoriesService } from './expense-categories.service';
import { PushNotificationsService } from '../push/push-notifications.service.js';

const txnSelect = {
  id: true,
  transactionNumber: true,
  cashAccountId: true,
  direction: true,
  type: true,
  status: true,
  amount: true,
  balanceBefore: true,
  balanceAfter: true,
  transactionDate: true,
  notes: true,
  negativeBalanceOverrideReason: true,
  cancelReason: true,
  expenseCategoryId: true,
  partnerId: true,
  saleId: true,
  purchaseId: true,
  cashTransferId: true,
  createdByUserId: true,
  createdAt: true,
  cashAccount: { select: { name: true } },
  expenseCategory: { select: { name: true } },
  partner: { select: { name: true } },
  createdBy: { select: { fullName: true } },
} satisfies Prisma.CashTransactionSelect;

type TxnRecord = Prisma.CashTransactionGetPayload<{ select: typeof txnSelect }>;

@Injectable()
export class CashTransactionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cashBalance: CashBalanceService,
    private readonly expenseCategories: ExpenseCategoriesService,
    private readonly partnerDebt: PartnerDebtBalanceService,
    private readonly numberSequences: NumberSequencesService,
    private readonly pushNotifications: PushNotificationsService,
  ) {}

  /**
   * Primary Cash In (ADR-038): partner required; cash ↑; partner debt ↓.
   * Persists as CUSTOMER_RECEIPT.
   */
  async cashIn(
    dto: CreateCashInDto,
    actorUserId: string,
  ): Promise<CashTransactionResponseDto> {
    await this.assertActivePartner(dto.partnerId);
    if (dto.saleId) {
      await this.assertSaleBelongsToPartner(dto.saleId, dto.partnerId);
    }

    const cashTxn = await this.prisma.$transaction(async (tx) => {
      const txn = await this.cashBalance.applyPostedTransaction(tx, {
        cashAccountId: dto.cashAccountId,
        direction: CashTransactionDirectionValue.IN,
        type: CashTransactionTypeValue.CUSTOMER_RECEIPT,
        amount: dto.amount,
        transactionDate: dto.transactionDate,
        notes: dto.notes,
        createdByUserId: actorUserId,
        partnerId: dto.partnerId,
        saleId: dto.saleId ?? null,
      });

      // Optional saleId is traceability only — never a second debt mutation.
      await this.partnerDebt.applyChange(tx, {
        partnerId: dto.partnerId,
        signedAmount: new Decimal(dto.amount).negated(),
        kind: PartnerDebtMovementKind.CASH_RECEIPT,
        createdByUserId: actorUserId,
        cashTransactionId: txn.id,
        saleId: dto.saleId ?? null,
      });

      return txn;
    });

    this.pushNotifications.notifyCashIn({
      actorUserId,
      transactionId: cashTxn.id,
      cashAccountId: dto.cashAccountId,
      amount: cashTxn.amount,
    });
    return this.getById(cashTxn.id);
  }

  /**
   * Primary Cash Out (ADR-038): partner required; cash ↓; partner debt ↑.
   * Persists as SUPPLIER_PAYMENT.
   */
  async cashOut(
    dto: CreateCashOutDto,
    actorUserId: string,
  ): Promise<CashTransactionResponseDto> {
    await this.assertActivePartner(dto.partnerId);
    if (dto.purchaseId) {
      await this.assertPurchaseBelongsToPartner(dto.purchaseId, dto.partnerId);
    }

    const cashTxn = await this.prisma.$transaction(async (tx) => {
      const txn = await this.cashBalance.applyPostedTransaction(tx, {
        cashAccountId: dto.cashAccountId,
        direction: CashTransactionDirectionValue.OUT,
        type: CashTransactionTypeValue.SUPPLIER_PAYMENT,
        amount: dto.amount,
        transactionDate: dto.transactionDate,
        notes: dto.notes,
        createdByUserId: actorUserId,
        negativeBalanceOverrideReason: dto.negativeBalanceOverrideReason,
        partnerId: dto.partnerId,
        purchaseId: dto.purchaseId ?? null,
      });

      // Optional purchaseId is traceability only — never a second debt mutation.
      await this.partnerDebt.applyChange(tx, {
        partnerId: dto.partnerId,
        signedAmount: new Decimal(dto.amount),
        kind: PartnerDebtMovementKind.CASH_PAYMENT,
        createdByUserId: actorUserId,
        cashTransactionId: txn.id,
        purchaseId: dto.purchaseId ?? null,
      });

      return txn;
    });

    this.pushNotifications.notifyCashOut({
      actorUserId,
      transactionId: cashTxn.id,
      cashAccountId: dto.cashAccountId,
      amount: cashTxn.amount,
    });
    return this.getById(cashTxn.id);
  }

  /** Alias for older route name — same as cashIn. */
  customerReceipt(
    dto: CreateCashInDto,
    actorUserId: string,
  ): Promise<CashTransactionResponseDto> {
    return this.cashIn(dto, actorUserId);
  }

  /** Alias for older route name — same as cashOut. */
  supplierPayment(
    dto: CreateCashOutDto,
    actorUserId: string,
  ): Promise<CashTransactionResponseDto> {
    return this.cashOut(dto, actorUserId);
  }

  /**
   * Expense (ADR-038): category + description required; cash ↓; no partner debt.
   */
  async expense(
    dto: CreateExpenseDto,
    actorUserId: string,
  ): Promise<CashTransactionResponseDto> {
    await this.expenseCategories.assertActiveCategory(dto.expenseCategoryId);
    const cashTxn = await this.prisma.$transaction((tx) =>
      this.cashBalance.applyPostedTransaction(tx, {
        cashAccountId: dto.cashAccountId,
        direction: CashTransactionDirectionValue.OUT,
        type: CashTransactionTypeValue.EXPENSE,
        amount: dto.amount,
        transactionDate: dto.transactionDate,
        notes: dto.notes,
        createdByUserId: actorUserId,
        negativeBalanceOverrideReason: dto.negativeBalanceOverrideReason,
        expenseCategoryId: dto.expenseCategoryId,
      }),
    );

    this.pushNotifications.notifyCashExpense({
      actorUserId,
      transactionId: cashTxn.id,
      cashAccountId: dto.cashAccountId,
      amount: cashTxn.amount,
    });
    return this.getById(cashTxn.id);
  }

  /**
   * Internal Cash Transfer (ADR-034 / ADR-038): one aggregate + linked OUT/IN.
   */
  async transfer(
    dto: CreateCashTransferDto,
    actorUserId: string,
  ): Promise<CashTransferResponseDto> {
    if (dto.sourceCashAccountId === dto.destinationCashAccountId) {
      throw new BadRequestException({
        message: 'Source and destination Cash Accounts must differ',
        code: 'CASH_TRANSFER_SAME_ACCOUNT',
      });
    }

    const transferId = await this.prisma.$transaction(async (tx) => {
      // Lock both accounts in stable UUID order to avoid deadlocks.
      const [firstId, secondId] = [
        dto.sourceCashAccountId,
        dto.destinationCashAccountId,
      ].sort();
      await this.lockAccount(tx, firstId);
      await this.lockAccount(tx, secondId);

      const sequence = await this.numberSequences.nextCode(
        tx,
        BusinessCodeSequenceKey.CASH_TRANSFER,
      );
      const transferNumber = `CTR-${sequence}`;

      const transfer = await tx.cashTransfer.create({
        data: {
          transferNumber,
          sourceCashAccountId: dto.sourceCashAccountId,
          destinationCashAccountId: dto.destinationCashAccountId,
          amount: new Decimal(dto.amount),
          transactionDate: dto.transactionDate,
          notes: dto.notes?.trim() || null,
          status: 'POSTED',
          negativeBalanceOverrideReason:
            dto.negativeBalanceOverrideReason?.trim() || null,
          createdByUserId: actorUserId,
        },
        select: { id: true },
      });

      await this.cashBalance.applyPostedTransaction(tx, {
        cashAccountId: dto.sourceCashAccountId,
        direction: CashTransactionDirectionValue.OUT,
        type: CashTransactionTypeValue.TRANSFER_OUT,
        amount: dto.amount,
        transactionDate: dto.transactionDate,
        notes: dto.notes,
        createdByUserId: actorUserId,
        negativeBalanceOverrideReason: dto.negativeBalanceOverrideReason,
        cashTransferId: transfer.id,
      });

      await this.cashBalance.applyPostedTransaction(tx, {
        cashAccountId: dto.destinationCashAccountId,
        direction: CashTransactionDirectionValue.IN,
        type: CashTransactionTypeValue.TRANSFER_IN,
        amount: dto.amount,
        transactionDate: dto.transactionDate,
        notes: dto.notes,
        createdByUserId: actorUserId,
        cashTransferId: transfer.id,
      });

      return transfer.id;
    });

    this.pushNotifications.notifyCashTransfer({
      actorUserId,
      transferId,
      sourceCashAccountId: dto.sourceCashAccountId,
      destinationCashAccountId: dto.destinationCashAccountId,
      amount: dto.amount,
    });
    return this.getTransferById(transferId);
  }

  async cancelTransfer(
    id: string,
    dto: CancelCashTransferDto,
    actorUserId: string,
  ): Promise<CashTransferResponseDto> {
    const reason = dto.reason.trim();
    if (reason.length === 0) {
      throw new BadRequestException({
        message: 'Cancel reason is required',
        code: 'CASH_CANCEL_REASON_REQUIRED',
      });
    }

    const transferNumber = await this.prisma.$transaction(async (tx) => {
      const transfer = await tx.cashTransfer.findUnique({
        where: { id },
        select: {
          id: true,
          status: true,
          transferNumber: true,
          legs: {
            where: { type: { in: ['TRANSFER_OUT', 'TRANSFER_IN'] } },
            select: { id: true, status: true },
          },
        },
      });
      if (!transfer) {
        throw new NotFoundException({
          message: 'Cash transfer not found',
          code: 'CASH_TRANSFER_NOT_FOUND',
        });
      }

      const transitioned = await tx.cashTransfer.updateMany({
        where: { id, status: 'POSTED' },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          cancelledByUserId: actorUserId,
          cancelReason: reason,
        },
      });
      if (transitioned.count !== 1) {
        throw new ConflictException({
          message: 'Only posted cash transfers can be cancelled',
          code: 'CASH_TRANSFER_NOT_POSTED',
        });
      }

      const postedLegs = transfer.legs.filter((l) => l.status === 'POSTED');
      // Cancel OUT first then IN — each creates a reversal; whole txn rolls back on failure.
      for (const leg of postedLegs) {
        await this.cashBalance.cancelPostedTransaction(tx, {
          transactionId: leg.id,
          cancelReason: reason,
          cancelledByUserId: actorUserId,
        });
      }

      return transfer.transferNumber;
    });

    this.pushNotifications.notifyCashTransferCancel({
      actorUserId,
      transferId: id,
      transferNumber,
    });
    return this.getTransferById(id);
  }

  async cancel(
    id: string,
    dto: CancelCashTransactionDto,
    actorUserId: string,
  ): Promise<CashTransactionResponseDto> {
    // Resolve transfer membership first (read-only); aggregate cancel locks both legs.
    const transferMembership = await this.prisma.cashTransaction.findUnique({
      where: { id },
      select: { cashTransferId: true },
    });
    if (!transferMembership) {
      throw new NotFoundException({
        message: 'Cash transaction not found',
        code: 'CASH_TRANSACTION_NOT_FOUND',
      });
    }

    // Transfer legs cancel via the aggregate (both sides).
    if (transferMembership.cashTransferId) {
      await this.cancelTransfer(
        transferMembership.cashTransferId,
        dto,
        actorUserId,
      );
      // Return the reversal of this leg if present, else the cancelled original view.
      const reversal = await this.prisma.cashTransaction.findFirst({
        where: { reversalOfTransactionId: id },
        select: { id: true },
      });
      if (reversal) return this.getById(reversal.id);
      return this.getById(id);
    }

    const cancelResult = await this.prisma.$transaction(async (tx) => {
      const original = await tx.cashTransaction.findUnique({
        where: { id },
        select: { type: true, partnerId: true, transactionNumber: true },
      });
      if (!original) {
        throw new NotFoundException({
          message: 'Cash transaction not found',
          code: 'CASH_TRANSACTION_NOT_FOUND',
        });
      }

      const cashReversal = await this.cashBalance.cancelPostedTransaction(tx, {
        transactionId: id,
        cancelReason: dto.reason,
        cancelledByUserId: actorUserId,
      });

      const isPartnerSettlement =
        original.type === CashTransactionTypeValue.CUSTOMER_RECEIPT ||
        original.type === CashTransactionTypeValue.SUPPLIER_PAYMENT;

      if (isPartnerSettlement && original.partnerId) {
        const debtMovement = await (
          tx as unknown as PartnerDebtTx
        ).businessPartnerDebtMovement.findFirst({
          where: { cashTransactionId: id },
          select: { id: true, signedAmount: true },
        });

        if (debtMovement) {
          const originalSignedAmount = new Decimal(
            debtMovement.signedAmount.toString(),
          );
          await this.partnerDebt.applyChange(tx, {
            partnerId: original.partnerId,
            signedAmount: originalSignedAmount.negated(),
            kind: PartnerDebtMovementKind.REVERSAL,
            createdByUserId: actorUserId,
            cashTransactionId: cashReversal.id,
            reversalOfId: debtMovement.id,
            reason: dto.reason,
          });
        }
      }

      return {
        cashReversal,
        transactionNumber: original.transactionNumber,
      };
    });

    this.pushNotifications.notifyCashTransactionCancel({
      actorUserId,
      transactionId: id,
      transactionNumber: cancelResult.transactionNumber,
    });
    return this.getById(cancelResult.cashReversal.id);
  }

  async getById(id: string): Promise<CashTransactionResponseDto> {
    const row = await this.prisma.cashTransaction.findUnique({
      where: { id },
      select: txnSelect,
    });
    if (!row) {
      throw new NotFoundException('Cash transaction not found');
    }
    return this.toResponse(row);
  }

  async getTransferById(id: string): Promise<CashTransferResponseDto> {
    const row = await this.prisma.cashTransfer.findUnique({
      where: { id },
      select: {
        id: true,
        transferNumber: true,
        sourceCashAccountId: true,
        destinationCashAccountId: true,
        amount: true,
        transactionDate: true,
        notes: true,
        status: true,
        negativeBalanceOverrideReason: true,
        cancelReason: true,
        createdByUserId: true,
        createdAt: true,
        sourceCashAccount: { select: { name: true, currentBalance: true } },
        destinationCashAccount: {
          select: { name: true, currentBalance: true },
        },
        legs: {
          select: {
            id: true,
            type: true,
            transactionNumber: true,
            balanceBefore: true,
            balanceAfter: true,
          },
        },
      },
    });
    if (!row) {
      throw new NotFoundException({
        message: 'Cash transfer not found',
        code: 'CASH_TRANSFER_NOT_FOUND',
      });
    }

    const outLeg = row.legs.find((l) => l.type === 'TRANSFER_OUT');
    const inLeg = row.legs.find((l) => l.type === 'TRANSFER_IN');

    return {
      id: row.id,
      transferNumber: row.transferNumber,
      sourceCashAccountId: row.sourceCashAccountId,
      sourceCashAccountName: row.sourceCashAccount.name,
      destinationCashAccountId: row.destinationCashAccountId,
      destinationCashAccountName: row.destinationCashAccount.name,
      amount: new Decimal(row.amount.toString()).toFixed(2),
      transactionDate: toApiDateTime(row.transactionDate),
      notes: row.notes,
      status: row.status,
      negativeBalanceOverrideReason: row.negativeBalanceOverrideReason,
      cancelReason: row.cancelReason,
      createdByUserId: row.createdByUserId,
      createdAt: toApiDateTime(row.createdAt),
      outTransactionId: outLeg?.id ?? null,
      inTransactionId: inLeg?.id ?? null,
      sourceBalanceBefore: outLeg
        ? new Decimal(outLeg.balanceBefore.toString()).toFixed(2)
        : null,
      sourceBalanceAfter: outLeg
        ? new Decimal(outLeg.balanceAfter.toString()).toFixed(2)
        : null,
      destinationBalanceBefore: inLeg
        ? new Decimal(inLeg.balanceBefore.toString()).toFixed(2)
        : null,
      destinationBalanceAfter: inLeg
        ? new Decimal(inLeg.balanceAfter.toString()).toFixed(2)
        : null,
    };
  }

  async list(query: ListCashTransactionsQueryDto): Promise<{
    data: CashTransactionResponseDto[];
    meta: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    };
  }> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where: Prisma.CashTransactionWhereInput = {};

    if (query.cashAccountId) where.cashAccountId = query.cashAccountId;
    if (query.type)
      where.type = query.type as Prisma.EnumCashTransactionTypeFilter;
    if (query.direction) where.direction = query.direction;
    if (query.status) where.status = query.status;
    if (query.partnerId) where.partnerId = query.partnerId;
    if (query.expenseCategoryId)
      where.expenseCategoryId = query.expenseCategoryId;
    if (query.saleId) where.saleId = query.saleId;
    if (query.purchaseId) where.purchaseId = query.purchaseId;
    if (query.amountMin || query.amountMax) {
      where.amount = {};
      if (query.amountMin) where.amount.gte = new Decimal(query.amountMin);
      if (query.amountMax) where.amount.lte = new Decimal(query.amountMax);
    }
    if (query.transactionNumber) {
      where.transactionNumber = {
        contains: query.transactionNumber,
        mode: 'insensitive',
      };
    }
    if (query.dateFrom || query.dateTo) {
      where.transactionDate = {};
      if (query.dateFrom) where.transactionDate.gte = query.dateFrom;
      if (query.dateTo) where.transactionDate.lte = query.dateTo;
    }

    const sortBy = query.sortBy ?? CashTransactionSortByField.transactionDate;
    const sortOrder = query.sortOrder === SortOrder.ASC ? 'asc' : 'desc';

    const [rows, total] = await Promise.all([
      this.prisma.cashTransaction.findMany({
        where,
        select: txnSelect,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.cashTransaction.count({ where }),
    ]);

    return {
      data: rows.map((r) => this.toResponse(r)),
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize) || 1,
      },
    };
  }

  private async lockAccount(
    tx: Prisma.TransactionClient,
    cashAccountId: string,
  ): Promise<void> {
    const rows = await tx.$queryRaw<{ id: string }[]>`
      SELECT id FROM "CashAccount" WHERE id = ${cashAccountId} FOR UPDATE
    `;
    if (rows.length === 0) {
      throw new NotFoundException({
        message: 'Cash account not found',
        code: 'CASH_ACCOUNT_NOT_FOUND',
      });
    }
  }

  private async assertActivePartner(partnerId: string): Promise<void> {
    const partner = await this.prisma.businessPartner.findUnique({
      where: { id: partnerId },
      select: { id: true, isActive: true },
    });
    if (!partner) {
      throw new NotFoundException({
        message: 'Business partner not found',
        code: 'BUSINESS_PARTNER_NOT_FOUND',
      });
    }
    if (!partner.isActive) {
      throw new BadRequestException({
        message: 'Business partner is inactive',
        code: 'BUSINESS_PARTNER_INACTIVE',
      });
    }
  }

  private async assertSaleBelongsToPartner(
    saleId: string,
    partnerId: string,
  ): Promise<void> {
    const sale = await this.prisma.sale.findUnique({
      where: { id: saleId },
      select: { id: true, partnerId: true },
    });
    if (!sale) {
      throw new NotFoundException({
        message: 'Sale not found',
        code: 'SALE_NOT_FOUND',
      });
    }
    if (sale.partnerId !== partnerId) {
      throw new BadRequestException({
        message: 'Sale does not belong to the specified partner',
        code: 'SALE_PARTNER_MISMATCH',
      });
    }
  }

  private async assertPurchaseBelongsToPartner(
    purchaseId: string,
    partnerId: string,
  ): Promise<void> {
    const purchase = await this.prisma.purchase.findUnique({
      where: { id: purchaseId },
      select: { id: true, partnerId: true },
    });
    if (!purchase) {
      throw new NotFoundException({
        message: 'Purchase not found',
        code: 'PURCHASE_NOT_FOUND',
      });
    }
    if (purchase.partnerId !== partnerId) {
      throw new BadRequestException({
        message: 'Purchase does not belong to the specified partner',
        code: 'PURCHASE_PARTNER_MISMATCH',
      });
    }
  }

  private toResponse(row: TxnRecord): CashTransactionResponseDto {
    return {
      id: row.id,
      transactionNumber: row.transactionNumber,
      cashAccountId: row.cashAccountId,
      cashAccountName: row.cashAccount?.name ?? null,
      direction: row.direction,
      type: row.type,
      status: row.status,
      amount: new Decimal(row.amount.toString()).toFixed(2),
      balanceBefore: new Decimal(row.balanceBefore.toString()).toFixed(2),
      balanceAfter: new Decimal(row.balanceAfter.toString()).toFixed(2),
      transactionDate: toApiDateTime(row.transactionDate),
      notes: row.notes,
      negativeBalanceOverrideReason: row.negativeBalanceOverrideReason,
      cancelReason: row.cancelReason,
      expenseCategoryId: row.expenseCategoryId,
      expenseCategoryName: row.expenseCategory?.name ?? null,
      partnerId: row.partnerId,
      partnerName: row.partner?.name ?? null,
      saleId: row.saleId,
      purchaseId: row.purchaseId,
      cashTransferId: row.cashTransferId,
      createdByUserId: row.createdByUserId,
      createdByName: row.createdBy?.fullName ?? null,
      createdAt: toApiDateTime(row.createdAt),
    };
  }
}

/** Minimal tx-client shape needed for reading debt movements inside a cancel. */
type PartnerDebtTx = {
  businessPartnerDebtMovement: {
    findFirst(args: {
      where: { cashTransactionId: string };
      select: { id: true; signedAmount: true };
    }): Promise<{ id: string; signedAmount: Decimal } | null>;
  };
};
