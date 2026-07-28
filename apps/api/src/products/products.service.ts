import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { SortOrder } from '../common/sorting/sort-order.enum';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
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
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateProductDto): Promise<ProductResponseDto> {
    const code = this.normalizeCode(dto.code);
    const name = this.normalizeName(dto.name);
    this.assertNonEmpty('code', code);
    this.assertNonEmpty('name', name);

    const category = this.normalizeOptionalCategory(dto.category);
    await this.assertUnitAssignable(dto.unitId);

    try {
      const product = await this.prisma.product.create({
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

  private normalizeCode(code: string): string {
    return code.trim().toUpperCase();
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

  private toPrismaDecimal(value: string | undefined): Prisma.Decimal | null {
    if (value === undefined) {
      return null;
    }
    return new Prisma.Decimal(value);
  }

  private decimalToString(
    value: Prisma.Decimal | null | undefined,
  ): string | null {
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
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException('Product code already exists');
    }
  }
}
