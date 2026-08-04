import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/client';
import { Prisma } from '../../generated/prisma/client.js';
import {
  PartnerDebtBalanceService,
  PartnerDebtMovementKind,
} from '../business-partners/partner-debt-balance.service';
import {
  CashBalanceService,
  CashTransactionDirectionValue,
  CashTransactionTypeValue,
} from '../cash/cash-balance.service';
import { SortOrder } from '../common/sorting/sort-order.enum';
import {
  businessDateFilterRange,
  businessDateToUtc,
} from '../common/datetime/index.js';
import { BusinessCodeSequenceKey } from '../number-sequences/business-code-sequence-key';
import { NumberSequencesService } from '../number-sequences/number-sequences.service';
import {
  ProductQuantityKind,
  ProductQuantityService,
} from '../products/product-quantity.service';
import { PrismaService } from '../prisma/prisma.service';
import { CancelSaleDto } from './dto/cancel-sale.dto';
import { CreateSaleItemDto } from './dto/create-sale-item.dto';
import { CreateSaleDto } from './dto/create-sale.dto';
import { DocumentStatusApi } from './dto/document-status.enum';
import { ListSalesQueryDto } from './dto/list-sales-query.dto';
import { PaginatedSalesResponseDto } from './dto/paginated-sales-response.dto';
import { PostSaleDto } from './dto/post-sale.dto';
import { SaleListItemResponseDto } from './dto/sale-list-item-response.dto';
import { SaleResponseDto } from './dto/sale-response.dto';
import { UpdateSaleDto } from './dto/update-sale.dto';
import { PushNotificationsService } from '../push/push-notifications.service.js';

type CalculatedLine = {
  quantity: Decimal;
  unitPrice: Decimal;
  discountAmount: Decimal;
  lineSubtotal: Decimal;
  lineTotal: Decimal;
  notes: string | null;
};

type ProductShortage = {
  code: string;
  available: string;
  requested: string;
  shortage: string;
};

export function recalculateLines(
  items: Pick<
    CreateSaleItemDto,
    'quantity' | 'unitPrice' | 'discountAmount' | 'notes'
  >[],
  documentDiscount?: string | Decimal | null,
): {
  lines: CalculatedLine[];
  subtotalAmount: Decimal;
  discountAmount: Decimal;
  totalAmount: Decimal;
} {
  const lines = items.map((item) => {
    const quantity = new Decimal(item.quantity);
    const unitPrice = new Decimal(item.unitPrice);
    const discountAmount = new Decimal(item.discountAmount ?? 0);
    const lineSubtotal = quantity.mul(unitPrice).toDecimalPlaces(4);
    if (discountAmount.gt(lineSubtotal)) {
      throw new BadRequestException(
        'Line discount cannot exceed line subtotal',
      );
    }
    const lineTotal = lineSubtotal.minus(discountAmount).toDecimalPlaces(4);
    if (lineTotal.isNegative()) {
      throw new BadRequestException('Line total cannot be negative');
    }
    return {
      quantity: quantity.toDecimalPlaces(4),
      unitPrice: unitPrice.toDecimalPlaces(4),
      discountAmount: discountAmount.toDecimalPlaces(4),
      lineSubtotal,
      lineTotal,
      notes: normalizeOptionalText(item.notes),
    };
  });

  const subtotalAmount = lines
    .reduce((sum, line) => sum.plus(line.lineSubtotal), new Decimal(0))
    .toDecimalPlaces(4);
  const linesTotal = lines.reduce(
    (sum, line) => sum.plus(line.lineTotal),
    new Decimal(0),
  );
  const discountAmount = new Decimal(documentDiscount ?? 0).toDecimalPlaces(4);
  if (discountAmount.gt(linesTotal)) {
    throw new BadRequestException('Sale discount cannot exceed lines total');
  }
  const totalAmount = linesTotal.minus(discountAmount).toDecimalPlaces(4);
  if (totalAmount.isNegative()) {
    throw new BadRequestException('Sale total cannot be negative');
  }
  return { lines, subtotalAmount, discountAmount, totalAmount };
}

const userSummarySelect = {
  id: true,
  fullName: true,
  username: true,
} as const;

const partnerSummarySelect = {
  id: true,
  code: true,
  name: true,
  currentDebtBalance: true,
  isCustomer: true,
  isActive: true,
} as const;

