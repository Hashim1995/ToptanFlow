import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client.js';
import { Decimal } from '@prisma/client/runtime/client';
import { SortOrder } from '../common/sorting/sort-order.enum';
import { BusinessCodeSequenceKey } from '../number-sequences/business-code-sequence-key';
import { NumberSequencesService } from '../number-sequences/number-sequences.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ListProductsQueryDto } from './dto/list-products-query.dto';
import { PaginatedProductsResponseDto } from './dto/paginated-products-response.dto';
import { ProductResponseDto } from './dto/product-response.dto';
import { ProductTypeApi } from './dto/product-type.enum';
import { AdjustProductQuantityDto } from './dto/adjust-product-quantity.dto';
import { ProductQuantityHistoryResponseDto } from './dto/adjust-product-quantity.dto';
import {
  ProductQuantityKind,
  ProductQuantityService,
} from './product-quantity.service';
import { PaginationQueryDto } from '../common/pagination/pagination-query.dto';
import { PushEventKey } from '../push/push-event-keys.js';
import { buildInventoryAdjustedBody } from '../push/push-message-builder.js';
import { PushNotificationsService } from '../push/push-notifications.service.js';

const unitSummarySelect = {
  id: true,
  code: true,
  name: true,
  allowsFractionalQuantity: true,
  isActive: true,
} satisfies Prisma.UnitSelect;

const categorySummarySelect = {
  id: true,
  name: true,
  isActive: true,
} satisfies Prisma.ProductCategorySelect;

const productSelect = {
  id: true,
  code: true,
  name: true,
  type: true,
  categoryId: true,
  unitId: true,
  standardSalePrice: true,
  latestPurchasePrice: true,
  currentQuantity: true,
  criticalStockThreshold: true,
  barcode: true,
  notes: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  unit: { select: unitSummarySelect },
  category: { select: categorySummarySelect },
} satisfies Prisma.ProductSelect;

type ProductRecord = Prisma.ProductGetPayload<{ select: typeof productSelect }>;

type ProductQuantityHistoryRecord = {
  id: string;
  productId: string;
  kind: string;
  quantityChange: Decimal;
  quantityBefore: Decimal;
  quantityAfter: Decimal;
  reason: string | null;
  saleId: string | null;
  purchaseId: string | null;
  createdByUserId: string;
  createdAt: Date;
};

