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

const unitSummarySelect = {
  id: true,
  code: true,
  name: true,
  allowsFractionalQuantity: true,
  isActive: true,
} satisfies Prisma.UnitSelect;

const productSelect = {
  id: true,
  code: true,
  name: true,
  type: true,
  category: true,
  unitId: true,
  standardSalePrice: true,
  latestPurchasePrice: true,
  criticalStockThreshold: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  unit: {
    select: unitSummarySelect,
  },
} satisfies Prisma.ProductSelect;

type ProductRecord = Prisma.ProductGetPayload<{ select: typeof productSelect }>;

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly numberSequences: NumberSequencesService,
  ) {}

  async create(dto: CreateProductDto): Promise<ProductResponseDto> {
    const name = this.normalizeName(dto.name);
    this.assertNonEmpty('name', name);

    const category = this.normalizeOptionalCategory(dto.category);
    await this.assertUnitAssignable(dto.unitId);

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
            category,
            unitId: dto.unitId,
            standardSalePrice: this.toPrismaDecimal(dto.standardSalePrice),
            latestPurchasePrice: this.toPrismaDecimal(dto.latestPurchasePrice),
            criticalStockThreshold: this.toPrismaDecimal(
              dto.criticalStockThreshold,
            ),
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
      meta: {
        page,
        pageSize,
        total,
        totalPages,
      },
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
      category?: string | null;
      unitId?: string;
      standardSalePrice?: Decimal | null;
      latestPurchasePrice?: Decimal | null;
      criticalStockThreshold?: Decimal | null;
    } = {};

    if (dto.name !== undefined) {
      const name = this.normalizeName(dto.name);
      this.assertNonEmpty('name', name);
      data.name = name;
    }

    if (dto.type !== undefined) {
      data.type = dto.type;
    }

    if (dto.category !== undefined) {
      data.category = this.normalizeOptionalCategory(dto.category);
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

    const category = query.category?.trim();
    if (category) {
      conditions.push({
        category: { equals: category, mode: 'insensitive' },
      });
    }

    const search = query.search?.trim();
    if (search) {
      conditions.push({
        OR: [
          { code: { contains: search, mode: 'insensitive' } },
          { name: { contains: search, mode: 'insensitive' } },
          { category: { contains: search, mode: 'insensitive' } },
        ],
      });
    }

    if (conditions.length === 0) {
      return undefined;
    }

    if (conditions.length === 1) {
      return conditions[0];
    }

    return { AND: conditions };
  }

  private normalizeName(name: string): string {
    return name.trim();
  }

  private normalizeOptionalCategory(
    category: string | null | undefined,
  ): string | null {
    if (category === undefined || category === null) {
      return null;
    }
    const trimmed = category.trim();
    return trimmed.length === 0 ? null : trimmed;
  }

  private assertNonEmpty(field: string, value: string): void {
    if (value.length === 0) {
      throw new BadRequestException(`${field} must not be empty`);
    }
  }

  private toPrismaDecimal(value: string | undefined): Decimal | null {
    if (value === undefined) {
      return null;
    }
    return new Decimal(value);
  }

  private toPrismaDecimalOrNull(value: string | null): Decimal | null {
    if (value === null) {
      return null;
    }
    return new Decimal(value);
  }

  private hasAtLeastOneUpdateField(dto: UpdateProductDto): boolean {
    return (
      dto.name !== undefined ||
      dto.type !== undefined ||
      dto.category !== undefined ||
      dto.unitId !== undefined ||
      dto.standardSalePrice !== undefined ||
      dto.latestPurchasePrice !== undefined ||
      dto.criticalStockThreshold !== undefined
    );
  }

  private decimalToString(value: Decimal | null | undefined): string | null {
    if (value === null || value === undefined) {
      return null;
    }
    return value.toFixed(4);
  }

  private toResponse(product: ProductRecord): ProductResponseDto {
    return {
      id: product.id,
      code: product.code,
      name: product.name,
      type: product.type as ProductTypeApi,
      category: product.category,
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
      criticalStockThreshold: this.decimalToString(
        product.criticalStockThreshold,
      ),
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
