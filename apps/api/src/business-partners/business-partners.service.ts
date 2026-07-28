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
import { CreateBusinessPartnerDto } from './dto/create-business-partner.dto';
import { UpdateBusinessPartnerDto } from './dto/update-business-partner.dto';
import {
  BusinessPartnerDuplicateCandidateDto,
  BusinessPartnerDuplicateMatchedField,
} from './dto/check-business-partner-duplicates-response.dto';
import { ListBusinessPartnersQueryDto } from './dto/list-business-partners-query.dto';
import { PaginatedBusinessPartnersResponseDto } from './dto/paginated-business-partners-response.dto';
import { BusinessPartnerResponseDto } from './dto/business-partner-response.dto';

const DUPLICATE_CANDIDATE_FETCH_CAP = 200;

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

const duplicateCandidateSelect = {
  id: true,
  code: true,
  name: true,
  phone: true,
  taxNumber: true,
  isCustomer: true,
  isSupplier: true,
  isActive: true,
} satisfies Prisma.BusinessPartnerSelect;

type BusinessPartnerRecord = Prisma.BusinessPartnerGetPayload<{
  select: typeof businessPartnerSelect;
}>;

type DuplicateCandidateRecord = Prisma.BusinessPartnerGetPayload<{
  select: typeof duplicateCandidateSelect;
}>;

type DuplicateCheckInput = {
  name?: string | null;
  phone?: string | null;
  taxNumber?: string | null;
};

