import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsArray, IsDate, IsEnum, IsOptional, IsUUID } from 'class-validator';
import {
  transformFilterDateStart,
  transformToUtcDateEnd,
} from '../../common/datetime/index.js';
import { DocumentStatusApi } from '../../sales/dto/document-status.enum';

export enum PartnerMovementOperationType {
  PURCHASE = 'PURCHASE',
  SALE = 'SALE',
  CASH_IN = 'CASH_IN',
  CASH_OUT = 'CASH_OUT',
}

export enum PartnerMovementExportFormat {
  EXCEL = 'EXCEL',
}

function toArray(value: unknown): unknown[] | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const values: unknown[] = Array.isArray(value)
    ? (value as unknown[])
    : [value];
  const result: unknown[] = [];
  for (const item of values) {
    const parts: unknown[] =
      typeof item === 'string' ? item.split(',') : [item];
    for (const part of parts) {
      const normalized = typeof part === 'string' ? part.trim() : part;
      if (normalized !== '') result.push(normalized);
    }
  }
  return result;
}

export class BusinessPartnerMovementReportQueryDto {
  @ApiPropertyOptional({
    example: '2026-08-01',
    description: 'Inclusive start date in Asia/Baku.',
  })
  @IsOptional()
  @Transform(transformFilterDateStart)
  @IsDate()
  dateFrom?: Date;

  @ApiPropertyOptional({
    example: '2026-08-31',
    description: 'Inclusive end date in Asia/Baku.',
  })
  @IsOptional()
  @Transform(transformToUtcDateEnd)
  @IsDate()
  dateTo?: Date;

  @ApiPropertyOptional({ enum: PartnerMovementOperationType, isArray: true })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => toArray(value))
  @IsArray()
  @IsEnum(PartnerMovementOperationType, { each: true })
  operationTypes?: PartnerMovementOperationType[];

  @ApiPropertyOptional({ enum: DocumentStatusApi, isArray: true })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => toArray(value))
  @IsArray()
  @IsEnum(DocumentStatusApi, { each: true })
  statuses?: DocumentStatusApi[];

  @ApiPropertyOptional({ type: [String], format: 'uuid' })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => toArray(value))
  @IsArray()
  @IsUUID('4', { each: true })
  createdByUserIds?: string[];
}

export class BusinessPartnerMovementReportExportQueryDto extends BusinessPartnerMovementReportQueryDto {
  @ApiProperty({ enum: PartnerMovementExportFormat })
  @IsEnum(PartnerMovementExportFormat)
  format!: PartnerMovementExportFormat;
}

export class BusinessPartnerMovementReportUserDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  fullName!: string;

  @ApiProperty()
  isActive!: boolean;
}

export class BusinessPartnerMovementReportRowDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ enum: PartnerMovementOperationType })
  operationType!: PartnerMovementOperationType;

  @ApiProperty()
  operationTypeLabel!: string;

  @ApiProperty()
  date!: Date;

  @ApiProperty()
  documentNumber!: string;

  @ApiProperty()
  amount!: string;

  @ApiProperty({ enum: DocumentStatusApi })
  status!: DocumentStatusApi;

  @ApiProperty()
  statusLabel!: string;

  @ApiProperty()
  createdByUserId!: string;

  @ApiProperty()
  createdByName!: string;

  @ApiPropertyOptional({ nullable: true, type: String })
  description!: string | null;
}

export class BusinessPartnerMovementReportResponseDto {
  @ApiProperty()
  partnerId!: string;

  @ApiProperty()
  partnerCode!: string;

  @ApiProperty()
  partnerName!: string;

  @ApiProperty()
  generatedAt!: Date;

  @ApiProperty()
  totalCount!: number;

  @ApiProperty({ type: [BusinessPartnerMovementReportRowDto] })
  rows!: BusinessPartnerMovementReportRowDto[];
}
