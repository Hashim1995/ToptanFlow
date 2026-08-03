import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import ExcelJS from 'exceljs';
import { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service';
import { DocumentStatusApi } from '../sales/dto/document-status.enum';
import {
  BusinessPartnerMovementReportQueryDto,
  BusinessPartnerMovementReportResponseDto,
  BusinessPartnerMovementReportRowDto,
  BusinessPartnerMovementReportUserDto,
  PartnerMovementOperationType,
} from './dto/business-partner-movement-report.dto';

const ALL_OPERATION_TYPES = Object.values(PartnerMovementOperationType);
const ALL_STATUSES = Object.values(DocumentStatusApi);
const PRIMARY_PARTNER_CASH_TYPES = [
  'CUSTOMER_RECEIPT',
  'SUPPLIER_PAYMENT',
] as const;

const OPERATION_LABELS: Record<PartnerMovementOperationType, string> = {
  PURCHASE: 'Alış',
  SALE: 'Satış',
  CASH_IN: 'Mədaxil',
  CASH_OUT: 'Məxaric',
};

const STATUS_LABELS: Record<DocumentStatusApi, string> = {
  DRAFT: 'Qaralama',
  POSTED: 'Tamamlanıb',
  CANCELLED: 'Ləğv edilib',
};

const saleSelect = {
  id: true,
  businessDate: true,
  documentNumber: true,
  totalAmount: true,
  status: true,
  notes: true,
  cancelReason: true,
  createdByUserId: true,
  createdBy: { select: { fullName: true } },
} satisfies Prisma.SaleSelect;

const purchaseSelect = {
  id: true,
  businessDate: true,
  documentNumber: true,
  totalAmount: true,
  status: true,
  notes: true,
  cancelReason: true,
  createdByUserId: true,
  createdBy: { select: { fullName: true } },
} satisfies Prisma.PurchaseSelect;

const cashSelect = {
  id: true,
  transactionDate: true,
  transactionNumber: true,
  amount: true,
  type: true,
  status: true,
  notes: true,
  cancelReason: true,
  createdByUserId: true,
  createdBy: { select: { fullName: true } },
} satisfies Prisma.CashTransactionSelect;

type SaleRow = Prisma.SaleGetPayload<{ select: typeof saleSelect }>;
type PurchaseRow = Prisma.PurchaseGetPayload<{ select: typeof purchaseSelect }>;
type CashRow = Prisma.CashTransactionGetPayload<{ select: typeof cashSelect }>;

@Injectable()
export class BusinessPartnerMovementReportService {
  constructor(private readonly prisma: PrismaService) {}

  async listUsers(
    partnerId: string,
  ): Promise<BusinessPartnerMovementReportUserDto[]> {
    await this.assertPartnerExists(partnerId);
    return this.prisma.user.findMany({
      where: {
        OR: [
          { createdSales: { some: { partnerId } } },
          { createdPurchases: { some: { partnerId } } },
          {
            createdCashTxns: {
              some: {
                partnerId,
                type: { in: [...PRIMARY_PARTNER_CASH_TYPES] },
              },
            },
          },
        ],
      },
      select: { id: true, fullName: true, isActive: true },
      orderBy: [{ fullName: 'asc' }, { id: 'asc' }],
    });
  }

  async getReport(
    partnerId: string,
    query: BusinessPartnerMovementReportQueryDto,
    signal?: AbortSignal,
  ): Promise<BusinessPartnerMovementReportResponseDto> {
    this.validateDateRange(query);
    signal?.throwIfAborted();

    const partner = await this.prisma.businessPartner.findUnique({
      where: { id: partnerId },
      select: { id: true, code: true, name: true },
    });
    if (!partner) throw new NotFoundException('Business partner not found');

    const operationTypes = new Set(
      query.operationTypes?.length ? query.operationTypes : ALL_OPERATION_TYPES,
    );
    const statuses = query.statuses?.length ? query.statuses : ALL_STATUSES;
    const dateRange =
      query.dateFrom || query.dateTo
        ? { gte: query.dateFrom, lte: query.dateTo }
        : undefined;
    const actors = query.createdByUserIds?.length
      ? { in: query.createdByUserIds }
      : undefined;

    const [sales, purchases, cash] = await Promise.all([
      operationTypes.has(PartnerMovementOperationType.SALE)
        ? this.prisma.sale.findMany({
            where: {
              partnerId,
              businessDate: dateRange,
              status: { in: statuses },
              createdByUserId: actors,
            },
            select: saleSelect,
          })
        : Promise.resolve([] as SaleRow[]),
      operationTypes.has(PartnerMovementOperationType.PURCHASE)
        ? this.prisma.purchase.findMany({
            where: {
              partnerId,
              businessDate: dateRange,
              status: { in: statuses },
              createdByUserId: actors,
            },
            select: purchaseSelect,
          })
        : Promise.resolve([] as PurchaseRow[]),
      operationTypes.has(PartnerMovementOperationType.CASH_IN) ||
      operationTypes.has(PartnerMovementOperationType.CASH_OUT)
        ? this.prisma.cashTransaction.findMany({
            where: {
              partnerId,
              transactionDate: dateRange,
              status: { in: statuses },
              createdByUserId: actors,
              type: {
                in: [
                  ...(operationTypes.has(PartnerMovementOperationType.CASH_IN)
                    ? ['CUSTOMER_RECEIPT' as const]
                    : []),
                  ...(operationTypes.has(PartnerMovementOperationType.CASH_OUT)
                    ? ['SUPPLIER_PAYMENT' as const]
                    : []),
                ],
              },
            },
            select: cashSelect,
          })
        : Promise.resolve([] as CashRow[]),
    ]);

    signal?.throwIfAborted();
    const rows = [
      ...sales.map((row) => this.mapSale(row)),
      ...purchases.map((row) => this.mapPurchase(row)),
      ...cash.map((row) => this.mapCash(row)),
    ].sort((left, right) => {
      const byDate = left.date.getTime() - right.date.getTime();
      if (byDate !== 0) return byDate;
      const byType = left.operationType.localeCompare(right.operationType);
      return byType || left.documentNumber.localeCompare(right.documentNumber);
    });

    return {
      partnerId: partner.id,
      partnerCode: partner.code,
      partnerName: partner.name,
      generatedAt: new Date(),
      totalCount: rows.length,
      rows,
    };
  }

  async createExcel(
    report: BusinessPartnerMovementReportResponseDto,
    signal?: AbortSignal,
  ): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'TOPTANFLOW';
    workbook.created = report.generatedAt;
    const sheet = workbook.addWorksheet('Hərəkət reportu', {
      views: [{ state: 'frozen', ySplit: 5 }],
    });

    sheet.mergeCells('A1:G1');
    sheet.getCell('A1').value = 'Tərəfdaş hərəkət reportu';
    sheet.getCell('A1').font = {
      bold: true,
      size: 16,
      color: { argb: 'FF1457A6' },
    };
    sheet.mergeCells('A2:G2');
    sheet.getCell('A2').value = `${report.partnerName} (${report.partnerCode})`;
    sheet.getCell('A2').font = { bold: true, size: 12 };
    sheet.mergeCells('A3:G3');
    sheet.getCell('A3').value = `Sətir sayı: ${report.totalCount}`;

    const header = sheet.getRow(5);
    header.values = [
      'Əməliyyat növü',
      'Tarix',
      'Sənəd / əməliyyat №',
      'Məbləğ (AZN)',
      'Status',
      'Əməliyyatı edən istifadəçi',
      'Qısa açıqlama',
    ];
    header.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    header.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1457A6' },
    };
    header.alignment = { vertical: 'middle', wrapText: true };
    header.height = 30;

    for (const row of report.rows) {
      signal?.throwIfAborted();
      const output = sheet.addRow([
        row.operationTypeLabel,
        row.date,
        row.documentNumber,
        Number(row.amount),
        row.statusLabel,
        row.createdByName,
        row.description ?? '',
      ]);
      output.getCell(2).numFmt = 'dd.mm.yyyy';
      output.getCell(4).numFmt = '#,##0.00##';
      output.alignment = { vertical: 'top', wrapText: true };
    }

    sheet.columns = [
      { width: 18 },
      { width: 13 },
      { width: 24 },
      { width: 17 },
      { width: 17 },
      { width: 28 },
      { width: 48 },
    ];
    sheet.autoFilter = { from: 'A5', to: 'G5' };
    const data = await workbook.xlsx.writeBuffer();
    signal?.throwIfAborted();
    return Buffer.from(data);
  }

  private async assertPartnerExists(partnerId: string): Promise<void> {
    const partner = await this.prisma.businessPartner.findUnique({
      where: { id: partnerId },
      select: { id: true },
    });
    if (!partner) throw new NotFoundException('Business partner not found');
  }

  private validateDateRange(query: BusinessPartnerMovementReportQueryDto) {
    if (query.dateFrom && query.dateTo && query.dateFrom > query.dateTo) {
      throw new BadRequestException('dateFrom must not be after dateTo');
    }
  }

  private mapSale(row: SaleRow): BusinessPartnerMovementReportRowDto {
    return this.mapDocumentRow(
      row,
      PartnerMovementOperationType.SALE,
      row.businessDate,
      row.documentNumber,
      row.totalAmount.toString(),
    );
  }

  private mapPurchase(row: PurchaseRow): BusinessPartnerMovementReportRowDto {
    return this.mapDocumentRow(
      row,
      PartnerMovementOperationType.PURCHASE,
      row.businessDate,
      row.documentNumber,
      row.totalAmount.toString(),
    );
  }

  private mapCash(row: CashRow): BusinessPartnerMovementReportRowDto {
    const operationType =
      row.type === 'CUSTOMER_RECEIPT'
        ? PartnerMovementOperationType.CASH_IN
        : PartnerMovementOperationType.CASH_OUT;
    return this.mapDocumentRow(
      row,
      operationType,
      row.transactionDate,
      row.transactionNumber,
      row.amount.toString(),
    );
  }

  private mapDocumentRow(
    row: {
      id: string;
      status: string;
      notes: string | null;
      cancelReason: string | null;
      createdByUserId: string;
      createdBy: { fullName: string };
    },
    operationType: PartnerMovementOperationType,
    date: Date,
    documentNumber: string,
    amount: string,
  ): BusinessPartnerMovementReportRowDto {
    const status = row.status as DocumentStatusApi;
    return {
      id: `${operationType}:${row.id}`,
      operationType,
      operationTypeLabel: OPERATION_LABELS[operationType],
      date,
      documentNumber,
      amount,
      status,
      statusLabel: STATUS_LABELS[status],
      createdByUserId: row.createdByUserId,
      createdByName: row.createdBy.fullName,
      description: row.notes?.trim() || row.cancelReason?.trim() || null,
    };
  }
}