const saleItemSelect = {
  id: true,
  productId: true,
  unitId: true,
  productCodeSnapshot: true,
  productNameSnapshot: true,
  unitNameSnapshot: true,
  quantity: true,
  unitPrice: true,
  discountAmount: true,
  lineSubtotal: true,
  lineTotal: true,
  notes: true,
  costAtPosting: true,
} as const;

const quantityHistorySelect = {
  id: true,
  productId: true,
  kind: true,
  quantityChange: true,
  quantityBefore: true,
  quantityAfter: true,
  reason: true,
  createdAt: true,
} as const;

const debtMovementSelect = {
  id: true,
  kind: true,
  signedAmount: true,
  balanceBefore: true,
  balanceAfter: true,
  reason: true,
  reversalOfId: true,
  createdAt: true,
} as const;

const saleListSelect = {
  id: true,
  documentNumber: true,
  businessDate: true,
  status: true,
  subtotalAmount: true,
  discountAmount: true,
  totalAmount: true,
  createdAt: true,
  updatedAt: true,
  partner: { select: partnerSummarySelect },
  createdBy: { select: userSummarySelect },
  _count: { select: { items: true } },
  cashTransactions: {
    where: { status: 'POSTED' },
    select: { id: true },
    take: 1,
  },
} satisfies Prisma.SaleSelect;

const saleDetailSelect = {
  id: true,
  documentNumber: true,
  businessDate: true,
  status: true,
  subtotalAmount: true,
  discountAmount: true,
  totalAmount: true,
  notes: true,
  negativeQuantityOverrideReason: true,
  postedAt: true,
  cancelledAt: true,
  cancelReason: true,
  createdAt: true,
  updatedAt: true,
  partner: { select: partnerSummarySelect },
  createdBy: { select: userSummarySelect },
  postedBy: { select: userSummarySelect },
  cancelledBy: { select: userSummarySelect },
  items: {
    select: saleItemSelect,
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
  },
  productQuantityHistory: {
    select: quantityHistorySelect,
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
  },
  partnerDebtMovements: {
    select: debtMovementSelect,
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
  },
  cashTransactions: {
    select: {
      id: true,
      transactionNumber: true,
      cashAccountId: true,
      direction: true,
      type: true,
      status: true,
      amount: true,
      transactionDate: true,
      cashAccount: { select: { id: true, name: true, code: true } },
    },
    orderBy: [{ transactionDate: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }],
  },
} satisfies Prisma.SaleSelect;

type UserSummaryRecord = {
  id: string;
  fullName: string;
  username: string;
};

type PartnerSummaryRecord = {
  id: string;
  code: string;
  name: string;
  currentDebtBalance: Decimal;
  isCustomer: boolean;
  isActive: boolean;
};

type SaleItemRecord = {
  id: string;
  productId: string;
  unitId: string;
  productCodeSnapshot: string;
  productNameSnapshot: string;
  unitNameSnapshot: string;
  quantity: Decimal;
  unitPrice: Decimal;
  discountAmount: Decimal | null;
  lineSubtotal: Decimal;
  lineTotal: Decimal;
  notes: string | null;
  costAtPosting: Decimal | null;
};

type QuantityHistoryRecord = {
  id: string;
  productId: string;
  kind: string;
  quantityChange: Decimal;
  quantityBefore: Decimal;
  quantityAfter: Decimal;
  reason: string | null;
  createdAt: Date;
};

type DebtMovementRecord = {
  id: string;
  kind: string;
  signedAmount: Decimal;
  balanceBefore: Decimal;
  balanceAfter: Decimal;
  reason: string | null;
  reversalOfId: string | null;
  createdAt: Date;
};

type LinkedCashTransactionRecord = {
  id: string;
  transactionNumber: string;
  cashAccountId: string;
  direction: string;
  type: string;
  status: string;
  amount: Decimal;
  transactionDate: Date;
  cashAccount: { id: string; name: string; code: string };
};

type SaleListRecord = {
  id: string;
  documentNumber: string;
  businessDate: Date;
  status: string;
  subtotalAmount: Decimal;
  discountAmount: Decimal | null;
  totalAmount: Decimal;
  createdAt: Date;
  updatedAt: Date;
  partner: PartnerSummaryRecord;
  createdBy: UserSummaryRecord;
  _count: { items: number };
  cashTransactions: Array<{ id: string }>;
};

