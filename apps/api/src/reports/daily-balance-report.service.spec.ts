import { Decimal } from '@prisma/client/runtime/client';
import { DailyBalanceReportService } from './daily-balance-report.service';

describe('DailyBalanceReportService', () => {
  const prisma = {
    businessPartner: { findMany: jest.fn() },
    cashAccount: { findMany: jest.fn(), aggregate: jest.fn() },
  };
  let service: DailyBalanceReportService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new DailyBalanceReportService(prisma as never);
    prisma.businessPartner.findMany.mockResolvedValue([]);
    prisma.cashAccount.findMany.mockResolvedValue([]);
    prisma.cashAccount.aggregate.mockResolvedValue({
      _sum: { currentBalance: null },
      _count: { _all: 0 },
    });
  });

  it('includes all partners (inactive and zero debt) and only active cash accounts', async () => {
    prisma.businessPartner.findMany.mockResolvedValue([
      {
        id: 'partner-active',
        code: '0000001',
        name: 'Aktiv tərəfdaş',
        isCustomer: true,
        isSupplier: false,
        isActive: true,
        currentDebtBalance: new Decimal('100.5000'),
      },
      {
        id: 'partner-inactive',
        code: '0000002',
        name: 'Deaktiv tərəfdaş',
        isCustomer: false,
        isSupplier: true,
        isActive: false,
        currentDebtBalance: new Decimal('0'),
      },
      {
        id: 'partner-owe',
        code: '0000003',
        name: 'Biz borcluyuq',
        isCustomer: true,
        isSupplier: true,
        isActive: true,
        currentDebtBalance: new Decimal('-50.2500'),
      },
    ]);
    prisma.cashAccount.findMany.mockResolvedValue([
      {
        id: 'cash-1',
        code: 'CASH-0001',
        name: 'Əsas kassa',
        currentBalance: new Decimal('1500.00'),
        responsibleUser: { fullName: 'Əli Məmmədov' },
      },
      {
        id: 'cash-2',
        code: 'CASH-0002',
        name: 'İkinci kassa',
        currentBalance: new Decimal('250.50'),
        responsibleUser: { fullName: 'Leyla Həsənova' },
      },
    ]);
    prisma.cashAccount.aggregate.mockResolvedValue({
      _sum: { currentBalance: new Decimal('1750.50') },
      _count: { _all: 2 },
    });

    const report = await service.getReport();

    expect(report.partnerCount).toBe(3);
    expect(report.partners.map((row) => row.code)).toEqual([
      '0000001',
      '0000002',
      '0000003',
    ]);
    expect(report.partners[0]).toMatchObject({
      currentDebtBalance: '100.5000',
      debtBalanceLabel: 'Tərəfdaş bizə borcludur',
      isActive: true,
    });
    expect(report.partners[1]).toMatchObject({
      currentDebtBalance: '0.0000',
      debtBalanceLabel: 'Borc yoxdur',
      isActive: false,
    });
    expect(report.partners[2]).toMatchObject({
      currentDebtBalance: '-50.2500',
      debtBalanceLabel: 'Biz tərəfdaşa borcluyuq',
    });
    expect(report.totalPartnerDebtBalance).toBe('50.2500');
    expect(report.totalPartnerReceivable).toBe('100.5000');
    expect(report.totalPartnerPayable).toBe('50.2500');

    expect(prisma.cashAccount.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { isActive: true },
      }),
    );
    expect(report.activeCashAccountCount).toBe(2);
    expect(report.cashAccounts).toHaveLength(2);
    expect(report.cashAccounts[0]).toMatchObject({
      code: 'CASH-0001',
      responsibleUserName: 'Əli Məmmədov',
      currentBalance: '1500.00',
    });
    expect(report.totalCompanyCash).toBe('1750.50');
    expect(prisma.businessPartner.findMany.mock.calls[0][0]).not.toHaveProperty(
      'take',
    );
    expect(prisma.businessPartner.findMany.mock.calls[0][0]).not.toHaveProperty(
      'where',
    );
  });

  it('creates a non-empty Excel workbook for the snapshot', async () => {
    prisma.businessPartner.findMany.mockResolvedValue([
      {
        id: 'partner-1',
        code: '0000001',
        name: 'Test',
        isCustomer: true,
        isSupplier: false,
        isActive: true,
        currentDebtBalance: new Decimal('10.0000'),
      },
    ]);
    prisma.cashAccount.findMany.mockResolvedValue([
      {
        id: 'cash-1',
        code: 'CASH-0001',
        name: 'Kassa',
        currentBalance: new Decimal('100.00'),
        responsibleUser: { fullName: 'User' },
      },
    ]);
    prisma.cashAccount.aggregate.mockResolvedValue({
      _sum: { currentBalance: new Decimal('100.00') },
      _count: { _all: 1 },
    });

    const report = await service.getReport();
    const excel = await service.createExcel(report);

    expect(Buffer.isBuffer(excel)).toBe(true);
    expect(excel.byteLength).toBeGreaterThan(1000);
  });
});
