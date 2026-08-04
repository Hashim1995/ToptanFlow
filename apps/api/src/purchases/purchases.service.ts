import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
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
import { CancelPurchaseDto } from './dto/cancel-purchase.dto';
import { CreatePurchaseItemDto } from './dto/create-purchase-item.dto';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { DocumentStatusApi } from './dto/document-status.enum';
import { ListPurchasesQueryDto } from './dto/list-purchases-query.dto';
import { PaginatedPurchasesResponseDto } from './dto/paginated-purchases-response.dto';
import { PostPurchaseDto } from './dto/post-purchase.dto';
import { PurchaseListItemResponseDto } from './dto/purchase-list-item-response.dto';
import { PurchaseResponseDto } from './dto/purchase-response.dto';
import { UpdatePurchaseDto } from './dto/update-purchase.dto';
import { PushNotificationsService } from '../push/push-notifications.service.js';

type CalculatedLine = {
  receivedQuantity: Decimal;
  invoicedQuantity: Decimal | null;
  unitCost: Decimal;
  discountAmount: Decimal;
  lineSubtotal: Decimal;
  lineTotal: Decimal;
  notes: string | null;
};

export function recalculateLines(
  items: Pick<
    CreatePurchaseItemDto,
    'quantity' | 'unitPrice' | 'discountAmount' | 'invoicedQuantity' | 'notes'
  >[],
  documentDiscount?: string | Decimal | null,
): {
  lines: CalculatedLine[];
  subtotalAmount: Decimal;
  discountAmount: Decimal;
  totalAmount: Decimal;
} {
  const lines = items.map((item) => {
    const receivedQuantity = new Decimal(item.quantity);
    const unitCost = new Decimal(item.unitPrice);
    const discountAmount = new Decimal(item.discountAmount ?? 0);
    const lineSubtotal = receivedQuantity.mul(unitCost).toDecimalPlaces(4);
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
      receivedQuantity: receivedQuantity.toDecimalPlaces(4),
      invoicedQuantity:
        item.invoicedQuantity === undefined
          ? null
          : new Decimal(item.invoicedQuantity).toDecimalPlaces(4),
      unitCost: unitCost.toDecimalPlaces(4),
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
    throw new BadRequestException(
      'Purchase discount cannot exceed lines total',
    );
  }
  const totalAmount = linesTotal.minus(discountAmount).toDecimalPlaces(4);
  if (totalAmount.isNegative()) {
    throw new BadRequestException('Purchase total cannot be negative');
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
  isSupplier: true,
  isActive: true,
} as const;

const purchaseItemSelect = {
  id: true,
  productId: true,
  unitId: true,
  productCodeSnapshot: true,
  productNameSnapshot: true,
  unitNameSnapshot: true,
  receivedQuantity: true,
  invoicedQuantity: true,
  unitCost: true,
  discountAmount: true,
  lineSubtotal: true,
  lineTotal: true,
  notes: true,
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

const purchaseListSelect = {
  id: true,
  documentNumber: true,
  businessDate: true,
  status: true,
  supplierInvoiceNumber: true,
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
} satisfies Prisma.PurchaseSelect;

const purchaseDetailSelect = {
  id: true,
  documentNumber: true,
  businessDate: true,
  status: true,
  supplierInvoiceNumber: true,
  subtotalAmount: true,
  discountAmount: true,
  totalAmount: true,
  notes: true,
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
    select: purchaseItemSelect,
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
} satisfies Prisma.PurchaseSelect;

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
  isSupplier: boolean;
  isActive: boolean;
};

type PurchaseItemRecord = {
  id: string;
  productId: string;
  unitId: string;
  productCodeSnapshot: string;
  productNameSnapshot: string;
  unitNameSnapshot: string;
  receivedQuantity: Decimal;
  invoicedQuantity: Decimal | null;
  unitCost: Decimal;
  discountAmount: Decimal | null;
  lineSubtotal: Decimal;
  lineTotal: Decimal;
  notes: string | null;
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

type PurchaseListRecord = {
  id: string;
  documentNumber: string;
  businessDate: Date;
  status: string;
  supplierInvoiceNumber: string | null;
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

type PurchaseDetailRecord = {
  id: string;
  documentNumber: string;
  businessDate: Date;
  status: string;
  supplierInvoiceNumber: string | null;
  subtotalAmount: Decimal;
  discountAmount: Decimal | null;
  totalAmount: Decimal;
  notes: string | null;
  postedAt: Date | null;
  cancelledAt: Date | null;
  cancelReason: string | null;
  createdAt: Date;
  updatedAt: Date;
  partner: PartnerSummaryRecord;
  createdBy: UserSummaryRecord;
  postedBy: UserSummaryRecord | null;
  cancelledBy: UserSummaryRecord | null;
  items: PurchaseItemRecord[];
  productQuantityHistory: QuantityHistoryRecord[];
  partnerDebtMovements: DebtMovementRecord[];
  cashTransactions: LinkedCashTransactionRecord[];
};

function decimalString(value: Decimal | { toString(): string }): string {
  return new Decimal(value.toString()).toFixed(4);
}

@Injectable()
export class PurchasesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly numberSequences: NumberSequencesService,
    private readonly productQuantity: ProductQuantityService,
    private readonly partnerDebt: PartnerDebtBalanceService,
    private readonly cashBalance: CashBalanceService,
    private readonly pushNotifications: PushNotificationsService,
  ) {}

  async create(
    userId: string,
    dto: CreatePurchaseDto,
  ): Promise<PurchaseResponseDto> {
    const purchaseId = await this.prisma.$transaction(async (tx) => {
      await this.assertValidPartner(tx, dto.partnerId);
      const products = await this.loadAndValidateProducts(tx, dto.items);
      const calculated = recalculateLines(dto.items, dto.discountAmount);
      const sequence = await this.numberSequences.nextCode(
        tx,
        BusinessCodeSequenceKey.PURCHASE,
      );

      const purchase = await tx.purchase.create({
        data: {
          documentNumber: `PUR-${sequence}`,
          partnerId: dto.partnerId,
          businessDate: businessDateToUtc(dto.businessDate),
          notes: normalizeOptionalText(dto.notes),
          supplierInvoiceNumber: normalizeOptionalText(
            dto.supplierInvoiceNumber,
          ),
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

      return purchase.id;
    });
    this.pushNotifications.notifyPurchaseCreated({
      actorUserId: userId,
      purchaseId,
    });
    return this.findOne(purchaseId);
  }

  async list(
    query: ListPurchasesQueryDto,
  ): Promise<PaginatedPurchasesResponseDto> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const sortBy = query.sortBy ?? 'createdAt';
    const sortOrder = query.sortOrder ?? SortOrder.DESC;
    const where = this.buildWhere(query);
    const [rows, total] = await Promise.all([
      this.prisma.purchase.findMany({
        where,
        select: purchaseListSelect,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: [{ [sortBy]: sortOrder }, { id: 'asc' }],
      }) as Promise<PurchaseListRecord[]>,
      this.prisma.purchase.count({ where }),
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

  async findOne(id: string): Promise<PurchaseResponseDto> {
    const purchase = (await this.prisma.purchase.findUnique({
      where: { id },
      select: purchaseDetailSelect,
    })) as PurchaseDetailRecord | null;
    if (!purchase) {
      throw new NotFoundException('Purchase not found');
    }
    return this.toDetailResponse(purchase);
  }

  async update(
    id: string,
    dto: UpdatePurchaseDto,
  ): Promise<PurchaseResponseDto> {
    if (!Object.values(dto).some((value) => value !== undefined)) {
      throw new BadRequestException('At least one field must be provided');
    }
    await this.prisma.$transaction(async (tx) => {
      const existing = await tx.purchase.findUnique({
        where: { id },
        include: { items: true },
      });
      if (!existing) {
        throw new NotFoundException('Purchase not found');
      }
      if (existing.status !== 'DRAFT') {
        throw new ConflictException('Only draft purchases can be updated');
      }
      if (dto.partnerId !== undefined) {
        await this.assertValidPartner(tx, dto.partnerId);
      }

      let totals: ReturnType<typeof recalculateLines> | undefined;
      let products:
        | Awaited<ReturnType<PurchasesService['loadAndValidateProducts']>>
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
            quantity: decimalString(item.receivedQuantity),
            unitPrice: decimalString(item.unitCost),
            discountAmount: item.discountAmount
              ? decimalString(item.discountAmount)
              : undefined,
            invoicedQuantity: item.invoicedQuantity
              ? decimalString(item.invoicedQuantity)
              : undefined,
            notes: item.notes ?? undefined,
          })),
          dto.discountAmount,
        );
      }

      await tx.purchase.update({
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
          supplierInvoiceNumber:
            dto.supplierInvoiceNumber === undefined
              ? undefined
              : normalizeOptionalText(dto.supplierInvoiceNumber),
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
      const purchase = await tx.purchase.findUnique({
        where: { id },
        select: { status: true },
      });
      if (!purchase) {
        throw new NotFoundException('Purchase not found');
      }
      if (purchase.status !== 'DRAFT') {
        throw new ConflictException('Only draft purchases can be deleted');
      }
      await tx.purchase.delete({ where: { id } });
    });
  }

  async post(
    id: string,
    userId: string,
    dto?: PostPurchaseDto,
  ): Promise<PurchaseResponseDto> {
    const postResult = await this.prisma.$transaction(async (tx) => {
      const purchase = await tx.purchase.findUnique({
        where: { id },
        include: { items: true },
      });
      if (!purchase) {
        throw new NotFoundException('Purchase not found');
      }
      const transitioned = await tx.purchase.updateMany({
        where: { id, status: 'DRAFT' },
        data: {
          status: 'POSTED',
          postedAt: new Date(),
          postedByUserId: userId,
        },
      });
      if (transitioned.count !== 1) {
        throw new ConflictException(
          'Purchase is not a draft or already posted',
        );
      }

      const totals = recalculateLines(
        purchase.items.map((item) => ({
          quantity: decimalString(item.receivedQuantity),
          unitPrice: decimalString(item.unitCost),
          discountAmount: item.discountAmount
            ? decimalString(item.discountAmount)
            : undefined,
          invoicedQuantity: item.invoicedQuantity
            ? decimalString(item.invoicedQuantity)
            : undefined,
          notes: item.notes ?? undefined,
        })),
        purchase.discountAmount,
      );
      if (totals.totalAmount.lte(0)) {
        throw new BadRequestException(
          'Purchase total must be greater than zero to post',
        );
      }
      if (purchase.items.length === 0) {
        throw new BadRequestException(
          'Purchase must have at least one line before posting',
        );
      }
      await tx.purchase.update({
        where: { id },
        data: {
          subtotalAmount: totals.subtotalAmount,
          discountAmount: totals.discountAmount,
          totalAmount: totals.totalAmount,
        },
      });
      for (let index = 0; index < purchase.items.length; index += 1) {
        const item = purchase.items[index];
        const line = totals.lines[index];
        await tx.purchaseItem.update({
          where: { id: item.id },
          data: {
            lineSubtotal: line.lineSubtotal,
            lineTotal: line.lineTotal,
            discountAmount: line.discountAmount,
          },
        });
        await this.productQuantity.applyChange(tx, {
          productId: item.productId,
          quantityChange: line.receivedQuantity,
          kind: ProductQuantityKind.PURCHASE,
          createdByUserId: userId,
          purchaseId: id,
          relatedDocumentType: 'PurchaseItem',
          relatedDocumentId: item.id,
          allowNegativeQuantity: true,
        });
        await tx.product.update({
          where: { id: item.productId },
          data: { latestPurchasePrice: line.unitCost },
        });
      }
      await this.partnerDebt.applyChange(tx, {
        partnerId: purchase.partnerId,
        signedAmount: totals.totalAmount.negated(),
        kind: PartnerDebtMovementKind.PURCHASE,
        createdByUserId: userId,
        purchaseId: id,
        relatedDocumentType: 'Purchase',
        relatedDocumentId: id,
      });

      if (dto?.immediatePayment) {
        const payment = dto.immediatePayment;
        const cash = await this.cashBalance.applyPostedTransaction(tx, {
          cashAccountId: payment.cashAccountId,
          direction: CashTransactionDirectionValue.OUT,
          type: CashTransactionTypeValue.SUPPLIER_PAYMENT,
          amount: payment.amount,
          transactionDate: purchase.businessDate,
          notes: payment.notes,
          createdByUserId: userId,
          partnerId: purchase.partnerId,
          purchaseId: id,
          negativeBalanceOverrideReason: payment.negativeBalanceOverrideReason,
        });
        await this.partnerDebt.applyChange(tx, {
          partnerId: purchase.partnerId,
          signedAmount: payment.amount,
          kind: PartnerDebtMovementKind.CASH_PAYMENT,
          createdByUserId: userId,
          cashTransactionId: cash.id,
          purchaseId: id,
          relatedDocumentType: 'Purchase',
          relatedDocumentId: id,
        });
      }

      return {
        documentNumber: purchase.documentNumber,
        amount: totals.totalAmount.toFixed(2),
      };
    });
    this.pushNotifications.notifyPurchasePosted({
      actorUserId: userId,
      purchaseId: id,
      documentNumber: postResult.documentNumber,
      amount: postResult.amount,
    });
    return this.findOne(id);
  }

  async cancel(
    id: string,
    userId: string,
    dto: CancelPurchaseDto,
  ): Promise<PurchaseResponseDto> {
    const reason = dto.reason.trim();
    if (reason.length === 0) {
      throw new BadRequestException('Cancellation reason is required');
    }
    const cancelResult = await this.prisma.$transaction(async (tx) => {
      const purchase = await tx.purchase.findUnique({
        where: { id },
        include: { items: true },
      });
      if (!purchase) {
        throw new NotFoundException('Purchase not found');
      }

      const linkedCash = await tx.cashTransaction.count({
        where: {
          purchaseId: id,
          status: 'POSTED',
          type: { not: 'REVERSAL' },
        },
      });
      if (linkedCash > 0) {
        throw new ConflictException({
          message:
            'Cancel linked cash transactions before cancelling this purchase',
          code: 'PURCHASE_HAS_LINKED_POSTED_CASH',
        });
      }

      const transitioned = await tx.purchase.updateMany({
        where: { id, status: 'POSTED' },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          cancelledByUserId: userId,
          cancelReason: reason,
        },
      });
      if (transitioned.count !== 1) {
        throw new ConflictException('Only posted purchases can be cancelled');
      }
      for (const item of purchase.items) {
        try {
          await this.productQuantity.applyChange(tx, {
            productId: item.productId,
            quantityChange: item.receivedQuantity.negated(),
            kind: ProductQuantityKind.CANCELLATION_REVERSAL,
            createdByUserId: userId,
            reason,
            purchaseId: id,
            relatedDocumentType: 'PurchaseItem',
            relatedDocumentId: item.id,
            allowNegativeQuantity: false,
          });
        } catch (error) {
          if (error instanceof ForbiddenException) {
            throw new ConflictException({
              message:
                'Purchase cancellation is blocked because product quantity is insufficient to reverse the original receipt. Resolve later sales or consumption first, or adjust quantity with an authorized reason.',
              code: 'PURCHASE_CANCEL_INSUFFICIENT_QUANTITY',
              productId: item.productId,
              productCode: item.productCodeSnapshot,
            });
          }
          throw error;
        }
      }
      const original = await tx.businessPartnerDebtMovement.findFirst({
        where: { purchaseId: id, kind: 'PURCHASE' },
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        select: { id: true },
      });
      await this.partnerDebt.applyChange(tx, {
        partnerId: purchase.partnerId,
        signedAmount: purchase.totalAmount,
        kind: PartnerDebtMovementKind.PURCHASE_CANCELLATION,
        createdByUserId: userId,
        reason,
        purchaseId: id,
        relatedDocumentType: 'Purchase',
        relatedDocumentId: id,
        reversalOfId: original?.id,
      });

      return purchase.documentNumber;
    });
    this.pushNotifications.notifyPurchaseCancelled({
      actorUserId: userId,
      purchaseId: id,
      documentNumber: cancelResult,
    });
    return this.findOne(id);
  }

  private async assertValidPartner(
    tx: Prisma.TransactionClient,
    partnerId: string,
  ): Promise<void> {
    const partner = await tx.businessPartner.findUnique({
      where: { id: partnerId },
      select: { isActive: true, isSupplier: true },
    });
    if (!partner) {
      throw new NotFoundException('Business partner not found');
    }
    if (!partner.isActive || !partner.isSupplier) {
      throw new BadRequestException(
        'Purchase partner must be an active supplier',
      );
    }
  }

  private async loadAndValidateProducts(
    tx: Prisma.TransactionClient,
    items: CreatePurchaseItemDto[],
  ) {
    // Same product may appear on multiple lines (e.g. different unit prices).
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
      throw new BadRequestException('All purchase products must be active');
    }
    return new Map(products.map((product) => [product.id, product]));
  }

  private buildWhere(
    query: ListPurchasesQueryDto,
  ): Prisma.PurchaseWhereInput | undefined {
    const where: Prisma.PurchaseWhereInput = {};
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

  private toListResponse(row: PurchaseListRecord): PurchaseListItemResponseDto {
    return {
      id: row.id,
      documentNumber: row.documentNumber,
      businessDate: row.businessDate,
      status: row.status as DocumentStatusApi,
      supplierInvoiceNumber: row.supplierInvoiceNumber,
      subtotalAmount: decimalString(row.subtotalAmount),
      discountAmount: decimalString(row.discountAmount ?? new Decimal(0)),
      totalAmount: decimalString(row.totalAmount),
      partner: {
        id: row.partner.id,
        code: row.partner.code,
        name: row.partner.name,
        currentDebtBalance: decimalString(row.partner.currentDebtBalance),
        isSupplier: row.partner.isSupplier,
        isActive: row.partner.isActive,
      },
      createdBy: row.createdBy,
      itemCount: row._count.items,
      hasLinkedCashOperation: row.cashTransactions.length > 0,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  private toDetailResponse(row: PurchaseDetailRecord): PurchaseResponseDto {
    return {
      id: row.id,
      documentNumber: row.documentNumber,
      businessDate: row.businessDate,
      status: row.status as DocumentStatusApi,
      supplierInvoiceNumber: row.supplierInvoiceNumber,
      subtotalAmount: decimalString(row.subtotalAmount),
      discountAmount: decimalString(row.discountAmount ?? new Decimal(0)),
      totalAmount: decimalString(row.totalAmount),
      notes: row.notes,
      partner: {
        id: row.partner.id,
        code: row.partner.code,
        name: row.partner.name,
        currentDebtBalance: decimalString(row.partner.currentDebtBalance),
        isSupplier: row.partner.isSupplier,
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
        quantity: decimalString(item.receivedQuantity),
        invoicedQuantity: item.invoicedQuantity
          ? decimalString(item.invoicedQuantity)
          : null,
        unitPrice: decimalString(item.unitCost),
        discountAmount: decimalString(item.discountAmount ?? new Decimal(0)),
        lineSubtotal: decimalString(item.lineSubtotal),
        lineTotal: decimalString(item.lineTotal),
        notes: item.notes,
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
