import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client.js';
import { SortOrder } from '../common/sorting/sort-order.enum';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUnitDto } from './dto/create-unit.dto';
import { ListUnitsQueryDto } from './dto/list-units-query.dto';
import { PaginatedUnitsResponseDto } from './dto/paginated-units-response.dto';
import { UnitResponseDto } from './dto/unit-response.dto';
import { UpdateUnitDto } from './dto/update-unit.dto';

const unitSelect = {
  id: true,
  code: true,
  name: true,
  allowsFractionalQuantity: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UnitSelect;

type UnitRecord = Prisma.UnitGetPayload<{ select: typeof unitSelect }>;

@Injectable()
export class UnitsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateUnitDto): Promise<UnitResponseDto> {
    const code = this.normalizeCode(dto.code);
    const name = this.normalizeName(dto.name);
    this.assertNonEmpty('code', code);
    this.assertNonEmpty('name', name);

    const allowsFractionalQuantity = dto.allowsFractionalQuantity ?? true;

    try {
      const unit = await this.prisma.unit.create({
        data: {
          code,
          name,
          allowsFractionalQuantity,
        },
        select: unitSelect,
      });
      return this.toResponse(unit);
    } catch (error: unknown) {
      this.rethrowUniqueAsConflict(error);
      throw error;
    }
  }

  async list(query: ListUnitsQueryDto): Promise<PaginatedUnitsResponseDto> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const sortBy = query.sortBy ?? 'code';
    const sortOrder = query.sortOrder ?? SortOrder.ASC;

    const where = this.buildListWhere(query);

    const [data, total] = await Promise.all([
      this.prisma.unit.findMany({
        where,
        select: unitSelect,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.unit.count({ where }),
    ]);

    const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);

    return {
      data: data.map((unit) => this.toResponse(unit)),
      meta: {
        page,
        pageSize,
        total,
        totalPages,
      },
    };
  }

  async findOne(id: string): Promise<UnitResponseDto> {
    const unit = await this.prisma.unit.findUnique({
      where: { id },
      select: unitSelect,
    });

    if (!unit) {
      throw new NotFoundException('Unit not found');
    }

    return this.toResponse(unit);
  }

  async update(id: string, dto: UpdateUnitDto): Promise<UnitResponseDto> {
    if (!this.hasAtLeastOneUpdateField(dto)) {
      throw new BadRequestException('At least one field must be provided');
    }

    const existing = await this.prisma.unit.findUnique({
      where: { id },
      select: unitSelect,
    });

    if (!existing) {
      throw new NotFoundException('Unit not found');
    }

    const data: {
      code?: string;
      name?: string;
      allowsFractionalQuantity?: boolean;
      isActive?: boolean;
    } = {};

    if (dto.code !== undefined) {
      const code = this.normalizeCode(dto.code);
      this.assertNonEmpty('code', code);
      data.code = code;

      if (code !== existing.code) {
        const duplicate = await this.prisma.unit.findFirst({
          where: {
            code,
            NOT: { id },
          },
          select: { id: true },
        });
        if (duplicate) {
          throw new ConflictException('Unit code already exists');
        }
      }
    }

    if (dto.name !== undefined) {
      const name = this.normalizeName(dto.name);
      this.assertNonEmpty('name', name);
      data.name = name;
    }

    if (dto.allowsFractionalQuantity !== undefined) {
      data.allowsFractionalQuantity = dto.allowsFractionalQuantity;
    }

    if (dto.isActive !== undefined) {
      data.isActive = dto.isActive;
    }

    try {
      const unit = await this.prisma.unit.update({
        where: { id },
        data,
        select: unitSelect,
      });
      return this.toResponse(unit);
    } catch (error: unknown) {
      this.rethrowUniqueAsConflict(error);
      throw error;
    }
  }

  async deactivate(id: string): Promise<UnitResponseDto> {
    const existing = await this.prisma.unit.findUnique({
      where: { id },
      select: unitSelect,
    });

    if (!existing) {
      throw new NotFoundException('Unit not found');
    }

    if (existing.isActive) {
      const unit = await this.prisma.unit.update({
        where: { id },
        data: { isActive: false },
        select: unitSelect,
      });
      return this.toResponse(unit);
    }

    return this.toResponse(existing);
  }

  private buildListWhere(
    query: ListUnitsQueryDto,
  ): Prisma.UnitWhereInput | undefined {
    const conditions: Prisma.UnitWhereInput[] = [];

    if (query.isActive !== undefined) {
      conditions.push({ isActive: query.isActive });
    }

    const search = query.search?.trim();
    if (search) {
      conditions.push({
        OR: [
          { code: { contains: search, mode: 'insensitive' } },
          { name: { contains: search, mode: 'insensitive' } },
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

  private assertNonEmpty(field: string, value: string): void {
    if (value.length === 0) {
      throw new BadRequestException(`${field} must not be empty`);
    }
  }

  private hasAtLeastOneUpdateField(dto: UpdateUnitDto): boolean {
    return (
      dto.code !== undefined ||
      dto.name !== undefined ||
      dto.allowsFractionalQuantity !== undefined ||
      dto.isActive !== undefined
    );
  }

  private toResponse(unit: UnitRecord): UnitResponseDto {
    return {
      id: unit.id,
      code: unit.code,
      name: unit.name,
      allowsFractionalQuantity: unit.allowsFractionalQuantity,
      isActive: unit.isActive,
      createdAt: unit.createdAt,
      updatedAt: unit.updatedAt,
    };
  }

  private rethrowUniqueAsConflict(error: unknown): void {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'P2002'
    ) {
      throw new ConflictException('Unit code already exists');
    }
  }
}