@Injectable()
export class BusinessPartnersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly numberSequences: NumberSequencesService,
  ) {}

  async create(
    dto: CreateBusinessPartnerDto,
  ): Promise<BusinessPartnerResponseDto> {
    const name = this.normalizeName(dto.name);
    this.assertNonEmpty('name', name);
    this.assertAtLeastOneRole(dto.isCustomer, dto.isSupplier);

    await this.assertCurrencyAssignable(dto.defaultCurrencyId);

    const phone = this.normalizeOptionalText(dto.phone);
    const taxNumber = this.normalizeOptionalText(dto.taxNumber);

    await this.assertNoUnacknowledgedDuplicates({
      identifiers: { name, phone, taxNumber },
      acknowledgeDuplicate: dto.acknowledgeDuplicate === true,
    });

    try {
      const partner = await this.prisma.$transaction(async (tx) => {
        const code = await this.numberSequences.nextCode(
          tx,
          BusinessCodeSequenceKey.BUSINESS_PARTNER,
        );

        return tx.businessPartner.create({
          data: {
            code,
            name,
            isCustomer: dto.isCustomer,
            isSupplier: dto.isSupplier,
            phone,
            email: this.normalizeOptionalText(dto.email),
            taxNumber,
            address: this.normalizeOptionalText(dto.address),
            notes: this.normalizeOptionalText(dto.notes),
            defaultCurrencyId: dto.defaultCurrencyId,
            isActive: true,
          },
          select: businessPartnerSelect,
        });
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

  async update(
    id: string,
    dto: UpdateBusinessPartnerDto,
  ): Promise<BusinessPartnerResponseDto> {
    if (!this.hasAtLeastOneUpdateField(dto)) {
      throw new BadRequestException('At least one field must be provided');
    }

    const existing = await this.prisma.businessPartner.findUnique({
      where: { id },
      select: businessPartnerSelect,
    });

    if (!existing) {
      throw new NotFoundException('Business partner not found');
    }

    if (dto.isCustomer !== undefined || dto.isSupplier !== undefined) {
      const resultingCustomer =
        dto.isCustomer !== undefined ? dto.isCustomer : existing.isCustomer;
      const resultingSupplier =
        dto.isSupplier !== undefined ? dto.isSupplier : existing.isSupplier;
      this.assertAtLeastOneRole(resultingCustomer, resultingSupplier);
    }

    const data: {
      name?: string;
      isCustomer?: boolean;
      isSupplier?: boolean;
      defaultCurrencyId?: string;
      phone?: string | null;
      email?: string | null;
      taxNumber?: string | null;
      address?: string | null;
      notes?: string | null;
    } = {};

    if (dto.name !== undefined) {
      const name = this.normalizeName(dto.name);
      this.assertNonEmpty('name', name);
      data.name = name;
    }

    if (dto.isCustomer !== undefined) {
      data.isCustomer = dto.isCustomer;
    }

    if (dto.isSupplier !== undefined) {
      data.isSupplier = dto.isSupplier;
    }

    if (dto.defaultCurrencyId !== undefined) {
      await this.assertCurrencyAssignable(dto.defaultCurrencyId);
      data.defaultCurrencyId = dto.defaultCurrencyId;
    }

    if (dto.phone !== undefined) {
      data.phone = this.normalizeOptionalText(dto.phone);
    }

    if (dto.email !== undefined) {
      data.email = this.normalizeOptionalText(dto.email);
    }

    if (dto.taxNumber !== undefined) {
      data.taxNumber = this.normalizeOptionalText(dto.taxNumber);
    }

    if (dto.address !== undefined) {
      data.address = this.normalizeOptionalText(dto.address);
    }

    if (dto.notes !== undefined) {
      data.notes = this.normalizeOptionalText(dto.notes);
    }

    const identityFieldsChanging =
      dto.name !== undefined ||
      dto.phone !== undefined ||
      dto.taxNumber !== undefined;

    if (identityFieldsChanging) {
      await this.assertNoUnacknowledgedDuplicates({
        identifiers: {
          name: data.name ?? existing.name,
          phone: data.phone !== undefined ? data.phone : existing.phone,
          taxNumber:
            data.taxNumber !== undefined ? data.taxNumber : existing.taxNumber,
        },
        acknowledgeDuplicate: dto.acknowledgeDuplicate === true,
        excludeId: id,
      });
    }

    const partner = await this.prisma.businessPartner.update({
      where: { id },
      data,
      select: businessPartnerSelect,
    });
    return this.toResponse(partner);
  }

  async deactivate(id: string): Promise<BusinessPartnerResponseDto> {
    const existing = await this.prisma.businessPartner.findUnique({
      where: { id },
      select: businessPartnerSelect,
    });

    if (!existing) {
      throw new NotFoundException('Business partner not found');
    }

    if (existing.isActive) {
      const partner = await this.prisma.businessPartner.update({
        where: { id },
        data: { isActive: false },
        select: businessPartnerSelect,
      });
      return this.toResponse(partner);
    }

    return this.toResponse(existing);
  }

  private async assertNoUnacknowledgedDuplicates(params: {
    identifiers: DuplicateCheckInput;
    acknowledgeDuplicate: boolean;
    excludeId?: string;
  }): Promise<void> {
    if (params.acknowledgeDuplicate) {
      return;
    }

    const candidates = await this.findDuplicateCandidates(
      params.identifiers,
      params.excludeId,
    );

    if (candidates.length === 0) {
      return;
    }

    throw new ConflictException({
      message: 'Possible duplicate business partners found',
      code: 'BUSINESS_PARTNER_DUPLICATE_SUSPECTED',
      candidates,
    });
  }

  /**
   * Soft duplicate detection (US-016). Identity remains uuid + code (ADR-024);
   * name/phone/taxNumber are helper fields used only to warn the operator.
   */
  private async findDuplicateCandidates(
    input: DuplicateCheckInput,
    excludeId?: string,
  ): Promise<BusinessPartnerDuplicateCandidateDto[]> {
    const nameNorm = this.normalizeDuplicateName(input.name);
    const phoneNorm = this.normalizeDuplicatePhone(input.phone);
    const taxNorm = this.normalizeDuplicateTaxNumber(input.taxNumber);

    if (nameNorm === null && phoneNorm === null && taxNorm === null) {
      return [];
    }

    const whereOr = this.buildDuplicateCandidateWhere(
      nameNorm,
      phoneNorm,
      taxNorm,
      input,
    );

    if (whereOr.length === 0) {
      return [];
    }

    const rows = await this.prisma.businessPartner.findMany({
      where: {
        AND: [
          { OR: whereOr },
          ...(excludeId ? [{ id: { not: excludeId } }] : []),
        ],
      },
      select: duplicateCandidateSelect,
      take: DUPLICATE_CANDIDATE_FETCH_CAP,
      orderBy: [{ code: 'asc' }, { id: 'asc' }],
    });

    const candidates: BusinessPartnerDuplicateCandidateDto[] = [];

    for (const row of rows) {
      const matchedFields = this.collectMatchedDuplicateFields(
        row,
        nameNorm,
        phoneNorm,
        taxNorm,
      );
      if (matchedFields.length === 0) {
        continue;
      }

      candidates.push({
        id: row.id,
        code: row.code,
        name: row.name,
        phone: row.phone,
        taxNumber: row.taxNumber,
        isCustomer: row.isCustomer,
        isSupplier: row.isSupplier,
        isActive: row.isActive,
        matchedFields,
      });
    }

    return candidates;
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

  private hasAtLeastOneUpdateField(dto: UpdateBusinessPartnerDto): boolean {
    return (
      dto.name !== undefined ||
      dto.isCustomer !== undefined ||
      dto.isSupplier !== undefined ||
      dto.defaultCurrencyId !== undefined ||
      dto.phone !== undefined ||
      dto.email !== undefined ||
      dto.taxNumber !== undefined ||
      dto.address !== undefined ||
      dto.notes !== undefined
    );
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

  /** US-016: trim, collapse whitespace, Unicode case-fold. */
  private normalizeDuplicateName(
    value: string | null | undefined,
  ): string | null {
    if (value === undefined || value === null) {
      return null;
    }
    const collapsed = value.trim().replace(/\s+/g, ' ');
    if (collapsed.length === 0) {
      return null;
    }
    return collapsed.toLocaleLowerCase('en-US');
  }

  /**
   * US-016: trim; keep a single leading `+` if present; strip non-digits from
   * the remainder. Empty after normalize → null (no match).
   */
  private normalizeDuplicatePhone(
    value: string | null | undefined,
  ): string | null {
    if (value === undefined || value === null) {
      return null;
    }
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      return null;
    }

    const hasPlus = trimmed.startsWith('+');
    const digits = trimmed.replace(/\D/g, '');
    if (digits.length === 0) {
      return null;
    }
    return hasPlus ? `+${digits}` : digits;
  }

  /** US-016: trim, remove whitespace, Unicode case-fold. */
  private normalizeDuplicateTaxNumber(
    value: string | null | undefined,
  ): string | null {
    if (value === undefined || value === null) {
      return null;
    }
    const compact = value.trim().replace(/\s+/g, '');
    if (compact.length === 0) {
      return null;
    }
    return compact.toLocaleLowerCase('en-US');
  }

  private buildDuplicateCandidateWhere(
    nameNorm: string | null,
    phoneNorm: string | null,
    taxNorm: string | null,
    input: DuplicateCheckInput,
  ): Prisma.BusinessPartnerWhereInput[] {
    const whereOr: Prisma.BusinessPartnerWhereInput[] = [];

    if (nameNorm !== null) {
      const trimmedName =
        typeof input.name === 'string' ? input.name.trim() : undefined;
      if (trimmedName) {
        whereOr.push({
          name: { equals: trimmedName, mode: 'insensitive' },
        });
        whereOr.push({
          name: { equals: nameNorm, mode: 'insensitive' },
        });
        const token = nameNorm.split(' ')[0];
        if (token.length >= 2) {
          whereOr.push({
            name: { contains: token, mode: 'insensitive' },
          });
        }
      }
    }

    if (phoneNorm !== null) {
      const digits = phoneNorm.replace(/\D/g, '');
      if (typeof input.phone === 'string' && input.phone.trim()) {
        whereOr.push({ phone: { equals: input.phone.trim() } });
      }
      if (digits.length > 0) {
        const needle = digits.length >= 7 ? digits.slice(-7) : digits;
        whereOr.push({ phone: { contains: needle } });
      }
    }

    if (taxNorm !== null) {
      if (typeof input.taxNumber === 'string' && input.taxNumber.trim()) {
        whereOr.push({
          taxNumber: {
            equals: input.taxNumber.trim(),
            mode: 'insensitive',
          },
        });
      }
      whereOr.push({
        taxNumber: { equals: taxNorm, mode: 'insensitive' },
      });
      if (taxNorm.length >= 4) {
        whereOr.push({
          taxNumber: { contains: taxNorm.slice(0, 4), mode: 'insensitive' },
        });
      }
    }

    return whereOr;
  }

  private collectMatchedDuplicateFields(
    row: DuplicateCandidateRecord,
    nameNorm: string | null,
    phoneNorm: string | null,
    taxNorm: string | null,
  ): BusinessPartnerDuplicateMatchedField[] {
    const matchedFields: BusinessPartnerDuplicateMatchedField[] = [];

    if (
      nameNorm !== null &&
      this.normalizeDuplicateName(row.name) === nameNorm
    ) {
      matchedFields.push('name');
    }

    if (
      phoneNorm !== null &&
      this.normalizeDuplicatePhone(row.phone) === phoneNorm
    ) {
      matchedFields.push('phone');
    }

    if (
      taxNorm !== null &&
      this.normalizeDuplicateTaxNumber(row.taxNumber) === taxNorm
    ) {
      matchedFields.push('taxNumber');
    }

    return matchedFields;
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
