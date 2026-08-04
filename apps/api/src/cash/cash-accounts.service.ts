import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client.js';
import { Decimal } from '@prisma/client/runtime/client';
import {
  toApiDateTime,
  toApiDateTimeOrNull,
} from '../common/datetime/baku-datetime.js';
import { todayBoundsBaku } from '../common/datetime/index.js';
import { SortOrder } from '../common/sorting/sort-order.enum';
import { BusinessCodeSequenceKey } from '../number-sequences/business-code-sequence-key';
import { NumberSequencesService } from '../number-sequences/number-sequences.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  CashBalanceService,
  CashTransactionDirectionValue,
  CashTransactionTypeValue,
} from './cash-balance.service';
import { CreateCashAccountDto } from './dto/create-cash-account.dto';
import {
  CashAccountResponseDto,
  CashWorkspaceOverviewResponseDto,
  TotalCompanyCashResponseDto,
} from './dto/cash-account-response.dto';
import {
  CashAccountSortByField,
  ListCashAccountsQueryDto,
} from './dto/list-cash-accounts-query.dto';
import { UpdateCashAccountDto } from './dto/update-cash-account.dto';

const accountSelect = {
  id: true,
  name: true,
  code: true,
  currentBalance: true,
  notes: true,
  responsibleUserId: true,
  isActive: true,
  deactivatedAt: true,
  deactivationReason: true,
  createdAt: true,
  updatedAt: true,
  createdByUserId: true,
  responsibleUser: { select: { id: true, fullName: true } },
} satisfies Prisma.CashAccountSelect;

type AccountRecord = Prisma.CashAccountGetPayload<{
  select: typeof accountSelect;
}>;

