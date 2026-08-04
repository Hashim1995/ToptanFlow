import { Injectable, NotFoundException } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/client';
import { Prisma } from '../../generated/prisma/client.js';
import { toApiDateTime, toDateOnlyApi } from '../common/datetime/index.js';
import { PrismaService } from '../prisma/prisma.service';
import {
  CashTransactionDirectionValue,
  CashTransactionTypeValue,
  type CashTransactionTypeValue as CashTxnType,
} from './cash-balance.service';
import type {
  CashAccountStatementResponseDto,
  CashPeriodSummaryQueryDto,
  CashPeriodSummaryResponseDto,
  CashReportDateRangeQueryDto,
  CashStatementLineDto,
  ExpenseCategoryTotalDto,
} from './dto/cash-report-response.dto';

type StatementTxnRow = {
  id: string;
  transactionNumber: string;
  transactionDate: Date;
  type: string;
  direction: string;
  status: string;
  amount: Decimal;
  notes: string | null;
  cancelReason: string | null;
  saleId: string | null;
  purchaseId: string | null;
  partner: { name: string } | null;
  expenseCategory: { name: string } | null;
};

const TURNOVER_IN_TYPES: CashTxnType[] = [
  CashTransactionTypeValue.CUSTOMER_RECEIPT,
  CashTransactionTypeValue.OTHER_INCOME,
  CashTransactionTypeValue.OWNER_DEPOSIT,
];

const TURNOVER_OUT_TYPES: CashTxnType[] = [
  CashTransactionTypeValue.SUPPLIER_PAYMENT,
  CashTransactionTypeValue.OWNER_WITHDRAWAL,
];

const TURNOVER_TYPES: CashTxnType[] = [
  ...TURNOVER_IN_TYPES,
  ...TURNOVER_OUT_TYPES,
  CashTransactionTypeValue.EXPENSE,
];

/**
 * Cash reports / statements (US-049).
 * Statement running balance includes every persisted movement’s signed effect
 * (CANCELLED originals keep their effect; REVERSAL offsets them — ADR-035).
 * Turnover excludes Transfer and Reversal so cancellations do not inflate totals.
 */
