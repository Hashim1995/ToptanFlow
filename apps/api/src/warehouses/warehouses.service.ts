import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client.js';
import { SortOrder } from '../common/sorting/sort-order.enum';
import { BusinessCodeSequenceKey } from '../number-sequences/business-code-sequence-key';
import { NumberSequencesService } from '../number-sequences/number-sequences.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { ListWarehousesQueryDto } from './dto/list-warehouses-query.dto';
import { PaginatedWarehousesResponseDto } from './dto/paginated-warehouses-response.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';
import { WarehouseKindApi } from './dto/warehouse-kind.enum';
import { WarehouseResponseDto } from './dto/warehouse-response.dto';

const warehouseSelect = {
  id: true,
  code: true,
  name: true,
  kind: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.WarehouseSelect;

type WarehouseRecord = Prisma.WarehouseGetPayload<{
  select: typeof warehouseSelect;
}>;

@Injectable()
export class WarehousesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly numberSequences: NumberSequencesService,
  ) {}

  async create(dto: CreateWarehouseDto): Promise<WarehouseResponseDto> {
    const name = this.normalizeName(dto.name);
    this.assertNonEmpty('name', name);

    try {
      const warehouse = await this.prisma.$transaction(async (tx) => {
        const code = await this.numberSequences.nextCode(
          tx,
          BusinessCodeSequenceKey.WAREHOUSE,
        );

        return tx.warehouse.create({
          data: {
            code,
            name,
            kind: dto.kind,
            isActive: true,
          },
          select: warehouseSelect,
        });
      });
      return this.toResponse(warehouse);
    } catch (error: unknown) {
      this.rethrowUniqueAsConflict(error);
      throw error;
    }
  }

  async list(
    query: ListWarehousesQueryDto,
  ): Promise<PaginatedWarehousesResponseDto> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const sortBy = query.sortBy ?? 'code';
    const sortOrder = query.sortOrder ?? SortOrder.ASC;
    const where = this.buildListWhere(query);

    const [data, total] = await Promise.all([
      this.prisma.warehouse.findMany({
        where,
        select: warehouseSelect,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: [{ [sortBy]: sortOrder }, { id: 'asc' }],
      }),
      this.prisma.warehouse.count({ where }),
    ]);

    const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);

    return {
      data: data.map((row) => this.toResponse(row)),
      meta: { page, pageSize, total, totalPages },
    };
  }

  async findOne(id: string): Promise<WarehouseResponseDto> {
    const warehouse = await this.prisma.warehouse.findUnique({
      where: { id },
      select: warehouseSelect,
    });
    if (!warehouse) {
      throw new NotFoundException('Warehouse not found');
    }
    return this.toResponse(warehouse);
  }

  async update(
    id: string,
    dto: UpdateWarehouseDto,
  ): Promise<WarehouseResponseDto> {
    if (
      dto.name === undefined &&
      dto.kind === undefined &&
      dto.isActive === undefined
    ) {
      throw new BadRequestException('At least one field must be provided');
    }

    const existing = await this.prisma.warehouse.findUnique({
      where: { id },
      select: warehouseSelect,
    });
    if (!existing) {
      throw new NotFoundException('Warehouse not found');
    }

    const data: {
      name?: string;
      kind?: WarehouseKindApi;
      isActive?: boolean;
    } = {};

    if (dto.name !== undefined) {
      const name = this.normalizeName(dto.name);
      this.assertNonEmpty('name', name);
      data.name = name;
    }
    if (dto.kind !== undefined) {
      data.kind = dto.kind;
    }
    if (dto.isActive !== undefined) {
      data.isActive = dto.isActive;
    }

    try {
      const warehouse = await this.prisma.warehouse.update({
        where: { id },
        data,
        select: warehouseSelect,
      });
      return this.toResponse(warehouse);
    } catch (error: unknown) {
      this.rethrowUniqueAsConflict(error);
      throw error;
    }
  }

  async deactivate(id: string): Promise<WarehouseResponseDto> {
    const existing = await this.prisma.warehouse.findUnique({
      where: { id },
      select: warehouseSelect,
    });
    if (!existing) {
      throw new NotFoundException('Warehouse not found');
    }
    if (!existing.isActive) {
      return this.toResponse(existing);
    }
    const warehouse = await this.prisma.warehouse.update({
      where: { id },
      data: { isActive: false },
      select: warehouseSelect,
    });
    return this.toResponse(warehouse);
  }

  private buildListWhere(
    query: ListWarehousesQueryDto,
  ): Prisma.WarehouseWhereInput | undefined {
    const conditions: Prisma.WarehouseWhereInput[] = [];
    if (query.isActive !== undefined) {
      conditions.push({ isActive: query.isActive });
    }
    if (query.kind !== undefined) {
      conditions.push({ kind: query.kind });
    }
    const search = query.search?.trim();
    if (search) {
      conditions.push({
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { code: { contains: search, mode: 'insensitive' } },
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

  private toResponse(row: WarehouseRecord): WarehouseResponseDto {
    return {
      id: row.id,
      code: row.code,
      name: row.name,
      kind: row.kind as WarehouseKindApi,
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
      throw new ConflictException('Warehouse code already exists');
    }
  }
}
