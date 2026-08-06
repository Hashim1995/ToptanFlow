import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DailyBalanceReportPage } from './daily-balance-report-page';

const apiMocks = vi.hoisted(() => ({
  download: vi.fn(),
  getReport: vi.fn(),
}));

const printMocks = vi.hoisted(() => ({
  open: vi.fn(),
  render: vi.fn(),
}));

vi.mock('../api/daily-balance-report.api', () => ({
  downloadDailyBalanceReport: apiMocks.download,
  getDailyBalanceReport: apiMocks.getReport,
}));

vi.mock('../ui/print-daily-balance-report', () => ({
  openDailyBalancePrintWindow: printMocks.open,
  renderDailyBalancePrintWindow: printMocks.render,
}));

async function flushUi() {
  await waitFor(() => {
    expect(screen.getByText('Tamamlandı')).toBeInTheDocument();
  });
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe('DailyBalanceReportPage', () => {
  let restoreGetComputedStyle = () => undefined;

  beforeEach(() => {
    const getComputedStyle = window.getComputedStyle.bind(window);
    const spy = vi
      .spyOn(window, 'getComputedStyle')
      .mockImplementation((element) => getComputedStyle(element));
    restoreGetComputedStyle = () => spy.mockRestore();
  });

  afterEach(() => {
    cleanup();
    restoreGetComputedStyle();
    vi.clearAllMocks();
  });

  it('renders Excel and Print actions with Azerbaijani labels', () => {
    render(<DailyBalanceReportPage />);
    expect(screen.getByText('Günlük report')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Excel yüklə' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Çap et' })).toBeInTheDocument();
  });

  it('downloads Excel when the Excel action is clicked', async () => {
    apiMocks.download.mockResolvedValue(new Blob(['xlsx']));
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      writable: true,
      value: vi.fn(() => 'blob:daily'),
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      writable: true,
      value: vi.fn(),
    });
    const clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => undefined);

    render(<DailyBalanceReportPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Excel yüklə' }));

    await waitFor(() => {
      expect(apiMocks.download).toHaveBeenCalled();
      expect(URL.createObjectURL).toHaveBeenCalled();
      expect(clickSpy).toHaveBeenCalled();
      expect(URL.revokeObjectURL).toHaveBeenCalled();
    });
    await flushUi();

    clickSpy.mockRestore();
  });

  it('opens print window and renders report markup sections', async () => {
    const printWindow = {
      document: { open: vi.fn(), write: vi.fn(), close: vi.fn() },
      close: vi.fn(),
      focus: vi.fn(),
      print: vi.fn(),
      addEventListener: vi.fn(),
    };
    printMocks.open.mockReturnValue(printWindow);
    apiMocks.getReport.mockResolvedValue({
      generatedAt: '2026-08-06T12:00:00+04:00',
      partners: [
        {
          id: 'p1',
          code: '0000001',
          name: 'Test',
          isCustomer: true,
          isSupplier: false,
          isActive: true,
          currentDebtBalance: '10.0000',
          debtBalanceLabel: 'Tərəfdaş bizə borcludur',
        },
      ],
      partnerCount: 1,
      totalPartnerDebtBalance: '10.0000',
      totalPartnerReceivable: '10.0000',
      totalPartnerPayable: '0.0000',
      cashAccounts: [
        {
          id: 'c1',
          code: 'CASH-0001',
          name: 'Əsas',
          responsibleUserName: 'Əli',
          currentBalance: '100.00',
        },
      ],
      activeCashAccountCount: 1,
      totalCompanyCash: '100.00',
    });

    render(<DailyBalanceReportPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Çap et' }));

    await waitFor(() => {
      expect(apiMocks.getReport).toHaveBeenCalled();
      expect(printMocks.render).toHaveBeenCalledWith(
        printWindow,
        expect.objectContaining({
          partnerCount: 1,
          totalCompanyCash: '100.00',
        }),
      );
    });
    await flushUi();
  });
});
