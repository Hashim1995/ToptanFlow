import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client.js';
import { SortOrder } from '../common/sorting/sort-order.enum';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBusinessPartnerDto } from './dto/create-business-partner.dto';
import { ListBusinessPartnersQueryDto } from './dto/list-business-partners-query.dto';
import { PaginatedBusinessPartnersResponseDto } from './dto/paginated-business-partners-response.dto';
import { BusinessPartnerResponseDto } from './dto/business-partner-response.dto';

const currencySummarySelect = {
  id: true,
  code: true,
  name: true,
  symbol: true,
  isActive: true,
} satisfies Prisma.CurrencySelect;

const businessPartnerSelect = {
  id: true,
  code: true,
  name: true,
  isCustomer: true,
  isSupplier: true,
  phone: true,
  email: true,
  taxNumber: true,
  address: true,
  notes: true,
  defaultCurrencyId: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  defaultCurrency: {
    select: currencySummarySelect,
  },
} satisfies Prisma.BusinessPartnerSelect;

type BusinessPartnerRecord = Prisma.BusinessPartnerGetPayload<{
  select: typeof businessPartnerSelect;
}>;

@Injectable()
export class BusinessPartnersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    dto: CreateBusinessPartnerDto,
  ): Promise<BusinessPartnerResponseDto> {
    const code = this.normalizeCode(dto.code);
    const name = this.normalizeName(dto.name);
    this.assertNonEmpty('code', code);
    this.assertNonEmpty('name', name);
    this.assertAtLeastOneRole(dto.isCustomer, dto.isSupplier);

    await this.assertCurrencyAssignable(dto.defaultCurrencyId);

    try {
      const partner = await this.prisma.businessPartner.create({
        data: {
          code,
          name,
          isCustomer: dto.isCustomer,
          isSupplier: dto.isSupplier,
          phone: this.normalizeOptionalText(dto.phone),
          email: this.normalizeOptionalText(dto.email),
          taxNumber: this.normalizeOptionalText(dto.taxNumber),
          address: this.normalizeOptionalText(dto.address),
          notes: this.normalizeOptionalText(dto.notes),
          defaultCurrencyId: dto.defaultCurrencyId,
          isActive: true,
        },
        select: businessPartnerSelect,
      });
      return this.toResponse(partner);
    } catch (error: unknown) {
      this.rethrowUniqueAsConflict(error);
      throw error;
    }
  }

  async list(
    query: ListBusinessPartnersQueryDto,
  ): Promise<PaginatedBusinessPartnersResponseDto> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const sortBy = query.sortBy ?? 'code';
    const sortOrder = query.sortOrder ?? SortOrder.ASC;

    const where = this.buildListWhere(query);

    const [data, total] = await Promise.all([
      this.prisma.businessPartner.findMany({
        where,
        select: businessPartnerSelect,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: [{ [sortBy]: sortOrder }, { id: 'asc' }],
      }),
      this.prisma.businessPartner.count({ where }),
    ]);

    const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);

    return {
      data: data.map((partner) => this.toResponse(partner)),
      meta: {
        page,
        pageSize,
        total,
        totalPages,
      },
    };
  }

  async findOne(id: string): Promise<BusinessPartnerResponseDto> {
    const partner = await this.prisma.businessPartner.findUnique({
      where: { id },
      select: businessPartnerSelect,
    });

    if (!partner) {
      throw new NotFoundException('Business partner not found');
    }

    return this.toResponse(partner);
  }

  private async assertCurrencyAssignable(currencyId: string): Promise<void> {
    const currency = await this.prisma.currency.findUnique({
      where: { id: currencyId },
      select: { id: true, isActive: true },
    });

    if (!currency) {
      throw new NotFoundException('Currency not found');
    }

    if (!currency.isActive) {
      throw new BadRequestException('Currency is inactive');
    }
  }

  private assertAtLeastOneRole(isCustomer: boolean, isSupplier: boolean): void {
    if (!isCustomer && !isSupplier) {
      throw new BadRequestException(
        'Business partner must have at least one role',
      );
    }
  }

  private buildListWhere(
    query: ListBusinessPartnersQueryDto,
  ): Prisma.BusinessPartnerWhereInput | undefined {
    const conditions: Prisma.BusinessPartnerWhereInput[] = [];

    if (query.isActive !== undefined) {
      conditions.push({ isActive: query.isActive });
    }

    if (query.isCustomer !== undefined) {
      conditions.push({ isCustomer: query.isCustomer });
    }

    if (query.isSupplier !== undefined) {
      conditions.push({ isSupplier: query.isSupplier });
    }

    if (query.defaultCurrencyId !== undefined) {
      conditions.push({ defaultCurrencyId: query.defaultCurrencyId });
    }

    const search = query.search?.trim();
    if (search) {
      conditions.push({
        OR: [
          { code: { contains: search, mode: 'insensitive' } },
          { name: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { taxNumber: { contains: search, mode: 'insensitive' } },
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

  private normalizeOptionalText(
    value: string | null | undefined,
  ): string | null {
    if (value === undefined || value === null) {
      return null;
    }
    const trimmed = value.trim();
    return trimmed.length === 0 ? null : trimmed;
  }

  private assertNonEmpty(field: string, value: string): void {
    if (value.length === 0) {
      throw new BadRequestException(`${field} must not be empty`);
    }
  }

  private toResponse(
    partner: BusinessPartnerRecord,
  ): BusinessPartnerResponseDto {
    return {
      id: partner.id,
      code: partner.code,
      name: partner.name,
      isCustomer: partner.isCustomer,
      isSupplier: partner.isSupplier,
      phone: partner.phone,
      email: partner.email,
      taxNumber: partner.taxNumber,
      address: partner.address,
      notes: partner.notes,
      defaultCurrencyId: partner.defaultCurrencyId,
      defaultCurrency: {
        id: partner.defaultCurrency.id,
        code: partner.defaultCurrency.code,
        name: partner.defaultCurrency.name,
        symbol: partner.defaultCurrency.symbol,
        isActive: partner.defaultCurrency.isActive,
      },
      isActive: partner.isActive,
      createdAt: partner.createdAt,
      updatedAt: partner.updatedAt,
    };
  }

  private rethrowUniqueAsConflict(error: unknown): void {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'P2002'
    ) {
      throw new ConflictException('Business partner code already exists');
    }
  }
}