type SaleDetailRecord = {
  id: string;
  documentNumber: string;
  businessDate: Date;
  status: string;
  subtotalAmount: Decimal;
  discountAmount: Decimal | null;
  totalAmount: Decimal;
  notes: string | null;
  negativeQuantityOverrideReason: string | null;
  postedAt: Date | null;
  cancelledAt: Date | null;
  cancelReason: string | null;
  createdAt: Date;
  updatedAt: Date;
  partner: PartnerSummaryRecord;
  createdBy: UserSummaryRecord;
  postedBy: UserSummaryRecord | null;
  cancelledBy: UserSummaryRecord | null;
  items: SaleItemRecord[];
  productQuantityHistory: QuantityHistoryRecord[];
  partnerDebtMovements: DebtMovementRecord[];
  cashTransactions: LinkedCashTransactionRecord[];
};

function decimalString(value: Decimal | { toString(): string }): string {
  return new Decimal(value.toString()).toFixed(4);
}

@Injectable()
export class SalesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly numberSequences: NumberSequencesService,
    private readonly productQuantity: ProductQuantityService,
    private readonly partnerDebt: PartnerDebtBalanceService,
    private readonly cashBalance: CashBalanceService,
    private readonly pushNotifications: PushNotificationsService,
  ) {}

  async create(userId: string, dto: CreateSaleDto): Promise<SaleResponseDto> {
    const saleId = await this.prisma.$transaction(async (tx) => {
      await this.assertValidPartner(tx, dto.partnerId);
      const products = await this.loadAndValidateProducts(tx, dto.items);
      const calculated = recalculateLines(dto.items, dto.discountAmount);
      const sequence = await this.numberSequences.nextCode(
        tx,
        BusinessCodeSequenceKey.SALE,
      );

      const sale = await tx.sale.create({
        data: {
          documentNumber: `SAL-${sequence}`,
          partnerId: dto.partnerId,
          businessDate: businessDateToUtc(dto.businessDate),
          notes: normalizeOptionalText(dto.notes),
          subtotalAmount: calculated.subtotalAmount,
          discountAmount: calculated.discountAmount,
          totalAmount: calculated.totalAmount,
          createdByUserId: userId,
          items: {
            create: dto.items.map((item, index) => {
              const product = products.get(item.productId)!;
              const line = calculated.lines[index];
              return {
                productId: product.id,
                unitId: product.unit.id,
                productCodeSnapshot: product.code,
                productNameSnapshot: product.name,
                unitNameSnapshot: product.unit.name,
                ...line,
              };
            }),
          },
        },
        select: { id: true },
      });

      return sale.id;
    });
    this.pushNotifications.notifySaleCreated({ actorUserId: userId, saleId });
    return this.findOne(saleId);
  }

  async list(query: ListSalesQueryDto): Promise<PaginatedSalesResponseDto> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const sortBy = query.sortBy ?? 'createdAt';
    const sortOrder = query.sortOrder ?? SortOrder.DESC;
    const where = this.buildWhere(query);
    const [rows, total] = await Promise.all([
      this.prisma.sale.findMany({
        where,
        select: saleListSelect,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: [{ [sortBy]: sortOrder }, { id: 'asc' }],
      }) as Promise<SaleListRecord[]>,
      this.prisma.sale.count({ where }),
    ]);
    return {
      data: rows.map((row) => this.toListResponse(row)),
      meta: {
        page,
        pageSize,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / pageSize),
      },
    };
  }

  async findOne(id: string): Promise<SaleResponseDto> {
    const sale = (await this.prisma.sale.findUnique({
      where: { id },
      select: saleDetailSelect,
    })) as SaleDetailRecord | null;
    if (!sale) {
      throw new NotFoundException('Sale not found');
    }
    return this.toDetailResponse(sale);
  }

  async update(id: string, dto: UpdateSaleDto): Promise<SaleResponseDto> {
    if (!Object.values(dto).some((value) => value !== undefined)) {
      throw new BadRequestException('At least one field must be provided');
    }
    await this.prisma.$transaction(async (tx) => {
      const existing = await tx.sale.findUnique({
        where: { id },
        include: { items: true },
      });
      if (!existing) {
        throw new NotFoundException('Sale not found');
      }
      if (existing.status !== 'DRAFT') {
        throw new ConflictException('Only draft sales can be updated');
      }
      if (dto.partnerId !== undefined) {
        await this.assertValidPartner(tx, dto.partnerId);
      }

      let totals: ReturnType<typeof recalculateLines> | undefined;
      let products:
        | Awaited<ReturnType<SalesService['loadAndValidateProducts']>>
        | undefined;
      if (dto.items !== undefined) {
        products = await this.loadAndValidateProducts(tx, dto.items);
        totals = recalculateLines(
          dto.items,
          dto.discountAmount ?? existing.discountAmount,
        );
      } else if (dto.discountAmount !== undefined) {
        totals = recalculateLines(
          existing.items.map((item) => ({
            quantity: decimalString(item.quantity),
            unitPrice: decimalString(item.unitPrice),
            discountAmount: item.discountAmount
              ? decimalString(item.discountAmount)
              : undefined,
            notes: item.notes ?? undefined,
          })),
          dto.discountAmount,
        );
      }

      await tx.sale.update({
        where: { id },
        data: {
          partnerId: dto.partnerId,
          businessDate:
            dto.businessDate === undefined
              ? undefined
              : businessDateToUtc(dto.businessDate),
          notes:
            dto.notes === undefined
              ? undefined
              : normalizeOptionalText(dto.notes),
          subtotalAmount: totals?.subtotalAmount,
          discountAmount: totals?.discountAmount,
          totalAmount: totals?.totalAmount,
          items:
            dto.items === undefined
              ? undefined
              : {
                  deleteMany: {},
                  create: dto.items.map((item, index) => {
                    const product = products!.get(item.productId)!;
                    return {
                      productId: product.id,
                      unitId: product.unit.id,
                      productCodeSnapshot: product.code,
                      productNameSnapshot: product.name,
                      unitNameSnapshot: product.unit.name,
                      ...totals!.lines[index],
                    };
                  }),
                },
        },
      });
    });
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const sale = await tx.sale.findUnique({
        where: { id },
        select: { status: true },
      });
      if (!sale) {
        throw new NotFoundException('Sale not found');
      }
      if (sale.status !== 'DRAFT') {
        throw new ConflictException('Only draft sales can be deleted');
      }
      await tx.sale.delete({ where: { id } });
    });
  }

  async post(
    id: string,
    userId: string,
    dto?: PostSaleDto,
  ): Promise<SaleResponseDto> {
    const postResult = await this.prisma.$transaction(async (tx) => {
      const sale = await tx.sale.findUnique({
        where: { id },
        include: { items: true },
      });
      if (!sale) {
        throw new NotFoundException('Sale not found');
      }
      const transitioned = await tx.sale.updateMany({
        where: { id, status: 'DRAFT' },
        data: {
          status: 'POSTED',
          postedAt: new Date(),
          postedByUserId: userId,
        },
      });
      if (transitioned.count !== 1) {
        throw new ConflictException('Sale is not a draft or already posted');
      }

      const totals = recalculateLines(
        sale.items.map((item) => ({
          quantity: decimalString(item.quantity),
          unitPrice: decimalString(item.unitPrice),
          discountAmount: item.discountAmount
            ? decimalString(item.discountAmount)
            : undefined,
          notes: item.notes ?? undefined,
        })),
        sale.discountAmount,
      );
      if (totals.totalAmount.lte(0)) {
        throw new BadRequestException(
          'Sale total must be greater than zero to post',
        );
      }
      if (sale.items.length === 0) {
        throw new BadRequestException(
          'Sale must have at least one line before posting',
        );
      }

      const overrideReason = normalizeOptionalText(dto?.negativeQuantityReason);
      const shortages = await this.checkProductShortages(
        tx,
        sale.items.map((item, index) => ({
          productId: item.productId,
          quantity: totals.lines[index].quantity,
          productCodeSnapshot: item.productCodeSnapshot,
        })),
      );
      if (shortages.length > 0 && !overrideReason) {
        throw new BadRequestException(
          `Insufficient stock for one or more products. Provide negativeQuantityReason to override. ${this.formatShortages(shortages)}`,
        );
      }

      await tx.sale.update({
        where: { id },
        data: {
          subtotalAmount: totals.subtotalAmount,
          discountAmount: totals.discountAmount,
          totalAmount: totals.totalAmount,
          negativeQuantityOverrideReason: overrideReason,
        },
      });

      const productCosts = await tx.product.findMany({
        where: {
          id: { in: [...new Set(sale.items.map((item) => item.productId))] },
        },
        select: { id: true, latestPurchasePrice: true },
      });
      const costByProduct = new Map(
        productCosts.map((product) => [
          product.id,
          product.latestPurchasePrice,
        ]),
      );

      for (let index = 0; index < sale.items.length; index += 1) {
        const item = sale.items[index];
        const line = totals.lines[index];
        const costAtPosting = costByProduct.get(item.productId) ?? null;
        await tx.saleItem.update({
          where: { id: item.id },
          data: {
            lineSubtotal: line.lineSubtotal,
            lineTotal: line.lineTotal,
            discountAmount: line.discountAmount,
            costAtPosting,
          },
        });
        await this.productQuantity.applyChange(tx, {
          productId: item.productId,
          quantityChange: line.quantity.negated(),
          kind: ProductQuantityKind.SALE,
          createdByUserId: userId,
          saleId: id,
          relatedDocumentType: 'SaleItem',
          relatedDocumentId: item.id,
          allowNegativeQuantity: true,
          reason: overrideReason ?? undefined,
        });
      }

      await this.partnerDebt.applyChange(tx, {
        partnerId: sale.partnerId,
        signedAmount: totals.totalAmount,
        kind: PartnerDebtMovementKind.SALE,
        createdByUserId: userId,
        saleId: id,
        relatedDocumentType: 'Sale',
        relatedDocumentId: id,
      });

      if (dto?.immediatePayment) {
        const payment = dto.immediatePayment;
        const cash = await this.cashBalance.applyPostedTransaction(tx, {
          cashAccountId: payment.cashAccountId,
          direction: CashTransactionDirectionValue.IN,
          type: CashTransactionTypeValue.CUSTOMER_RECEIPT,
          amount: payment.amount,
          transactionDate: sale.businessDate,
          notes: payment.notes,
          createdByUserId: userId,
          partnerId: sale.partnerId,
          saleId: id,
        });
        await this.partnerDebt.applyChange(tx, {
          partnerId: sale.partnerId,
          signedAmount: new Decimal(payment.amount).negated(),
          kind: PartnerDebtMovementKind.CASH_RECEIPT,
          createdByUserId: userId,
          cashTransactionId: cash.id,
          saleId: id,
          relatedDocumentType: 'Sale',
          relatedDocumentId: id,
        });
      }

      return {
        documentNumber: sale.documentNumber,
        amount: totals.totalAmount.toFixed(2),
      };
    });
    this.pushNotifications.notifySalePosted({
      actorUserId: userId,
      saleId: id,
      documentNumber: postResult.documentNumber,
      amount: postResult.amount,
    });
    return this.findOne(id);
  }

  async cancel(
    id: string,
    userId: string,
    dto: CancelSaleDto,
  ): Promise<SaleResponseDto> {
    const reason = dto.reason.trim();
    if (reason.length === 0) {
      throw new BadRequestException('Cancellation reason is required');
    }
    const cancelResult = await this.prisma.$transaction(async (tx) => {
      const sale = await tx.sale.findUnique({
        where: { id },
        include: { items: true },
      });
      if (!sale) {
        throw new NotFoundException('Sale not found');
      }

      const linkedCash = await tx.cashTransaction.count({
        where: {
          saleId: id,
          status: 'POSTED',
          type: { not: 'REVERSAL' },
        },
      });
      if (linkedCash > 0) {
        throw new ConflictException({
          message:
            'Cancel linked cash transactions before cancelling this sale',
          code: 'SALE_HAS_LINKED_POSTED_CASH',
        });
      }

      const transitioned = await tx.sale.updateMany({
        where: { id, status: 'POSTED' },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          cancelledByUserId: userId,
          cancelReason: reason,
        },
      });
      if (transitioned.count !== 1) {
        throw new ConflictException('Only posted sales can be cancelled');
      }
      for (const item of sale.items) {
        await this.productQuantity.applyChange(tx, {
          productId: item.productId,
          quantityChange: item.quantity,
          kind: ProductQuantityKind.CANCELLATION_REVERSAL,
          createdByUserId: userId,
          reason,
          saleId: id,
          relatedDocumentType: 'SaleItem',
          relatedDocumentId: item.id,
          allowNegativeQuantity: false,
        });
      }
      const original = await tx.businessPartnerDebtMovement.findFirst({
        where: { saleId: id, kind: 'SALE' },
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        select: { id: true },
      });
      await this.partnerDebt.applyChange(tx, {
        partnerId: sale.partnerId,
        signedAmount: sale.totalAmount.negated(),
        kind: PartnerDebtMovementKind.SALE_CANCELLATION,
        createdByUserId: userId,
        reason,
        saleId: id,
        relatedDocumentType: 'Sale',
        relatedDocumentId: id,
        reversalOfId: original?.id,
      });

      return sale.documentNumber;
    });
    this.pushNotifications.notifySaleCancelled({
      actorUserId: userId,
      saleId: id,
      documentNumber: cancelResult,
    });
    return this.findOne(id);
  }

  private async checkProductShortages(
    tx: Prisma.TransactionClient,
    lines: Array<{
      productId: string;
      quantity: Decimal;
      productCodeSnapshot: string;
    }>,
  ): Promise<ProductShortage[]> {
    const aggregated = new Map<string, { total: Decimal; code: string }>();
    for (const line of lines) {
      const existing = aggregated.get(line.productId);
      if (existing) {
        existing.total = existing.total.plus(line.quantity);
      } else {
        aggregated.set(line.productId, {
          total: line.quantity,
          code: line.productCodeSnapshot,
        });
      }
    }

    const shortages: ProductShortage[] = [];
    for (const [productId, { total, code }] of aggregated) {
      const product = await tx.product.findUnique({
        where: { id: productId },
        select: { currentQuantity: true, code: true },
      });
      if (!product) {
        throw new NotFoundException('Product not found');
      }
      const available = new Decimal(product.currentQuantity.toString());
      const after = available.minus(total);
      if (after.isNegative()) {
        shortages.push({
          code,
          available: available.toFixed(4),
          requested: total.toFixed(4),
          shortage: after.abs().toFixed(4),
        });
      }
    }
    return shortages;
  }

  private formatShortages(shortages: ProductShortage[]): string {
    return shortages
      .map(
        (s) =>
          `${s.code}: available ${s.available}, requested ${s.requested}, shortage ${s.shortage}`,
      )
      .join('; ');
  }

  private async assertValidPartner(
    tx: Prisma.TransactionClient,
    partnerId: string,
  ): Promise<void> {
    const partner = await tx.businessPartner.findUnique({
      where: { id: partnerId },
      select: { isActive: true, isCustomer: true },
    });
    if (!partner) {
      throw new NotFoundException('Business partner not found');
    }
    if (!partner.isActive || !partner.isCustomer) {
      throw new BadRequestException('Sale partner must be an active customer');
    }
  }

  private async loadAndValidateProducts(
    tx: Prisma.TransactionClient,
    items: CreateSaleItemDto[],
  ) {
    const uniqueIds = [...new Set(items.map((item) => item.productId))];
    const products = await tx.product.findMany({
      where: { id: { in: uniqueIds } },
      select: {
        id: true,
        code: true,
        name: true,
        isActive: true,
        unit: { select: { id: true, name: true } },
      },
    });
    if (products.length !== uniqueIds.length) {
      throw new NotFoundException('One or more products were not found');
    }
    if (products.some((product) => !product.isActive)) {
      throw new BadRequestException('All sale products must be active');
    }
    return new Map(products.map((product) => [product.id, product]));
  }

  private buildWhere(
    query: ListSalesQueryDto,
  ): Prisma.SaleWhereInput | undefined {
    const where: Prisma.SaleWhereInput = {};
    if (query.documentNumber?.trim()) {
      where.documentNumber = {
        contains: query.documentNumber.trim(),
        mode: 'insensitive',
      };
    }
    if (query.partnerId) where.partnerId = query.partnerId;
    if (query.status) where.status = query.status;
    if (query.createdByUserId) where.createdByUserId = query.createdByUserId;
    if (query.productId) where.items = { some: { productId: query.productId } };
    if (query.businessDateFrom || query.businessDateTo) {
      where.businessDate = businessDateFilterRange(
        query.businessDateFrom,
        query.businessDateTo,
      );
    }
    if (query.minTotal || query.maxTotal) {
      where.totalAmount = {
        gte: query.minTotal ? new Decimal(query.minTotal) : undefined,
        lte: query.maxTotal ? new Decimal(query.maxTotal) : undefined,
      };
    }
    return Object.keys(where).length === 0 ? undefined : where;
  }

  private toListResponse(row: SaleListRecord): SaleListItemResponseDto {
    return {
      id: row.id,
      documentNumber: row.documentNumber,
      businessDate: row.businessDate,
      status: row.status as DocumentStatusApi,
      subtotalAmount: decimalString(row.subtotalAmount),
      discountAmount: decimalString(row.discountAmount ?? new Decimal(0)),
      totalAmount: decimalString(row.totalAmount),
      partner: {
        id: row.partner.id,
        code: row.partner.code,
        name: row.partner.name,
        currentDebtBalance: decimalString(row.partner.currentDebtBalance),
        isCustomer: row.partner.isCustomer,
        isActive: row.partner.isActive,
      },
      createdBy: row.createdBy,
      itemCount: row._count.items,
      hasLinkedCashOperation: row.cashTransactions.length > 0,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  private toDetailResponse(row: SaleDetailRecord): SaleResponseDto {
    return {
      id: row.id,
      documentNumber: row.documentNumber,
      businessDate: row.businessDate,
      status: row.status as DocumentStatusApi,
      subtotalAmount: decimalString(row.subtotalAmount),
      discountAmount: decimalString(row.discountAmount ?? new Decimal(0)),
      totalAmount: decimalString(row.totalAmount),
      notes: row.notes,
      negativeQuantityOverrideReason: row.negativeQuantityOverrideReason,
      partner: {
        id: row.partner.id,
        code: row.partner.code,
        name: row.partner.name,
        currentDebtBalance: decimalString(row.partner.currentDebtBalance),
        isCustomer: row.partner.isCustomer,
        isActive: row.partner.isActive,
      },
      createdBy: row.createdBy,
      postedBy: row.postedBy,
      cancelledBy: row.cancelledBy,
      cancelReason: row.cancelReason,
      postedAt: row.postedAt,
      cancelledAt: row.cancelledAt,
      items: row.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        unitId: item.unitId,
        productCodeSnapshot: item.productCodeSnapshot,
        productNameSnapshot: item.productNameSnapshot,
        unitNameSnapshot: item.unitNameSnapshot,
        quantity: decimalString(item.quantity),
        unitPrice: decimalString(item.unitPrice),
        discountAmount: decimalString(item.discountAmount ?? new Decimal(0)),
        lineSubtotal: decimalString(item.lineSubtotal),
        lineTotal: decimalString(item.lineTotal),
        notes: item.notes,
        costAtPosting: item.costAtPosting
          ? decimalString(item.costAtPosting)
          : null,
      })),
      productQuantityHistory: row.productQuantityHistory.map((history) => ({
        id: history.id,
        productId: history.productId,
        kind: history.kind,
        quantityChange: decimalString(history.quantityChange),
        quantityBefore: decimalString(history.quantityBefore),
        quantityAfter: decimalString(history.quantityAfter),
        reason: history.reason,
        createdAt: history.createdAt,
      })),
      partnerDebtMovements: row.partnerDebtMovements.map((movement) => ({
        id: movement.id,
        kind: movement.kind,
        signedAmount: decimalString(movement.signedAmount),
        balanceBefore: decimalString(movement.balanceBefore),
        balanceAfter: decimalString(movement.balanceAfter),
        reason: movement.reason,
        reversalOfId: movement.reversalOfId,
        createdAt: movement.createdAt,
      })),
      cashTransactions: row.cashTransactions.map((txn) => ({
        id: txn.id,
        transactionNumber: txn.transactionNumber,
        cashAccountId: txn.cashAccountId,
        cashAccountName: txn.cashAccount.name,
        cashAccountCode: txn.cashAccount.code,
        direction: txn.direction,
        type: txn.type,
        status: txn.status,
        amount: new Decimal(txn.amount.toString()).toFixed(2),
        transactionDate: txn.transactionDate,
      })),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}

function normalizeOptionalText(
  value: string | null | undefined,
): string | null {
  if (value === undefined || value === null) return null;
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}
