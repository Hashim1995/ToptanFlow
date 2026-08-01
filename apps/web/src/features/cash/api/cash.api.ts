import { httpClient } from '../../../api/http-client';
import type { PaginatedResponse } from '../../master-data/api/master-data.types';

function cleanQuery(query: Record<string, unknown>) {
  const params: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') continue;
    params[key] = value;
  }
  return params;
}

export type CashAccount = {
  id: string;
  name: string;
  code: string;
  currentBalance: string;
  notes: string | null;
  responsibleUserId: string | null;
  responsibleUserName: string | null;
  isActive: boolean;
  deactivatedAt: string | null;
  deactivationReason: string | null;
  createdAt: string;
  updatedAt: string;
  createdByUserId: string;
};

export type CashAccountListQuery = {
  page?: number;
  pageSize?: number;
  search?: string;
  isActive?: boolean;
  responsibleUserId?: string;
  sortBy?: 'name' | 'code' | 'currentBalance' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
};

export type CreateCashAccountInput = {
  name: string;
  notes?: string;
  responsibleUserId?: string;
  openingBalance?: string;
};

export type UpdateCashAccountInput = {
  name?: string;
  notes?: string | null;
  responsibleUserId?: string | null;
};

export type TotalCompanyCash = {
  totalCompanyCash: string;
  activeAccountCount: number;
};

export type CashAccountWorkspaceCard = CashAccount & {
  todayCashIn: string;
  todayCashOut: string;
  todayExpenses: string;
  recentActivity: Array<{
    id: string;
    transactionNumber: string;
    type: string;
    direction: string;
    amount: string;
    transactionDate: string;
  }>;
};

export type CashWorkspaceOverview = {
  totalCompanyCash: string;
  activeAccountCount: number;
  accounts: CashAccountWorkspaceCard[];
};

export type CashTxnDirection = 'IN' | 'OUT';
export type CashTxnStatus = 'POSTED' | 'CANCELLED';

export type CashTransaction = {
  id: string;
  transactionNumber: string;
  cashAccountId: string;
  cashAccountName: string | null;
  direction: CashTxnDirection | string;
  type: string;
  status: CashTxnStatus | string;
  amount: string;
  balanceBefore: string;
  balanceAfter: string;
  transactionDate: string;
  notes: string | null;
  negativeBalanceOverrideReason: string | null;
  cancelReason: string | null;
  expenseCategoryId?: string | null;
  expenseCategoryName?: string | null;
  partnerId?: string | null;
  partnerName?: string | null;
  saleId?: string | null;
  purchaseId?: string | null;
  cashTransferId?: string | null;
  createdByUserId: string;
  createdByName?: string | null;
  createdAt: string;
};

export type CashTransactionListQuery = {
  page?: number;
  pageSize?: number;
  cashAccountId?: string;
  type?: string;
  direction?: CashTxnDirection;
  status?: CashTxnStatus;
  dateFrom?: string;
  dateTo?: string;
  transactionNumber?: string;
  partnerId?: string;
  expenseCategoryId?: string;
  saleId?: string;
  purchaseId?: string;
  amountMin?: string;
  amountMax?: string;
  sortBy?: 'transactionDate' | 'createdAt' | 'amount';
  sortOrder?: 'asc' | 'desc';
};

export type CreateCashInInput = {
  cashAccountId: string;
  partnerId: string;
  amount: string;
  transactionDate: string;
  saleId?: string;
  notes?: string;
};

export type CreateCashOutInput = {
  cashAccountId: string;
  partnerId: string;
  amount: string;
  transactionDate: string;
  purchaseId?: string;
  notes?: string;
  negativeBalanceOverrideReason?: string;
};

export type CreateExpenseInput = {
  cashAccountId: string;
  expenseCategoryId: string;
  amount: string;
  transactionDate: string;
  notes: string;
  negativeBalanceOverrideReason?: string;
};

export type CreateCashTransferInput = {
  sourceCashAccountId: string;
  destinationCashAccountId: string;
  amount: string;
  transactionDate: string;
  notes?: string;
  negativeBalanceOverrideReason?: string;
};

export type CashTransfer = {
  id: string;
  transferNumber: string;
  sourceCashAccountId: string;
  sourceCashAccountName: string;
  destinationCashAccountId: string;
  destinationCashAccountName: string;
  amount: string;
  transactionDate: string;
  notes: string | null;
  status: string;
  negativeBalanceOverrideReason: string | null;
  cancelReason: string | null;
  createdByUserId: string;
  createdAt: string;
  outTransactionId: string | null;
  inTransactionId: string | null;
  sourceBalanceBefore: string | null;
  sourceBalanceAfter: string | null;
  destinationBalanceBefore: string | null;
  destinationBalanceAfter: string | null;
};

export async function listCashAccounts(
  query: CashAccountListQuery = {},
): Promise<PaginatedResponse<CashAccount>> {
  const { data } = await httpClient.get<PaginatedResponse<CashAccount>>(
    '/cash-accounts',
    { params: cleanQuery(query) },
  );
  return data;
}