@Injectable()
export class CashReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAccountStatement(
    cashAccountId: string,
    query: CashReportDateRangeQueryDto,
  ): Promise<CashAccountStatementResponseDto> {
    const account = await this.prisma.cashAccount.findUnique({
      where: { id: cashAccountId },
      select: {
        id: true,
        name: true,
        code: true,
        currentBalance: true,
      },
    });
    if (!account) {
      throw new NotFoundException({
        message: 'Cash account not found',
        code: 'CASH_ACCOUNT_NOT_FOUND',
      });
    }

    const dateFrom = query.dateFrom;
    const dateTo = query.dateTo;

    // Opening = sum of all applied signed effects strictly before dateFrom.
    // Cancelled originals still counted: their effect was applied at post time;
    // the compensating REVERSAL is a separate row (ADR-035).
    let opening = new Decimal(0);
    if (dateFrom) {
      const prior = await this.prisma.cashTransaction.findMany({
        where: {
          cashAccountId,
          transactionDate: { lt: dateFrom },
        },
        select: { direction: true, amount: true },
      });
      for (const row of prior) {
        opening = opening.plus(this.signedEffect(row.direction, row.amount));
      }
    }

    const inRangeWhere: Prisma.CashTransactionWhereInput = {
      cashAccountId,
      ...(dateFrom || dateTo
        ? {
            transactionDate: {
              ...(dateFrom ? { gte: dateFrom } : {}),
              ...(dateTo ? { lte: dateTo } : {}),
            },
          }
        : {}),
    };

    const rows = await this.prisma.cashTransaction.findMany({
      where: inRangeWhere,
      orderBy: [
        { transactionDate: 'asc' },
        { createdAt: 'asc' },
        { id: 'asc' },
      ],
      select: {
        id: true,
        transactionNumber: true,
        transactionDate: true,
        type: true,
        direction: true,
        status: true,
        amount: true,
        notes: true,
        cancelReason: true,
        saleId: true,
        purchaseId: true,
        partner: { select: { name: true } },
        expenseCategory: { select: { name: true } },
      },
    });

    let running = opening;
    const lines: CashStatementLineDto[] = rows.map((row: StatementTxnRow) => {
      // Every persisted movement affected balance when posted; CANCELLED originals
      // keep their signed effect and are offset by a separate REVERSAL row.
      const effect = this.signedEffect(row.direction, row.amount);
      running = running.plus(effect);
      return {
        id: row.id,
        transactionNumber: row.transactionNumber,
        transactionDate: toApiDateTime(row.transactionDate),
        type: row.type,
        direction: row.direction,
        status: row.status,
        amount: new Decimal(row.amount.toString()).toFixed(2),
        signedEffect: effect.toFixed(2),
        runningBalance: running.toFixed(2),
        partnerName: row.partner?.name ?? null,
        expenseCategoryName: row.expenseCategory?.name ?? null,
        notes: row.notes,
        cancelReason: row.cancelReason,
        saleId: row.saleId,
        purchaseId: row.purchaseId,
      };
    });

    return {
      cashAccountId: account.id,
      cashAccountName: account.name,
      cashAccountCode: account.code,
      dateFrom: dateFrom ? toDateOnlyApi(dateFrom) : null,
      dateTo: dateTo ? toDateOnlyApi(dateTo) : null,
      openingBalance: opening.toFixed(2),
      closingBalance: running.toFixed(2),
      currentBalance: new Decimal(account.currentBalance.toString()).toFixed(2),
      lines,
    };
  }

  async getPeriodSummary(
    query: CashPeriodSummaryQueryDto,
  ): Promise<CashPeriodSummaryResponseDto> {
    const dateFrom = query.dateFrom;
    const dateTo = query.dateTo;
    const cashAccountId = query.cashAccountId;

    if (cashAccountId) {
      const exists = await this.prisma.cashAccount.findUnique({
        where: { id: cashAccountId },
        select: { id: true },
      });
      if (!exists) {
        throw new NotFoundException({
          message: 'Cash account not found',
          code: 'CASH_ACCOUNT_NOT_FOUND',
        });
      }
    }

    const rangeFilter: Prisma.CashTransactionWhereInput = {
      ...(cashAccountId ? { cashAccountId } : {}),
      ...(dateFrom || dateTo
        ? {
            transactionDate: {
              ...(dateFrom ? { gte: dateFrom } : {}),
              ...(dateTo ? { lte: dateTo } : {}),
            },
          }
        : {}),
    };

    const postedInRange: Prisma.CashTransactionWhereInput = {
      ...rangeFilter,
      status: 'POSTED',
    };

    const [
      turnoverRows,
      expenseRows,
      transferAgg,
      cancelledCount,
      reversalCount,
      companyAgg,
      negativeCount,
    ] = await Promise.all([
      this.prisma.cashTransaction.findMany({
        where: {
          ...postedInRange,
          type: {
            in: TURNOVER_TYPES,
          },
        },
        select: {
          type: true,
          amount: true,
          expenseCategoryId: true,
          expenseCategory: { select: { name: true } },
        },
      }),
      this.prisma.cashTransaction.findMany({
        where: {
          ...postedInRange,
          type: CashTransactionTypeValue.EXPENSE,
        },
        select: {
          amount: true,
          expenseCategoryId: true,
          expenseCategory: { select: { name: true } },
        },
      }),
      this.prisma.cashTransaction.aggregate({
        where: {
          ...postedInRange,
          type: CashTransactionTypeValue.TRANSFER_OUT,
        },
        _sum: { amount: true },
      }),
      this.prisma.cashTransaction.count({
        where: {
          ...rangeFilter,
          status: 'CANCELLED',
          type: { not: CashTransactionTypeValue.REVERSAL },
        },
      }),
      this.prisma.cashTransaction.count({
        where: {
          ...postedInRange,
          type: CashTransactionTypeValue.REVERSAL,
        },
      }),
      this.prisma.cashAccount.aggregate({
        where: { isActive: true },
        _sum: { currentBalance: true },
        _count: { _all: true },
      }),
      this.prisma.cashAccount.count({
        where: {
          isActive: true,
          currentBalance: { lt: 0 },
        },
      }),
    ]);

    let cashInTotal = new Decimal(0);
    let cashOutTotal = new Decimal(0);
    let expenseTotal = new Decimal(0);
    let partnerCashInTotal = new Decimal(0);
    let partnerCashOutTotal = new Decimal(0);

    for (const row of turnoverRows) {
      const amount = new Decimal(row.amount.toString());
      if (TURNOVER_IN_TYPES.includes(row.type)) {
        cashInTotal = cashInTotal.plus(amount);
      }
      if (TURNOVER_OUT_TYPES.includes(row.type)) {
        cashOutTotal = cashOutTotal.plus(amount);
      }
      if (row.type === CashTransactionTypeValue.EXPENSE) {
        expenseTotal = expenseTotal.plus(amount);
      }
      if (row.type === CashTransactionTypeValue.CUSTOMER_RECEIPT) {
        partnerCashInTotal = partnerCashInTotal.plus(amount);
      }
      if (row.type === CashTransactionTypeValue.SUPPLIER_PAYMENT) {
        partnerCashOutTotal = partnerCashOutTotal.plus(amount);
      }
    }

    const categoryMap = new Map<string, { name: string; total: Decimal }>();
    for (const row of expenseRows) {
      const key = row.expenseCategoryId ?? '__none__';
      const name = row.expenseCategory?.name ?? '—';
      const prev = categoryMap.get(key) ?? { name, total: new Decimal(0) };
      prev.total = prev.total.plus(new Decimal(row.amount.toString()));
      categoryMap.set(key, prev);
    }
    const expensesByCategory: ExpenseCategoryTotalDto[] = [
      ...categoryMap.entries(),
    ]
      .map(([id, value]) => ({
        expenseCategoryId: id === '__none__' ? null : id,
        expenseCategoryName: value.name,
        total: value.total.toFixed(2),
      }))
      .sort((a, b) =>
        a.expenseCategoryName.localeCompare(b.expenseCategoryName),
      );

    const transferTotal = transferAgg._sum.amount
      ? new Decimal(transferAgg._sum.amount.toString())
      : new Decimal(0);
    const totalCompanyCash = companyAgg._sum.currentBalance
      ? new Decimal(companyAgg._sum.currentBalance.toString())
      : new Decimal(0);

    return {
      dateFrom: dateFrom ? toDateOnlyApi(dateFrom) : null,
      dateTo: dateTo ? toDateOnlyApi(dateTo) : null,
      cashAccountId: cashAccountId ?? null,
      totalCompanyCash: totalCompanyCash.toFixed(2),
      activeAccountCount: companyAgg._count._all,
      negativeAccountCount: negativeCount,
      cashInTotal: cashInTotal.toFixed(2),
      cashOutTotal: cashOutTotal.toFixed(2),
      expenseTotal: expenseTotal.toFixed(2),
      expensesByCategory,
      partnerCashInTotal: partnerCashInTotal.toFixed(2),
      partnerCashOutTotal: partnerCashOutTotal.toFixed(2),
      transferTotal: transferTotal.toFixed(2),
      cancelledCount,
      reversalCount,
    };
  }

  private signedEffect(direction: string, amount: Decimal): Decimal {
    const value = new Decimal(amount.toString());
    return direction === CashTransactionDirectionValue.IN
      ? value
      : value.negated();
  }
}
