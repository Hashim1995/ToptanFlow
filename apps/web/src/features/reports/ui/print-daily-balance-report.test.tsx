import { describe, expect, it, vi } from 'vitest';
import type { DailyBalanceReport } from '../api/daily-balance-report.api';
import {
  openDailyBalancePrintWindow,
  renderDailyBalancePrintWindow,
} from './print-daily-balance-report';

describe('print-daily-balance-report', () => {
  it('writes partner and cash sections into the print document', () => {
    const writes: string[] = [];
    const printWindow = {
      document: {
        open: vi.fn(),
        write: (html: string) => {
          writes.push(html);
        },
        close: vi.fn(),
      },
      addEventListener: vi.fn(),
      focus: vi.fn(),
      print: vi.fn(),
      close: vi.fn(),
    } as unknown as Window;

    const report: DailyBalanceReport = {
      generatedAt: '2026-08-06T12:00:00+04:00',
      partners: [
        {
          id: 'p1',
          code: '0000001',
          name: 'Şərq Tekstil',
          isCustomer: true,
          isSupplier: true,
          isActive: false,
          currentDebtBalance: '0.0000',
          debtBalanceLabel: 'Borc yoxdur',
        },
      ],
      partnerCount: 1,
      totalPartnerDebtBalance: '0.0000',
      totalPartnerReceivable: '0.0000',
      totalPartnerPayable: '0.0000',
      cashAccounts: [
        {
          id: 'c1',
          code: 'CASH-0001',
          name: 'Əsas kassa',
          responsibleUserName: 'Əli Məmmədov',
          currentBalance: '250.00',
        },
      ],
      activeCashAccountCount: 1,
      totalCompanyCash: '250.00',
    };

    renderDailyBalancePrintWindow(printWindow, report);
    const html = writes.at(-1) ?? '';

    expect(html).toContain('Günlük report');
    expect(html).toContain('Tərəfdaşlar');
    expect(html).toContain('Kassa hesabları');
    expect(html).toContain('Şərq Tekstil');
    expect(html).toContain('Əsas kassa');
    expect(html).toContain('Alacağımız');
    expect(html).toContain('Verəcəyimiz');
    expect(html).toContain('Ümumi cəm');
    expect(html).toContain('Ümumi kassa cəmi');
    expect(html).toContain('Deaktiv');
    expect(html).not.toContain('currentDebtBalance');
    expect(html).not.toContain('isActive');
  });

  it('opens a loading print window', () => {
    const open = vi.spyOn(window, 'open').mockReturnValue({
      document: {
        open: vi.fn(),
        write: vi.fn(),
        close: vi.fn(),
      },
    } as unknown as Window);

    const result = openDailyBalancePrintWindow();
    expect(result).not.toBeNull();
    expect(open).toHaveBeenCalled();
    open.mockRestore();
  });
});