export async function getCashAccount(id: string): Promise<CashAccount> {
  const { data } = await httpClient.get<CashAccount>(`/cash-accounts/${id}`);
  return data;
}

export async function createCashAccount(
  input: CreateCashAccountInput,
): Promise<CashAccount> {
  const { data } = await httpClient.post<CashAccount>('/cash-accounts', input);
  return data;
}

export async function updateCashAccount(
  id: string,
  input: UpdateCashAccountInput,
): Promise<CashAccount> {
  const { data } = await httpClient.patch<CashAccount>(
    `/cash-accounts/${id}`,
    input,
  );
  return data;
}

export async function deactivateCashAccount(
  id: string,
  reason?: string,
): Promise<CashAccount> {
  const { data } = await httpClient.post<CashAccount>(
    `/cash-accounts/${id}/deactivate`,
    { reason },
  );
  return data;
}

export async function reactivateCashAccount(id: string): Promise<CashAccount> {
  const { data } = await httpClient.post<CashAccount>(
    `/cash-accounts/${id}/reactivate`,
  );
  return data;
}

export async function getTotalCompanyCash(): Promise<TotalCompanyCash> {
  const { data } = await httpClient.get<TotalCompanyCash>(
    '/cash-accounts/summary/total-company-cash',
  );
  return data;
}

export async function getCashWorkspaceOverview(): Promise<CashWorkspaceOverview> {
  const { data } = await httpClient.get<CashWorkspaceOverview>(
    '/cash-accounts/summary/workspace',
  );
  return data;
}

export async function listCashTransactions(
  query: CashTransactionListQuery = {},
): Promise<PaginatedResponse<CashTransaction>> {
  const { data } = await httpClient.get<PaginatedResponse<CashTransaction>>(
    '/cash-transactions',
    { params: cleanQuery(query) },
  );
  return data;
}

export async function createCashIn(
  input: CreateCashInInput,
): Promise<CashTransaction> {
  const { data } = await httpClient.post<CashTransaction>(
    '/cash-transactions/cash-in',
    input,
  );
  return data;
}

export async function createCashOut(
  input: CreateCashOutInput,
): Promise<CashTransaction> {
  const { data } = await httpClient.post<CashTransaction>(
    '/cash-transactions/cash-out',
    input,
  );
  return data;
}

export async function createExpense(
  input: CreateExpenseInput,
): Promise<CashTransaction> {
  const { data } = await httpClient.post<CashTransaction>(
    '/cash-transactions/expense',
    input,
  );
  return data;
}

export async function createCashTransfer(
  input: CreateCashTransferInput,
): Promise<CashTransfer> {
  const { data } = await httpClient.post<CashTransfer>(
    '/cash-transactions/transfer',
    input,
  );
  return data;
}

export async function cancelCashTransaction(
  id: string,
  reason: string,
): Promise<CashTransaction> {
  const { data } = await httpClient.post<CashTransaction>(
    `/cash-transactions/${id}/cancel`,
    { reason },
  );
  return data;
}

export type CashReportDateRangeQuery = {
  dateFrom?: string;
  dateTo?: string;
};

export type CashPeriodSummaryQuery = CashReportDateRangeQuery & {
  cashAccountId?: string;
};

export type CashStatementLine = {
  id: string;
  transactionNumber: string;
  transactionDate: string;
  type: string;
  direction: string;
  status: string;
  amount: string;
  signedEffect: string;
  runningBalance: string;
  partnerName: string | null;
  expenseCategoryName: string | null;
  notes: string | null;
  cancelReason: string | null;
  saleId: string | null;
  purchaseId: string | null;
};

export type CashAccountStatement = {
  cashAccountId: string;
  cashAccountName: string;
  cashAccountCode: string;
  dateFrom: string | null;
  dateTo: string | null;
  openingBalance: string;
  closingBalance: string;
  currentBalance: string;
  lines: CashStatementLine[];
};

export type ExpenseCategoryTotal = {
  expenseCategoryId: string | null;
  expenseCategoryName: string;
  total: string;
};

export type CashPeriodSummary = {
  dateFrom: string | null;
  dateTo: string | null;
  cashAccountId: string | null;
  totalCompanyCash: string;
  activeAccountCount: number;
  negativeAccountCount: number;
  cashInTotal: string;
  cashOutTotal: string;
  expenseTotal: string;
  expensesByCategory: ExpenseCategoryTotal[];
  partnerCashInTotal: string;
  partnerCashOutTotal: string;
  transferTotal: string;
  cancelledCount: number;
  reversalCount: number;
};

export async function getCashPeriodSummary(
  query: CashPeriodSummaryQuery,
): Promise<CashPeriodSummary> {
  const { data } = await httpClient.get<CashPeriodSummary>(
    '/cash-accounts/reports/period-summary',
    { params: cleanQuery(query) },
  );
  return data;
}

export async function getCashAccountStatement(
  cashAccountId: string,
  query: CashReportDateRangeQuery,
): Promise<CashAccountStatement> {
  const { data } = await httpClient.get<CashAccountStatement>(
    `/cash-accounts/${cashAccountId}/statement`,
    { params: cleanQuery(query) },
  );
  return data;
}
