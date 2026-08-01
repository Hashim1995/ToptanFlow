import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client.js';
import { SortOrder } from '../common/sorting/sort-order.enum';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductCategoryDto } from './dto/create-product-category.dto';
import { ListProductCategoriesQueryDto } from './dto/list-product-categories-query.dto';
import { PaginatedProductCategoriesResponseDto } from './dto/paginated-product-categories-response.dto';
import { ProductCategoryResponseDto } from './dto/product-category-response.dto';
import { UpdateProductCategoryDto } from './dto/update-product-category.dto';

const categorySelect = {
  id: true,
  name: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ProductCategorySelect;

type CategoryRecord = Prisma.ProductCategoryGetPayload<{
  select: typeof categorySelect;
}>;

@Injectable()
export class ProductCategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    dto: CreateProductCategoryDto,
  ): Promise<ProductCategoryResponseDto> {
    const name = this.normalizeName(dto.name);
    this.assertNonEmpty('name', name);
    await this.assertNameAvailable(name);

    try {
      const category = await this.prisma.productCategory.create({
        data: { name },
        select: categorySelect,
      });
      return this.toResponse(category);
    } catch (error: unknown) {
      this.rethrowUniqueAsConflict(error);
      throw error;
    }
  }

  async list(
    query: ListProductCategoriesQueryDto,
  ): Promise<PaginatedProductCategoriesResponseDto> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const sortBy = query.sortBy ?? 'name';
    const sortOrder = query.sortOrder ?? SortOrder.ASC;
    const where = this.buildListWhere(query);

    const [data, total] = await Promise.all([
      this.prisma.productCategory.findMany({
        where,
        select: categorySelect,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.productCategory.count({ where }),
    ]);

    const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);

    return {
      data: data.map((row) => this.toResponse(row)),
      meta: { page, pageSize, total, totalPages },
    };
  }

  async findOne(id: string): Promise<ProductCategoryResponseDto> {
    const category = await this.prisma.productCategory.findUnique({
      where: { id },
      select: categorySelect,
    });
    if (!category) {
      throw new NotFoundException('Product category not found');
    }
    return this.toResponse(category);
  }

  async update(
    id: string,
    dto: UpdateProductCategoryDto,
  ): Promise<ProductCategoryResponseDto> {
    if (dto.name === undefined && dto.isActive === undefined) {
      throw new BadRequestException('At least one field must be provided');
    }

    const existing = await this.prisma.productCategory.findUnique({
      where: { id },
      select: categorySelect,
    });
    if (!existing) {
      throw new NotFoundException('Product category not found');
    }

    const data: { name?: string; isActive?: boolean } = {};
    if (dto.name !== undefined) {
      const name = this.normalizeName(dto.name);
      this.assertNonEmpty('name', name);
      await this.assertNameAvailable(name, id);
      data.name = name;
    }
    if (dto.isActive !== undefined) {
      data.isActive = dto.isActive;
    }

    try {
      const category = await this.prisma.productCategory.update({
        where: { id },
        data,
        select: categorySelect,
      });
      return this.toResponse(category);
    } catch (error: unknown) {
      this.rethrowUniqueAsConflict(error);
      throw error;
    }
  }

  async deactivate(id: string): Promise<ProductCategoryResponseDto> {
    const existing = await this.prisma.productCategory.findUnique({
      where: { id },
      select: categorySelect,
    });
    if (!existing) {
      throw new NotFoundException('Product category not found');
    }
    if (!existing.isActive) {
      return this.toResponse(existing);
    }
    const category = await this.prisma.productCategory.update({
      where: { id },
      data: { isActive: false },
      select: categorySelect,
    });
    return this.toResponse(category);
  }

  private buildListWhere(
    query: ListProductCategoriesQueryDto,
  ): Prisma.ProductCategoryWhereInput | undefined {
    const conditions: Prisma.ProductCategoryWhereInput[] = [];
    if (query.isActive !== undefined) {
      conditions.push({ isActive: query.isActive });
    }
    const search = query.search?.trim();
    if (search) {
      conditions.push({ name: { contains: search, mode: 'insensitive' } });
    }
    if (conditions.length === 0) return undefined;
    if (conditions.length === 1) return conditions[0];
    return { AND: conditions };
  }

  private async assertNameAvailable(
    name: string,
    excludeId?: string,
  ): Promise<void> {
    const clash = await this.prisma.productCategory.findFirst({
      where: {
        name: { equals: name, mode: 'insensitive' },
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
      select: { id: true },
    });
    if (clash) {
      throw new ConflictException('Product category name already exists');
    }
  }

  private normalizeName(name: string): string {
    return name.trim();
  }

  private assertNonEmpty(field: string, value: string): void {
    if (value.length === 0) {
      throw new BadRequestException(`${field} must not be empty`);
    }
  }

  private toResponse(row: CategoryRecord): ProductCategoryResponseDto {
    return {
      id: row.id,
      name: row.name,
      isActive: row.isActive,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  private rethrowUniqueAsConflict(error: unknown): void {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'P2002'
    ) {
      throw new ConflictException('Product category name already exists');
    }
  }
}