@Injectable()
export class CashAccountsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly numberSequences: NumberSequencesService,
    private readonly cashBalance: CashBalanceService,
  ) {}

  async create(
    dto: CreateCashAccountDto,
    actorUserId: string,
  ): Promise<CashAccountResponseDto> {
    const opening = dto.openingBalance
      ? new Decimal(dto.openingBalance)
      : new Decimal(0);
    if (opening.isNegative()) {
      throw new BadRequestException('Opening balance cannot be negative');
    }

    await this.assertActiveUser(dto.responsibleUserId);

    try {
      const created = await this.prisma.$transaction(async (tx) => {
        const sequence = await this.numberSequences.nextCode(
          tx,
          BusinessCodeSequenceKey.CASH_ACCOUNT,
        );
        const code = `CA-${sequence}`;

        const account = await tx.cashAccount.create({
          data: {
            name: dto.name,
            code,
            notes: dto.notes?.trim() || null,
            responsibleUserId: dto.responsibleUserId,
            currentBalance: new Decimal(0),
            createdByUserId: actorUserId,
          },
          select: accountSelect,
        });

        if (opening.gt(0)) {
          await this.cashBalance.applyPostedTransaction(tx, {
            cashAccountId: account.id,
            direction: CashTransactionDirectionValue.IN,
            type: CashTransactionTypeValue.OPENING_BALANCE,
            amount: opening.toFixed(2),
            transactionDate: new Date(),
            notes: 'Opening balance',
            createdByUserId: actorUserId,
          });
        }

        return tx.cashAccount.findUniqueOrThrow({
          where: { id: account.id },
          select: accountSelect,
        });
      });

      return this.toResponse(created, opening);
    } catch (error) {
      this.rethrowUniqueAccountConflict(error);
      throw error;
    }
  }

  async list(query: ListCashAccountsQueryDto): Promise<{
    data: CashAccountResponseDto[];
    meta: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    };
  }> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where: Prisma.CashAccountWhereInput = {};

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { code: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }
    if (query.responsibleUserId) {
      where.responsibleUserId = query.responsibleUserId;
    }

    const sortBy = query.sortBy ?? CashAccountSortByField.createdAt;
    const sortOrder = query.sortOrder === SortOrder.ASC ? 'asc' : 'desc';

    const [rows, total] = await Promise.all([
      this.prisma.cashAccount.findMany({
        where,
        select: accountSelect,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.cashAccount.count({ where }),
    ]);

    const openings = await this.openingBalancesByAccountIds(
      rows.map((row) => row.id),
    );

    return {
      data: rows.map((r) =>
        this.toResponse(r, openings.get(r.id) ?? new Decimal(0)),
      ),
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize) || 1,
      },
    };
  }

  async getById(id: string): Promise<CashAccountResponseDto> {
    const row = await this.prisma.cashAccount.findUnique({
      where: { id },
      select: accountSelect,
    });
    if (!row) {
      throw new NotFoundException('Cash account not found');
    }
    const openings = await this.openingBalancesByAccountIds([id]);
    return this.toResponse(row, openings.get(id) ?? new Decimal(0));
  }

  async update(
    id: string,
    dto: UpdateCashAccountDto,
    actorIsSuperAdmin = false,
    actorUserId?: string,
  ): Promise<CashAccountResponseDto> {
    await this.getById(id);
    if (dto.responsibleUserId !== undefined && !actorIsSuperAdmin) {
      throw new ForbiddenException({
        message: 'Only a Super Admin may change Cash Account ownership',
        code: 'SUPERADMIN_REQUIRED',
      });
    }
    if (dto.openingBalance !== undefined && !actorIsSuperAdmin) {
      throw new ForbiddenException({
        message: 'Only a Super Admin may change Cash Account opening balance',
        code: 'SUPERADMIN_REQUIRED',
      });
    }
    if (dto.responsibleUserId !== undefined) {
      await this.assertActiveUser(dto.responsibleUserId);
    }

    const newOpening =
      dto.openingBalance !== undefined ? new Decimal(dto.openingBalance) : null;
    if (newOpening !== null && newOpening.isNegative()) {
      throw new BadRequestException('Opening balance cannot be negative');
    }
    if (newOpening !== null && !newOpening.isFinite()) {
      throw new BadRequestException('Opening balance must be a finite decimal');
    }

    try {
      const updated = await this.prisma.$transaction(async (tx) => {
        if (newOpening !== null) {
          if (!actorUserId) {
            throw new BadRequestException(
              'Actor is required to correct opening balance',
            );
          }
          await this.applyOpeningBalanceCorrection(
            tx,
            id,
            newOpening,
            actorUserId,
          );
        }

        const metadata: Prisma.CashAccountUncheckedUpdateInput = {
          ...(dto.name !== undefined ? { name: dto.name } : {}),
          ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
          ...(dto.responsibleUserId !== undefined
            ? { responsibleUserId: dto.responsibleUserId }
            : {}),
        };

        if (Object.keys(metadata).length === 0) {
          return tx.cashAccount.findUniqueOrThrow({
            where: { id },
            select: accountSelect,
          });
        }

        return tx.cashAccount.update({
          where: { id },
          data: metadata,
          select: accountSelect,
        });
      });

      const openings = await this.openingBalancesByAccountIds([id]);
      return this.toResponse(updated, openings.get(id) ?? new Decimal(0));
    } catch (error) {
      this.rethrowUniqueAccountConflict(error);
      throw error;
    }
  }

  async deactivate(
    id: string,
    actorUserId: string,
    reason?: string,
  ): Promise<CashAccountResponseDto> {
    const existing = await this.getById(id);
    if (!existing.isActive) {
      return existing;
    }
    const updated = await this.prisma.cashAccount.update({
      where: { id },
      data: {
        isActive: false,
        deactivatedAt: new Date(),
        deactivatedByUserId: actorUserId,
        deactivationReason: reason?.trim() || null,
      },
      select: accountSelect,
    });
    return this.toResponse(updated, new Decimal(existing.openingBalance));
  }

  async reactivate(id: string): Promise<CashAccountResponseDto> {
    const existing = await this.getById(id);
    if (existing.isActive) {
      return existing;
    }
    const updated = await this.prisma.cashAccount.update({
      where: { id },
      data: {
        isActive: true,
        deactivatedAt: null,
        deactivatedByUserId: null,
        deactivationReason: null,
      },
      select: accountSelect,
    });
    return this.toResponse(updated, new Decimal(existing.openingBalance));
  }

  async totalCompanyCash(): Promise<TotalCompanyCashResponseDto> {
    const agg = await this.prisma.cashAccount.aggregate({
      where: { isActive: true },
      _sum: { currentBalance: true },
      _count: { _all: true },
    });
    const total = agg._sum.currentBalance
      ? new Decimal(agg._sum.currentBalance.toString())
      : new Decimal(0);
    return {
      totalCompanyCash: total.toFixed(2),
      activeAccountCount: agg._count._all,
    };
  }

  /**
   * Cash workspace (US-043 / ADR-038): active accounts + today's In/Out/Expense.
   * Transfers are excluded from the three daily totals (ADR-034).
   */
  async workspaceOverview(): Promise<CashWorkspaceOverviewResponseDto> {
    const totals = await this.totalCompanyCash();
    const accounts = await this.prisma.cashAccount.findMany({
      where: { isActive: true },
      select: accountSelect,
      orderBy: { name: 'asc' },
    });

    const { start, end } = todayBoundsBaku();

    const dayTxns = await this.prisma.cashTransaction.findMany({
      where: {
        status: 'POSTED',
        transactionDate: { gte: start, lte: end },
        cashAccountId: { in: accounts.map((a) => a.id) },
        type: {
          notIn: [
            CashTransactionTypeValue.TRANSFER_IN,
            CashTransactionTypeValue.TRANSFER_OUT,
            CashTransactionTypeValue.REVERSAL,
          ],
        },
      },
      select: {
        cashAccountId: true,
        type: true,
        direction: true,
        amount: true,
      },
    });

    const recentRaw = await this.prisma.cashTransaction.findMany({
      where: {
        cashAccountId: { in: accounts.map((a) => a.id) },
      },
      orderBy: [{ transactionDate: 'desc' }, { createdAt: 'desc' }],
      take: Math.max(accounts.length * 3, 30),
      select: {
        id: true,
        cashAccountId: true,
        transactionNumber: true,
        type: true,
        direction: true,
        amount: true,
        transactionDate: true,
      },
    });

    const byAccount = new Map<
      string,
      { in: Decimal; out: Decimal; expense: Decimal }
    >();
    const recentByAccount = new Map<
      string,
      Array<{
        id: string;
        transactionNumber: string;
        type: string;
        direction: string;
        amount: string;
        transactionDate: string;
      }>
    >();
    for (const account of accounts) {
      byAccount.set(account.id, {
        in: new Decimal(0),
        out: new Decimal(0),
        expense: new Decimal(0),
      });
      recentByAccount.set(account.id, []);
    }

    for (const txn of dayTxns) {
      const bucket = byAccount.get(txn.cashAccountId);
      if (!bucket) continue;
      const amount = new Decimal(txn.amount.toString());
      if (txn.type === CashTransactionTypeValue.EXPENSE) {
        bucket.expense = bucket.expense.plus(amount);
      } else if (txn.direction === CashTransactionDirectionValue.IN) {
        bucket.in = bucket.in.plus(amount);
      } else if (txn.direction === CashTransactionDirectionValue.OUT) {
        bucket.out = bucket.out.plus(amount);
      }
    }

    for (const txn of recentRaw) {
      const list = recentByAccount.get(txn.cashAccountId);
      if (!list || list.length >= 3) continue;
      list.push({
        id: txn.id,
        transactionNumber: txn.transactionNumber,
        type: txn.type,
        direction: txn.direction,
        amount: new Decimal(txn.amount.toString()).toFixed(2),
        transactionDate: toApiDateTime(txn.transactionDate),
      });
    }

    const openings = await this.openingBalancesByAccountIds(
      accounts.map((account) => account.id),
    );

    return {
      totalCompanyCash: totals.totalCompanyCash,
      activeAccountCount: totals.activeAccountCount,
      accounts: accounts.map((row) => {
        const base = this.toResponse(
          row,
          openings.get(row.id) ?? new Decimal(0),
        );
        const day = byAccount.get(row.id) ?? {
          in: new Decimal(0),
          out: new Decimal(0),
          expense: new Decimal(0),
        };
        return {
          ...base,
          todayCashIn: day.in.toFixed(2),
          todayCashOut: day.out.toFixed(2),
          todayExpenses: day.expense.toFixed(2),
          recentActivity: recentByAccount.get(row.id) ?? [],
        };
      }),
    };
  }

  /**
   * CHANGE-028: Super Admin opening-balance correction.
   * Cancels the active OPENING_BALANCE (immutable reversal) when present,
   * then posts a new OPENING_BALANCE when newOpening > 0. Does not rebuild
   * ordinary inflow/outflow history.
   */
  private async applyOpeningBalanceCorrection(
    tx: Prisma.TransactionClient,
    cashAccountId: string,
    newOpening: Decimal,
    actorUserId: string,
  ): Promise<void> {
    const existing = await tx.cashTransaction.findFirst({
      where: {
        cashAccountId,
        type: CashTransactionTypeValue.OPENING_BALANCE,
        status: 'POSTED',
      },
      select: { id: true, amount: true },
      orderBy: { createdAt: 'asc' },
    });

    const oldOpening = existing
      ? new Decimal(existing.amount.toString())
      : new Decimal(0);
    const nextOpening = newOpening.toDecimalPlaces(2);

    if (oldOpening.eq(nextOpening)) {
      return;
    }

    const auditNote = `Opening balance corrected from ${oldOpening.toFixed(2)} to ${nextOpening.toFixed(2)}`;

    if (existing) {
      await this.cashBalance.cancelPostedTransaction(tx, {
        transactionId: existing.id,
        cancelReason: auditNote,
        cancelledByUserId: actorUserId,
      });
    }

    if (nextOpening.gt(0)) {
      await this.cashBalance.applyPostedTransaction(tx, {
        cashAccountId,
        direction: CashTransactionDirectionValue.IN,
        type: CashTransactionTypeValue.OPENING_BALANCE,
        amount: nextOpening.toFixed(2),
        transactionDate: new Date(),
        notes: auditNote,
        createdByUserId: actorUserId,
      });
    }
  }

  private async openingBalancesByAccountIds(
    accountIds: string[],
  ): Promise<Map<string, Decimal>> {
    const map = new Map<string, Decimal>();
    if (accountIds.length === 0) {
      return map;
    }

    const rows = await this.prisma.cashTransaction.findMany({
      where: {
        cashAccountId: { in: accountIds },
        type: CashTransactionTypeValue.OPENING_BALANCE,
        status: 'POSTED',
      },
      select: { cashAccountId: true, amount: true },
    });

    for (const row of rows) {
      const previous = map.get(row.cashAccountId) ?? new Decimal(0);
      map.set(
        row.cashAccountId,
        previous.plus(new Decimal(row.amount.toString())),
      );
    }
    return map;
  }

  private async assertActiveUser(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, isActive: true },
    });
    if (!user || !user.isActive) {
      throw new BadRequestException('Responsible user not found or inactive');
    }
  }

  private toResponse(
    row: AccountRecord,
    openingBalance: Decimal,
  ): CashAccountResponseDto {
    return {
      id: row.id,
      name: row.name,
      code: row.code,
      currentBalance: new Decimal(row.currentBalance.toString()).toFixed(2),
      openingBalance: openingBalance.toDecimalPlaces(2).toFixed(2),
      notes: row.notes,
      responsibleUserId: row.responsibleUserId,
      responsibleUserName: row.responsibleUser?.fullName ?? null,
      isActive: row.isActive,
      deactivatedAt: toApiDateTimeOrNull(row.deactivatedAt),
      deactivationReason: row.deactivationReason,
      createdAt: toApiDateTime(row.createdAt),
      updatedAt: toApiDateTime(row.updatedAt),
      createdByUserId: row.createdByUserId,
    };
  }

  private rethrowUniqueAccountConflict(error: unknown): void {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code: string }).code === 'P2002'
    ) {
      const target = (error as { meta?: { target?: unknown } }).meta?.target;
      const targetFields = Array.isArray(target)
        ? target.filter((field): field is string => typeof field === 'string')
        : typeof target === 'string'
          ? [target]
          : [];
      if (targetFields.includes('responsibleUserId')) {
        throw new ConflictException({
          message: 'This user is already responsible for another Cash Account',
          code: 'CASH_ACCOUNT_RESPONSIBLE_USER_CONFLICT',
        });
      }
      throw new ConflictException({
        message: 'A cash account with this name or code already exists',
        code: 'CASH_ACCOUNT_NAME_CONFLICT',
      });
    }
  }
}
