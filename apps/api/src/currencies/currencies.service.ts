import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client.js';
import { SortOrder } from '../common/sorting/sort-order.enum';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCurrencyDto } from './dto/create-currency.dto';
import { CurrencyResponseDto } from './dto/currency-response.dto';
import { ListCurrenciesQueryDto } from './dto/list-currencies-query.dto';
import { PaginatedCurrenciesResponseDto } from './dto/paginated-currencies-response.dto';
import { UpdateCurrencyDto } from './dto/update-currency.dto';

const currencySelect = {
  id: true,
  code: true,
  name: true,
  symbol: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.CurrencySelect;

type CurrencyRecord = Prisma.CurrencyGetPayload<{
  select: typeof currencySelect;
}>;

@Injectable()
export class CurrenciesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCurrencyDto): Promise<CurrencyResponseDto> {
    const code = this.normalizeCode(dto.code);
    const name = this.normalizeName(dto.name);
    this.assertNonEmpty('code', code);
    this.assertNonEmpty('name', name);

    const symbol = this.normalizeOptionalSymbol(dto.symbol);

    try {
      const currency = await this.prisma.currency.create({
        data: {
          code,
          name,
          symbol,
        },
        select: currencySelect,
      });
      return this.toResponse(currency);
    } catch (error: unknown) {
      this.rethrowUniqueAsConflict(error);
      throw error;
    }
  }

  async list(
    query: ListCurrenciesQueryDto,
  ): Promise<PaginatedCurrenciesResponseDto> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const sortBy = query.sortBy ?? 'code';
    const sortOrder = query.sortOrder ?? SortOrder.ASC;

    const where = this.buildListWhere(query);

    const [data, total] = await Promise.all([
      this.prisma.currency.findMany({
        where,
        select: currencySelect,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.currency.count({ where }),
    ]);

    const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);

    return {
      data: data.map((currency) => this.toResponse(currency)),
      meta: {
        page,
        pageSize,
        total,
        totalPages,
      },
    };
  }

  async findOne(id: string): Promise<CurrencyResponseDto> {
    const currency = await this.prisma.currency.findUnique({
      where: { id },
      select: currencySelect,
    });

    if (!currency) {
      throw new NotFoundException('Currency not found');
    }

    return this.toResponse(currency);
  }

  async update(
    id: string,
    dto: UpdateCurrencyDto,
  ): Promise<CurrencyResponseDto> {
    if (!this.hasAtLeastOneUpdateField(dto)) {
      throw new BadRequestException('At least one field must be provided');
    }

    const existing = await this.prisma.currency.findUnique({
      where: { id },
      select: currencySelect,
    });

    if (!existing) {
      throw new NotFoundException('Currency not found');
    }

    const data: {
      code?: string;
      name?: string;
      symbol?: string | null;
      isActive?: boolean;
    } = {};

    if (dto.code !== undefined) {
      const code = this.normalizeCode(dto.code);
      this.assertNonEmpty('code', code);
      data.code = code;

      if (code !== existing.code) {
        const duplicate = await this.prisma.currency.findFirst({
          where: {
            code,
            NOT: { id },
          },
          select: { id: true },
        });
        if (duplicate) {
          throw new ConflictException('Currency code already exists');
        }
      }
    }

    if (dto.name !== undefined) {
      const name = this.normalizeName(dto.name);
      this.assertNonEmpty('name', name);
      data.name = name;
    }

    if (dto.symbol !== undefined) {
      data.symbol = this.normalizeOptionalSymbol(dto.symbol);
    }

    if (dto.isActive !== undefined) {
      data.isActive = dto.isActive;
    }

    try {
      const currency = await this.prisma.currency.update({
        where: { id },
        data,
        select: currencySelect,
      });
      return this.toResponse(currency);
    } catch (error: unknown) {
      this.rethrowUniqueAsConflict(error);
      throw error;
    }
  }

  async deactivate(id: string): Promise<CurrencyResponseDto> {
    const existing = await this.prisma.currency.findUnique({
      where: { id },
      select: currencySelect,
    });

    if (!existing) {
      throw new NotFoundException('Currency not found');
    }

    if (existing.isActive) {
      const currency = await this.prisma.currency.update({
        where: { id },
        data: { isActive: false },
        select: currencySelect,
      });
      return this.toResponse(currency);
    }

    return this.toResponse(existing);
  }

  private buildListWhere(
    query: ListCurrenciesQueryDto,
  ): Prisma.CurrencyWhereInput | undefined {
    const conditions: Prisma.CurrencyWhereInput[] = [];

    if (query.isActive !== undefined) {
      conditions.push({ isActive: query.isActive });
    }

    const search = query.search?.trim();
    if (search) {
      conditions.push({
        OR: [
          { code: { contains: search, mode: 'insensitive' } },
          { name: { contains: search, mode: 'insensitive' } },
          { symbol: { contains: search, mode: 'insensitive' } },
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

  private normalizeOptionalSymbol(
    symbol: string | null | undefined,
  ): string | null {
    if (symbol === undefined || symbol === null) {
      return null;
    }
    const trimmed = symbol.trim();
    return trimmed.length === 0 ? null : trimmed;
  }

  private assertNonEmpty(field: string, value: string): void {
    if (value.length === 0) {
      throw new BadRequestException(`${field} must not be empty`);
    }
  }

  private hasAtLeastOneUpdateField(dto: UpdateCurrencyDto): boolean {
    return (
      dto.code !== undefined ||
      dto.name !== undefined ||
      dto.symbol !== undefined ||
      dto.isActive !== undefined
    );
  }

  private toResponse(currency: CurrencyRecord): CurrencyResponseDto {
    return {
      id: currency.id,
      code: currency.code,
      name: currency.name,
      symbol: currency.symbol,
      isActive: currency.isActive,
      createdAt: currency.createdAt,
      updatedAt: currency.updatedAt,
    };
  }

  private rethrowUniqueAsConflict(error: unknown): void {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException('Currency code already exists');
    }
  }
}
