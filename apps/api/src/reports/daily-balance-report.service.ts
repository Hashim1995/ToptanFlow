import { Injectable } from '@nestjs/common';
import ExcelJS from 'exceljs';
import { Decimal } from '@prisma/client/runtime/client';
import { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service';
import {
  DailyBalanceCashAccountRowDto,
  DailyBalancePartnerRowDto,
  DailyBalanceReportResponseDto,
} from './dto/daily-balance-report.dto';

const partnerSelect = {
  id: true,
  code: true,
  name: true,
  isCustomer: true,
  isSupplier: true,
  isActive: true,
  currentDebtBalance: true,
} satisfies Prisma.BusinessPartnerSelect;

const cashSelect = {
  id: true,
  code: true,
  name: true,
  currentBalance: true,
  responsibleUser: { select: { fullName: true } },
} satisfies Prisma.CashAccountSelect;

type PartnerRecord = Prisma.BusinessPartnerGetPayload<{
  select: typeof partnerSelect;
}>;

type CashRecord = Prisma.CashAccountGetPayload<{
  select: typeof cashSelect;
}>;

function debtBalanceLabel(balance: Decimal): string {
  if (balance.isZero()) return 'Borc yoxdur';
  if (balance.isPositive()) return 'Tərəfdaş bizə borcludur';
  return 'Biz tərəfdaşa borcluyuq';
}

function partnerStatusLabel(isActive: boolean): string {
  return isActive ? 'Aktiv' : 'Deaktiv';
}

function roleLabel(partner: DailyBalancePartnerRowDto): string {
  const roles: string[] = [];
  if (partner.isCustomer) roles.push('Müştəri');
  if (partner.isSupplier) roles.push('Təchizatçı');
  return roles.join(', ') || '—';
}

function partnerReceivableAmount(balance: string): number {
  const value = Number(balance);
  return value > 0 ? value : 0;
}

function partnerPayableAmount(balance: string): number {
  const value = Number(balance);
  return value < 0 ? Math.abs(value) : 0;
}

@Injectable()
export class DailyBalanceReportService {
  constructor(private readonly prisma: PrismaService) {}

  async getReport(
    signal?: AbortSignal,
  ): Promise<DailyBalanceReportResponseDto> {
    signal?.throwIfAborted();

    const [partners, cashAccounts, cashAgg] = await Promise.all([
      this.prisma.businessPartner.findMany({
        select: partnerSelect,
        orderBy: [{ code: 'asc' }, { id: 'asc' }],
      }),
      this.prisma.cashAccount.findMany({
        where: { isActive: true },
        select: cashSelect,
        orderBy: [{ code: 'asc' }, { id: 'asc' }],
      }),
      this.prisma.cashAccount.aggregate({
        where: { isActive: true },
        _sum: { currentBalance: true },
        _count: { _all: true },
      }),
    ]);

    signal?.throwIfAborted();

    const partnerRows = partners.map((row) => this.mapPartner(row));
    const cashRows = cashAccounts.map((row) => this.mapCash(row));

    let partnerDebtTotal = new Decimal(0);
    let partnerReceivable = new Decimal(0);
    let partnerPayable = new Decimal(0);
    for (const row of partners) {
      const balance = new Decimal(row.currentDebtBalance.toString());
      partnerDebtTotal = partnerDebtTotal.plus(balance);
      if (balance.isPositive()) {
        partnerReceivable = partnerReceivable.plus(balance);
      } else if (balance.isNegative()) {
        partnerPayable = partnerPayable.plus(balance.abs());
      }
    }

    const totalCompanyCash = cashAgg._sum.currentBalance
      ? new Decimal(cashAgg._sum.currentBalance.toString())
      : new Decimal(0);

    return {
      generatedAt: new Date(),
      partners: partnerRows,
      partnerCount: partnerRows.length,
      totalPartnerDebtBalance: partnerDebtTotal.toFixed(4),
      totalPartnerReceivable: partnerReceivable.toFixed(4),
      totalPartnerPayable: partnerPayable.toFixed(4),
      cashAccounts: cashRows,
      activeCashAccountCount: cashAgg._count._all,
      totalCompanyCash: totalCompanyCash.toFixed(2),
    };
  }

  async createExcel(
    report: DailyBalanceReportResponseDto,
    signal?: AbortSignal,
  ): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'TOPTANFLOW';
    workbook.created = report.generatedAt;

    this.addSummarySheet(workbook, report);
    signal?.throwIfAborted();
    this.addPartnersSheet(workbook, report, signal);
    signal?.throwIfAborted();
    this.addCashSheet(workbook, report, signal);
    signal?.throwIfAborted();

    const data = await workbook.xlsx.writeBuffer();
    signal?.throwIfAborted();
    return Buffer.from(data);
  }

  private mapPartner(row: PartnerRecord): DailyBalancePartnerRowDto {
    const balance = new Decimal(row.currentDebtBalance.toString());
    return {
      id: row.id,
      code: row.code,
      name: row.name,
      isCustomer: row.isCustomer,
      isSupplier: row.isSupplier,
      isActive: row.isActive,
      currentDebtBalance: balance.toFixed(4),
      debtBalanceLabel: debtBalanceLabel(balance),
    };
  }

  private mapCash(row: CashRecord): DailyBalanceCashAccountRowDto {
    return {
      id: row.id,
      code: row.code,
      name: row.name,
      responsibleUserName: row.responsibleUser.fullName,
      currentBalance: new Decimal(row.currentBalance.toString()).toFixed(2),
    };
  }

  private addSummarySheet(
    workbook: ExcelJS.Workbook,
    report: DailyBalanceReportResponseDto,
  ): void {
    const sheet = workbook.addWorksheet('Xülasə', {
      views: [{ state: 'frozen', ySplit: 1 }],
    });
    sheet.getCell('A1').value = 'Günlük report';
    sheet.getCell('A1').font = {
      bold: true,
      size: 16,
      color: { argb: 'FF1457A6' },
    };
    sheet.mergeCells('A1:B1');

    sheet.getCell('A3').value = 'Hazırlanma vaxtı';
    sheet.getCell('B3').value = report.generatedAt;
    sheet.getCell('B3').numFmt = 'dd.mm.yyyy hh:mm';

    sheet.getCell('A4').value = 'Tərəfdaş sayı';
    sheet.getCell('B4').value = report.partnerCount;

    sheet.getCell('A5').value = 'Alacağımız (AZN)';
    sheet.getCell('B5').value = Number(report.totalPartnerReceivable);
    sheet.getCell('B5').numFmt = '#,##0.00##';

    sheet.getCell('A6').value = 'Verəcəyimiz / Borclarımız (AZN)';
    sheet.getCell('B6').value = Number(report.totalPartnerPayable);
    sheet.getCell('B6').numFmt = '#,##0.00##';

    sheet.getCell('A7').value = 'Xalis borc balansı cəmi (AZN)';
    sheet.getCell('B7').value = Number(report.totalPartnerDebtBalance);
    sheet.getCell('B7').numFmt = '#,##0.00##';

    sheet.getCell('A8').value = 'Aktiv kassa hesabı sayı';
    sheet.getCell('B8').value = report.activeCashAccountCount;

    sheet.getCell('A9').value = 'Ümumi kassa cəmi (AZN)';
    sheet.getCell('B9').value = Number(report.totalCompanyCash);
    sheet.getCell('B9').numFmt = '#,##0.00';
    sheet.getCell('B9').font = { bold: true };

    sheet.getColumn(1).width = 36;
    sheet.getColumn(2).width = 22;
  }

  private addPartnersSheet(
    workbook: ExcelJS.Workbook,
    report: DailyBalanceReportResponseDto,
    signal?: AbortSignal,
  ): void {
    const sheet = workbook.addWorksheet('Tərəfdaşlar', {
      views: [{ state: 'frozen', ySplit: 1 }],
    });
    const header = sheet.getRow(1);
    header.values = [
      'Kod',
      'Ad',
      'Rol',
      'Status',
      'Alacağımız (AZN)',
      'Verəcəyimiz (AZN)',
      'Borc vəziyyəti',
    ];
    header.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    header.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1457A6' },
    };
    header.alignment = { vertical: 'middle', wrapText: true };
    header.height = 28;

    for (const partner of report.partners) {
      signal?.throwIfAborted();
      const row = sheet.addRow([
        partner.code,
        partner.name,
        roleLabel(partner),
        partnerStatusLabel(partner.isActive),
        partnerReceivableAmount(partner.currentDebtBalance),
        partnerPayableAmount(partner.currentDebtBalance),
        partner.debtBalanceLabel,
      ]);
      row.getCell(5).numFmt = '#,##0.00##';
      row.getCell(6).numFmt = '#,##0.00##';
      row.alignment = { vertical: 'top', wrapText: true };
    }

    const totalRow = sheet.addRow([
      '',
      '',
      '',
      'Ümumi cəm',
      Number(report.totalPartnerReceivable),
      Number(report.totalPartnerPayable),
      '',
    ]);
    totalRow.font = { bold: true };
    totalRow.getCell(5).numFmt = '#,##0.00##';
    totalRow.getCell(6).numFmt = '#,##0.00##';

    sheet.columns = [
      { width: 12 },
      { width: 28 },
      { width: 18 },
      { width: 12 },
      { width: 18 },
      { width: 18 },
      { width: 28 },
    ];
    sheet.autoFilter = { from: 'A1', to: 'G1' };
  }

  private addCashSheet(
    workbook: ExcelJS.Workbook,
    report: DailyBalanceReportResponseDto,
    signal?: AbortSignal,
  ): void {
    const sheet = workbook.addWorksheet('Kassa hesabları', {
      views: [{ state: 'frozen', ySplit: 1 }],
    });
    const header = sheet.getRow(1);
    header.values = ['Kod', 'Ad', 'Məsul şəxs', 'Balans (AZN)'];
    header.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    header.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1457A6' },
    };
    header.alignment = { vertical: 'middle', wrapText: true };
    header.height = 28;

    for (const account of report.cashAccounts) {
      signal?.throwIfAborted();
      const row = sheet.addRow([
        account.code,
        account.name,
        account.responsibleUserName,
        Number(account.currentBalance),
      ]);
      row.getCell(4).numFmt = '#,##0.00';
      row.alignment = { vertical: 'top', wrapText: true };
    }

    const totalRow = sheet.addRow([
      '',
      '',
      'Ümumi kassa cəmi',
      Number(report.totalCompanyCash),
    ]);
    totalRow.font = { bold: true };
    totalRow.getCell(4).numFmt = '#,##0.00';

    sheet.columns = [
      { width: 14 },
      { width: 28 },
      { width: 24 },
      { width: 16 },
    ];
    sheet.autoFilter = { from: 'A1', to: 'D1' };
  }
}
