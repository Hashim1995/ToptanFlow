import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client.js';
import {
  toApiDateTime,
  toApiDateTimeOrNull,
} from '../common/datetime/baku-datetime.js';
import { SortOrder } from '../common/sorting/sort-order.enum';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateExpenseCategoryDto,
  DeactivateExpenseCategoryDto,
  ExpenseCategoryResponseDto,
  UpdateExpenseCategoryDto,
} from './dto/expense-category.dto';
import { ListExpenseCategoriesQueryDto } from './dto/list-expense-categories-query.dto';

const categorySelect = {
  id: true,
  name: true,
  isActive: true,
  deactivatedAt: true,
  deactivationReason: true,
  createdAt: true,
  updatedAt: true,
  createdByUserId: true,
} satisfies Prisma.ExpenseCategorySelect;

type CategoryRecord = Prisma.ExpenseCategoryGetPayload<{
  select: typeof categorySelect;
}>;

@Injectable()
export class ExpenseCategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    dto: CreateExpenseCategoryDto,
    actorUserId: string,
  ): Promise<ExpenseCategoryResponseDto> {
    const name = dto.name.trim();
    if (!name) {
      throw new BadRequestException('name must not be empty');
    }
    try {
      const row = await this.prisma.expenseCategory.create({
        data: {
          name,
          createdByUserId: actorUserId,
        },
        select: categorySelect,
      });
      return this.toResponse(row);
    } catch (error) {
      this.rethrowUniqueConflict(error);
      throw error;
    }
  }

  async list(query: ListExpenseCategoriesQueryDto): Promise<{
    data: ExpenseCategoryResponseDto[];
    meta: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    };
  }> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where: Prisma.ExpenseCategoryWhereInput = {};
    if (query.isActive !== undefined) where.isActive = query.isActive;
    if (query.search) {
      where.name = { contains: query.search, mode: 'insensitive' };
    }
    const sortBy = query.sortBy ?? 'name';
    const sortOrder = query.sortOrder === SortOrder.DESC ? 'desc' : 'asc';

    const [rows, total] = await Promise.all([
      this.prisma.expenseCategory.findMany({
        where,
        select: categorySelect,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.expenseCategory.count({ where }),
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

  async getById(id: string): Promise<ExpenseCategoryResponseDto> {
    const row = await this.prisma.expenseCategory.findUnique({
      where: { id },
      select: categorySelect,
    });
    if (!row) {
      throw new NotFoundException({
        message: 'Expense category not found',
        code: 'EXPENSE_CATEGORY_NOT_FOUND',
      });
    }
    return this.toResponse(row);
  }

  async update(
    id: string,
    dto: UpdateExpenseCategoryDto,
  ): Promise<ExpenseCategoryResponseDto> {
    await this.getById(id);
    if (dto.name === undefined) {
      throw new BadRequestException('At least one field must be provided');
    }
    const name = dto.name.trim();
    if (!name) {
      throw new BadRequestException('name must not be empty');
    }
    try {
      const row = await this.prisma.expenseCategory.update({
        where: { id },
        data: { name },
        select: categorySelect,
      });
      return this.toResponse(row);
    } catch (error) {
      this.rethrowUniqueConflict(error);
      throw error;
    }
  }

  async deactivate(
    id: string,
    dto?: DeactivateExpenseCategoryDto,
  ): Promise<ExpenseCategoryResponseDto> {
    const existing = await this.getById(id);
    if (!existing.isActive) return existing;
    const row = await this.prisma.expenseCategory.update({
      where: { id },
      data: {
        isActive: false,
        deactivatedAt: new Date(),
        deactivationReason: dto?.reason?.trim() || null,
      },
      select: categorySelect,
    });
    return this.toResponse(row);
  }

  async reactivate(id: string): Promise<ExpenseCategoryResponseDto> {
    const existing = await this.getById(id);
    if (existing.isActive) return existing;
    const row = await this.prisma.expenseCategory.update({
      where: { id },
      data: {
        isActive: true,
        deactivatedAt: null,
        deactivationReason: null,
      },
      select: categorySelect,
    });
    return this.toResponse(row);
  }

  async assertActiveCategory(id: string): Promise<void> {
    const row = await this.prisma.expenseCategory.findUnique({
      where: { id },
      select: { id: true, isActive: true },
    });
    if (!row) {
      throw new NotFoundException({
        message: 'Expense category not found',
        code: 'EXPENSE_CATEGORY_NOT_FOUND',
      });
    }
    if (!row.isActive) {
      throw new BadRequestException({
        message: 'Expense category is inactive',
        code: 'EXPENSE_CATEGORY_INACTIVE',
      });
    }
  }

  private toResponse(row: CategoryRecord): ExpenseCategoryResponseDto {
    return {
      id: row.id,
      name: row.name,
      isActive: row.isActive,
      deactivatedAt: toApiDateTimeOrNull(row.deactivatedAt),
      deactivationReason: row.deactivationReason,
      createdAt: toApiDateTime(row.createdAt),
      updatedAt: toApiDateTime(row.updatedAt),
      createdByUserId: row.createdByUserId,
    };
  }

  private rethrowUniqueConflict(error: unknown): void {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code: string }).code === 'P2002'
    ) {
      throw new ConflictException({
        message: 'Expense category name already exists',
        code: 'EXPENSE_CATEGORY_NAME_CONFLICT',
      });
    }
  }
}
