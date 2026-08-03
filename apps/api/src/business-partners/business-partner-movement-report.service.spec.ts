import { Decimal } from '@prisma/client/runtime/client';
import { BusinessPartnerMovementReportService } from './business-partner-movement-report.service';
import {
  PartnerMovementOperationType,
  type BusinessPartnerMovementReportResponseDto,
} from './dto/business-partner-movement-report.dto';
import { DocumentStatusApi } from '../sales/dto/document-status.enum';

describe('BusinessPartnerMovementReportService', () => {
  const partnerId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const userId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  const prisma = {
    businessPartner: { findUnique: jest.fn() },
    sale: { findMany: jest.fn() },
    purchase: { findMany: jest.fn() },
    cashTransaction: { findMany: jest.fn() },
    user: { findMany: jest.fn() },
  };
  let service: BusinessPartnerMovementReportService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new BusinessPartnerMovementReportService(prisma as never);
    prisma.businessPartner.findUnique.mockResolvedValue({
      id: partnerId,
      code: '0000042',
      name: 'Şərq Tekstil',
    });
    prisma.sale.findMany.mockResolvedValue([]);
    prisma.purchase.findMany.mockResolvedValue([]);
    prisma.cashTransaction.findMany.mockResolvedValue([]);
  });

  it('returns every matching primary movement without pagination in deterministic order', async () => {
    prisma.purchase.findMany.mockResolvedValue([
      {
        id: 'purchase-1',
        businessDate: new Date('2026-08-01T00:00:00.000Z'),
        documentNumber: 'PUR-0000001',
        totalAmount: new Decimal('125.5000'),
        status: 'POSTED',
        notes: 'Parça alışı',
        cancelReason: null,
        createdByUserId: userId,
        createdBy: { fullName: 'Əli Məmmədov' },
      },
    ]);
    prisma.sale.findMany.mockResolvedValue([
      {
        id: 'sale-1',
        businessDate: new Date('2026-08-02T00:00:00.000Z'),
        documentNumber: 'SAL-0000001',
        totalAmount: new Decimal('250.0000'),
        status: 'DRAFT',
        notes: null,
        cancelReason: null,
        createdByUserId: userId,
        createdBy: { fullName: 'Əli Məmmədov' },
      },
    ]);
    prisma.cashTransaction.findMany.mockResolvedValue([
      {
        id: 'cash-1',
        transactionDate: new Date('2026-08-03T08:00:00.000Z'),
        transactionNumber: 'CTX-0000001',
        amount: new Decimal('75.00'),
        type: 'CUSTOMER_RECEIPT',
        status: 'CANCELLED',
        notes: null,
        cancelReason: 'Səhv daxil edilib',
        createdByUserId: userId,
        createdBy: { fullName: 'Əli Məmmədov' },
      },
    ]);

    const result = await service.getReport(partnerId, {});

    expect(result.totalCount).toBe(3);
    expect(result.rows.map((row) => row.operationType)).toEqual([
      'PURCHASE',
      'SALE',
      'CASH_IN',
    ]);
    expect(result.rows[0]).toMatchObject({
      operationTypeLabel: 'Alış',
      documentNumber: 'PUR-0000001',
      amount: '125.5',
      createdByName: 'Əli Məmmədov',
      description: 'Parça alışı',
    });
    expect(result.rows[2].description).toBe('Səhv daxil edilib');
    expect(prisma.sale.findMany.mock.calls[0][0]).not.toHaveProperty('take');
    expect(prisma.purchase.findMany.mock.calls[0][0]).not.toHaveProperty(
      'skip',
    );
    expect(prisma.cashTransaction.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          type: { in: ['CUSTOMER_RECEIPT', 'SUPPLIER_PAYMENT'] },
        }),
      }),
    );
  });

  it('applies type, date, status, and actor filters to only the selected source', async () => {
    const dateFrom = new Date('2026-08-01T00:00:00.000Z');
    const dateTo = new Date('2026-08-31T23:59:59.999Z');

    await service.getReport(partnerId, {
      dateFrom,
      dateTo,
      operationTypes: [PartnerMovementOperationType.SALE],
      statuses: [DocumentStatusApi.POSTED],
      createdByUserIds: [userId],
    });

    expect(prisma.sale.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          partnerId,
          businessDate: { gte: dateFrom, lte: dateTo },
          status: { in: ['POSTED'] },
          createdByUserId: { in: [userId] },
        },
      }),
    );
    expect(prisma.purchase.findMany).not.toHaveBeenCalled();
    expect(prisma.cashTransaction.findMany).not.toHaveBeenCalled();
  });

  it('rejects an inverted date range before querying report rows', async () => {
    await expect(
      service.getReport(partnerId, {
        dateFrom: new Date('2026-08-02T00:00:00.000Z'),
        dateTo: new Date('2026-08-01T00:00:00.000Z'),
      }),
    ).rejects.toMatchObject({ status: 400 });
    expect(prisma.businessPartner.findUnique).not.toHaveBeenCalled();
  });

  it('stops before database work when the caller has aborted', async () => {
    const controller = new AbortController();
    controller.abort();

    await expect(
      service.getReport(partnerId, {}, controller.signal),
    ).rejects.toHaveProperty('name', 'AbortError');
    expect(prisma.businessPartner.findUnique).not.toHaveBeenCalled();
  });

  it('creates a real in-memory XLSX response', async () => {
    const report: BusinessPartnerMovementReportResponseDto = {
      partnerId,
      partnerCode: '0000042',
      partnerName: 'Şərq Tekstil',
      generatedAt: new Date('2026-08-04T08:00:00.000Z'),
      totalCount: 1,
      rows: [
        {
          id: 'SALE:sale-1',
          operationType: PartnerMovementOperationType.SALE,
          operationTypeLabel: 'Satış',
          date: new Date('2026-08-02T00:00:00.000Z'),
          documentNumber: 'SAL-0000001',
          amount: '250.0000',
          status: DocumentStatusApi.POSTED,
          statusLabel: 'Tamamlanıb',
          createdByUserId: userId,
          createdByName: 'Əli Məmmədov',
          description: 'Çeşidli parçalar',
        },
      ],
    };

    const excel = await service.createExcel(report);

    expect(excel.subarray(0, 2).toString()).toBe('PK');
  });
});