type ProductQuantityHistoryReader = {
  productQuantityHistory: {
    findMany(args: {
      where: { productId: string };
      orderBy: Array<{ createdAt: 'desc' } | { id: 'desc' }>;
      skip: number;
      take: number;
    }): Promise<ProductQuantityHistoryRecord[]>;
    count(args: { where: { productId: string } }): Promise<number>;
  };
};

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly numberSequences: NumberSequencesService,
    private readonly productQuantity: ProductQuantityService,
    private readonly pushNotifications: PushNotificationsService,
  ) {}

  async create(dto: CreateProductDto): Promise<ProductResponseDto> {
    const name = this.normalizeName(dto.name);
    this.assertNonEmpty('name', name);
    await this.assertUnitAssignable(dto.unitId);
    const categoryId = await this.resolveCategoryId(dto.categoryId);

    try {
      const product = await this.prisma.$transaction(async (tx) => {
        const code = await this.numberSequences.nextCode(
          tx,
          BusinessCodeSequenceKey.PRODUCT,
        );

        return tx.product.create({
          data: {
            code,
            name,
            type: dto.type,
            categoryId,
            unitId: dto.unitId,
            standardSalePrice: this.toPrismaDecimal(dto.standardSalePrice),
            latestPurchasePrice: this.toPrismaDecimal(dto.latestPurchasePrice),
            criticalStockThreshold: this.toPrismaDecimal(
              dto.criticalStockThreshold,
            ),
            barcode: this.normalizeOptionalText(dto.barcode),
            notes: this.normalizeOptionalText(dto.notes),
            currentQuantity: new Decimal(0),
            isActive: true,
          },
          select: productSelect,
        });
      });
      return this.toResponse(product);
    } catch (error: unknown) {
      this.rethrowUniqueAsConflict(error);
      throw error;
    }
  }

  async list(
    query: ListProductsQueryDto,
  ): Promise<PaginatedProductsResponseDto> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const sortBy = query.sortBy ?? 'code';
    const sortOrder = query.sortOrder ?? SortOrder.ASC;
    const where = this.buildListWhere(query);

    const [data, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        select: productSelect,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: [{ [sortBy]: sortOrder }, { id: 'asc' }],
      }),
      this.prisma.product.count({ where }),
    ]);

    const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);

    return {
      data: data.map((product) => this.toResponse(product)),
      meta: { page, pageSize, total, totalPages },
    };
  }

  async findOne(id: string): Promise<ProductResponseDto> {
    const product = await this.prisma.product.findUnique({
      where: { id },
      select: productSelect,
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return this.toResponse(product);
  }

  async update(id: string, dto: UpdateProductDto): Promise<ProductResponseDto> {
    if (!this.hasAtLeastOneUpdateField(dto)) {
      throw new BadRequestException('At least one field must be provided');
    }

    const existing = await this.prisma.product.findUnique({
      where: { id },
      select: productSelect,
    });
    if (!existing) {
      throw new NotFoundException('Product not found');
    }

    const data: {
      name?: string;
      type?: ProductTypeApi;
      categoryId?: string | null;
      unitId?: string;
      standardSalePrice?: Decimal | null;
      latestPurchasePrice?: Decimal | null;
      criticalStockThreshold?: Decimal | null;
      barcode?: string | null;
      notes?: string | null;
      isActive?: boolean;
    } = {};

    if (dto.name !== undefined) {
      const name = this.normalizeName(dto.name);
      this.assertNonEmpty('name', name);
      data.name = name;
    }
    if (dto.type !== undefined) {
      data.type = dto.type;
    }
    if (dto.categoryId !== undefined) {
      data.categoryId = await this.resolveCategoryId(dto.categoryId);
    }
    if (dto.unitId !== undefined) {
      await this.assertUnitAssignable(dto.unitId);
      data.unitId = dto.unitId;
    }
    if (dto.standardSalePrice !== undefined) {
      data.standardSalePrice = this.toPrismaDecimalOrNull(
        dto.standardSalePrice,
      );
    }
    if (dto.latestPurchasePrice !== undefined) {
      data.latestPurchasePrice = this.toPrismaDecimalOrNull(
        dto.latestPurchasePrice,
      );
    }
    if (dto.criticalStockThreshold !== undefined) {
      data.criticalStockThreshold = this.toPrismaDecimalOrNull(
        dto.criticalStockThreshold,
      );
    }
    if (dto.barcode !== undefined) {
      data.barcode = this.normalizeOptionalText(dto.barcode);
    }
    if (dto.notes !== undefined) {
      data.notes = this.normalizeOptionalText(dto.notes);
    }
    if (dto.isActive !== undefined) {
      data.isActive = dto.isActive;
    }

    try {
      const product = await this.prisma.product.update({
        where: { id },
        data,
        select: productSelect,
      });
      return this.toResponse(product);
    } catch (error: unknown) {
      this.rethrowUniqueAsConflict(error);
      throw error;
    }
  }

  async deactivate(id: string): Promise<ProductResponseDto> {
    const existing = await this.prisma.product.findUnique({
      where: { id },
      select: productSelect,
    });
    if (!existing) {
      throw new NotFoundException('Product not found');
    }
    if (existing.isActive) {
      const product = await this.prisma.product.update({
        where: { id },
        data: { isActive: false },
        select: productSelect,
      });
      return this.toResponse(product);
    }
    return this.toResponse(existing);
  }

  /**
   * Manual quantity adjustment (ADR-029). Always requires a reason.
   * Under ADR-025 v1, every active user may post negative results with reason.
   */
  async adjustQuantity(
    productId: string,
    dto: AdjustProductQuantityDto,
    userId: string,
  ): Promise<ProductResponseDto> {
    const adjustResult = await this.prisma.$transaction(async (tx) => {
      const change = await this.productQuantity.applyChange(tx, {
        productId,
        quantityChange: dto.quantityChange,
        kind: ProductQuantityKind.MANUAL_ADJUSTMENT,
        createdByUserId: userId,
        reason: dto.reason,
        allowNegativeQuantity: true,
      });

      const actorName = await this.pushNotifications.resolveActorName(
        tx,
        userId,
      );
      const eventId = await this.pushNotifications.enqueueInTransaction(tx, {
        idempotencyKey: `inventory.adjust:${change.historyId}`,
        eventKey: PushEventKey.INVENTORY_QUANTITY_ADJUSTED,
        actorUserId: userId,
        body: buildInventoryAdjustedBody({ actorName }),
      });
      return { eventId };
    });
    this.pushNotifications.scheduleDispatch(adjustResult.eventId);
    return this.findOne(productId);
  }

  async listQuantityHistory(
    productId: string,
    query: PaginationQueryDto,
  ): Promise<{
    data: ProductQuantityHistoryResponseDto[];
    meta: { page: number; pageSize: number; total: number; totalPages: number };
  }> {
    const existing = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { id: true },
    });
    if (!existing) {
      throw new NotFoundException('Product not found');
    }

    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where = { productId };
    const historyReader = this
      .prisma as unknown as ProductQuantityHistoryReader;

    const [rows, total] = await Promise.all([
      historyReader.productQuantityHistory.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      historyReader.productQuantityHistory.count({ where }),
    ]);

    const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);

    return {
      data: rows.map((row) => ({
        id: row.id,
        productId: row.productId,
        kind: row.kind,
        quantityChange: this.decimalToStringRequired(row.quantityChange),
        quantityBefore: this.decimalToStringRequired(row.quantityBefore),
        quantityAfter: this.decimalToStringRequired(row.quantityAfter),
        reason: row.reason,
        saleId: row.saleId,
        purchaseId: row.purchaseId,
        createdByUserId: row.createdByUserId,
        createdAt: row.createdAt,
      })),
      meta: { page, pageSize, total, totalPages },
    };
  }

  private async resolveCategoryId(
    categoryId: string | null | undefined,
  ): Promise<string | null> {
    if (categoryId === undefined || categoryId === null) {
      return null;
    }
    await this.assertCategoryAssignable(categoryId);
    return categoryId;
  }

  private async assertCategoryAssignable(categoryId: string): Promise<void> {
    const category = await this.prisma.productCategory.findUnique({
      where: { id: categoryId },
      select: { id: true, isActive: true },
    });
    if (!category) {
      throw new NotFoundException('Product category not found');
    }
    if (!category.isActive) {
      throw new BadRequestException('Product category is inactive');
    }
  }

  private async assertUnitAssignable(unitId: string): Promise<void> {
    const unit = await this.prisma.unit.findUnique({
      where: { id: unitId },
      select: { id: true, isActive: true },
    });
    if (!unit) {
      throw new NotFoundException('Unit not found');
    }
    if (!unit.isActive) {
      throw new BadRequestException('Unit is inactive');
    }
  }

  private buildListWhere(
    query: ListProductsQueryDto,
  ): Prisma.ProductWhereInput | undefined {
    const conditions: Prisma.ProductWhereInput[] = [];

    if (query.isActive !== undefined) {
      conditions.push({ isActive: query.isActive });
    }
    if (query.type !== undefined) {
      conditions.push({ type: query.type });
    }
    if (query.unitId !== undefined) {
      conditions.push({ unitId: query.unitId });
    }
    if (query.categoryId !== undefined) {
      conditions.push({ categoryId: query.categoryId });
    }

    const search = query.search?.trim();
    if (search) {
      conditions.push({
        OR: [
          { code: { contains: search, mode: 'insensitive' } },
          { name: { contains: search, mode: 'insensitive' } },
          { category: { name: { contains: search, mode: 'insensitive' } } },
        ],
      });
    }

    if (conditions.length === 0) return undefined;
    if (conditions.length === 1) return conditions[0];
    return { AND: conditions };
  }

  private normalizeName(name: string): string {
    return name.trim();
  }

  private assertNonEmpty(field: string, value: string): void {
    if (value.length === 0) {
      throw new BadRequestException(`${field} must not be empty`);
    }
  }

  private toPrismaDecimal(value: string | undefined): Decimal | null {
    if (value === undefined) return null;
    return new Decimal(value);
  }

  private toPrismaDecimalOrNull(value: string | null): Decimal | null {
    if (value === null) return null;
    return new Decimal(value);
  }

  private hasAtLeastOneUpdateField(dto: UpdateProductDto): boolean {
    return (
      dto.name !== undefined ||
      dto.type !== undefined ||
      dto.categoryId !== undefined ||
      dto.unitId !== undefined ||
      dto.standardSalePrice !== undefined ||
      dto.latestPurchasePrice !== undefined ||
      dto.criticalStockThreshold !== undefined ||
      dto.barcode !== undefined ||
      dto.notes !== undefined ||
      dto.isActive !== undefined
    );
  }

  private normalizeOptionalText(value: unknown): string | null {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    return trimmed.length === 0 ? null : trimmed;
  }

  private decimalToString(value: Decimal | null | undefined): string | null {
    if (value === null || value === undefined) return null;
    return value.toFixed(4);
  }

  private decimalToStringRequired(value: Decimal): string {
    return value.toFixed(4);
  }

  private toResponse(product: ProductRecord): ProductResponseDto {
    return {
      id: product.id,
      code: product.code,
      name: product.name,
      type: product.type as ProductTypeApi,
      categoryId: product.categoryId,
      category: product.category
        ? {
            id: product.category.id,
            name: product.category.name,
            isActive: product.category.isActive,
          }
        : null,
      unitId: product.unitId,
      unit: {
        id: product.unit.id,
        code: product.unit.code,
        name: product.unit.name,
        allowsFractionalQuantity: product.unit.allowsFractionalQuantity,
        isActive: product.unit.isActive,
      },
      standardSalePrice: this.decimalToString(product.standardSalePrice),
      latestPurchasePrice: this.decimalToString(product.latestPurchasePrice),
      currentQuantity: this.decimalToStringRequired(product.currentQuantity),
      criticalStockThreshold: this.decimalToString(
        product.criticalStockThreshold,
      ),
      barcode: product.barcode,
      notes: product.notes,
      isActive: product.isActive,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }

  private rethrowUniqueAsConflict(error: unknown): void {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'P2002'
    ) {
      throw new ConflictException('Product code already exists');
    }
  }
}
