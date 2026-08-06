import type { AxiosProgressEvent } from 'axios';
import { httpClient } from '../../../api/http-client';

export type DailyBalancePartnerRow = {
  id: string;
  code: string;
  name: string;
  isCustomer: boolean;
  isSupplier: boolean;
  isActive: boolean;
  currentDebtBalance: string;
  debtBalanceLabel: string;
};

export type DailyBalanceCashAccountRow = {
  id: string;
  code: string;
  name: string;
  responsibleUserName: string;
  currentBalance: string;
};

export type DailyBalanceReport = {
  generatedAt: string;
  partners: DailyBalancePartnerRow[];
  partnerCount: number;
  totalPartnerDebtBalance: string;
  totalPartnerReceivable: string;
  totalPartnerPayable: string;
  cashAccounts: DailyBalanceCashAccountRow[];
  activeCashAccountCount: number;
  totalCompanyCash: string;
};

export async function getDailyBalanceReport(
  signal: AbortSignal,
): Promise<DailyBalanceReport> {
  const { data } = await httpClient.get<DailyBalanceReport>(
    '/reports/daily-balance',
    { signal },
  );
  return data;
}

export async function downloadDailyBalanceReport(
  signal: AbortSignal,
  onDownloadProgress?: (event: AxiosProgressEvent) => void,
): Promise<Blob> {
  const { data } = await httpClient.get<Blob>('/reports/daily-balance/export', {
    params: { format: 'EXCEL' },
    responseType: 'blob',
    signal,
    onDownloadProgress,
  });
  return data;
}
