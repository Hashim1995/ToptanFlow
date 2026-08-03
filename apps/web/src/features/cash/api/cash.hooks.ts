import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  cancelCashTransaction,
  createCashAccount,
  createCashIn,
  createCashOut,
  createExpense,
  createCashTransfer,
  deactivateCashAccount,
  getCashAccount,
  getCashAccountStatement,
  getCashPeriodSummary,
  getCashWorkspaceOverview,
  getTotalCompanyCash,
  listCashAccounts,
  listCashTransactions,
  reactivateCashAccount,
  updateCashAccount,
  type CashAccountListQuery,
  type CashPeriodSummaryQuery,
  type CashReportDateRangeQuery,
  type CashTransactionListQuery,
  type CreateCashAccountInput,
  type CreateCashInInput,
  type CreateCashOutInput,
  type CreateExpenseInput,
  type CreateCashTransferInput,
  type UpdateCashAccountInput,
} from './cash.api';
import {
  createExpenseCategory,
  deactivateExpenseCategory,
  listExpenseCategories,
  reactivateExpenseCategory,
  updateExpenseCategory,
  type ExpenseCategoryListQuery,
} from './expense-categories.api';
import { cashQueryKeys } from './cash-query-keys';
import { masterDataQueryKeys } from '../../master-data/api/master-data-query-keys';

export function useCashAccountsList(query: CashAccountListQuery) {
  return useQuery({
    queryKey: cashQueryKeys.accounts.list(query),
    queryFn: () => listCashAccounts(query),
  });
}

export function useCashAccount(id: string | undefined) {
  return useQuery({
    queryKey: cashQueryKeys.accounts.detail(id ?? ''),
    queryFn: () => getCashAccount(id!),
    enabled: Boolean(id),
  });
}

export function useTotalCompanyCash() {
  return useQuery({
    queryKey: cashQueryKeys.accounts.total,
    queryFn: getTotalCompanyCash,
  });
}

export function useCashWorkspaceOverview() {
  return useQuery({
    queryKey: cashQueryKeys.accounts.workspace,
    queryFn: getCashWorkspaceOverview,
  });
}

export function useCashTransactionsList(query: CashTransactionListQuery) {
  return useQuery({
    queryKey: cashQueryKeys.transactions.list(query),
    queryFn: () => listCashTransactions(query),
  });
}

function useCashInvalidation() {
  const queryClient = useQueryClient();
  return async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: cashQueryKeys.all }),
      queryClient.invalidateQueries({
        queryKey: masterDataQueryKeys.businessPartners.all,
      }),
    ]);
  };
}

export function useCreateCashAccount() {
  const invalidate = useCashInvalidation();
  return useMutation({
    mutationFn: (input: CreateCashAccountInput) => createCashAccount(input),
    onSuccess: () => invalidate(),
  });
}

export function useUpdateCashAccount() {
  const invalidate = useCashInvalidation();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateCashAccountInput }) =>
      updateCashAccount(id, input),
    onSuccess: () => invalidate(),
  });
}

export function useDeactivateCashAccount() {
  const invalidate = useCashInvalidation();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      deactivateCashAccount(id, reason),
    onSuccess: () => invalidate(),
  });
}

export function useReactivateCashAccount() {
  const invalidate = useCashInvalidation();
  return useMutation({
    mutationFn: (id: string) => reactivateCashAccount(id),
    onSuccess: () => invalidate(),
  });
}

export function useCreateCashIn() {
  const invalidate = useCashInvalidation();
  return useMutation({
    mutationFn: (input: CreateCashInInput) => createCashIn(input),
    onSuccess: () => invalidate(),
  });
}

export function useCreateCashOut() {
  const invalidate = useCashInvalidation();
  return useMutation({
    mutationFn: (input: CreateCashOutInput) => createCashOut(input),
    onSuccess: () => invalidate(),
  });
}

export function useCreateExpense() {
  const invalidate = useCashInvalidation();
  return useMutation({
    mutationFn: (input: CreateExpenseInput) => createExpense(input),
    onSuccess: () => invalidate(),
  });
}

export function useCreateCashTransfer() {
  const invalidate = useCashInvalidation();
  return useMutation({
    mutationFn: (input: CreateCashTransferInput) => createCashTransfer(input),
    onSuccess: () => invalidate(),
  });
}

export function useCancelCashTransaction() {
  const invalidate = useCashInvalidation();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      cancelCashTransaction(id, reason),
    onSuccess: () => invalidate(),
  });
}

export function useExpenseCategoriesList(query: ExpenseCategoryListQuery) {
  return useQuery({
    queryKey: cashQueryKeys.expenseCategories.list(query),
    queryFn: () => listExpenseCategories(query),
  });
}

function useExpenseCategoryInvalidation() {
  const queryClient = useQueryClient();
  return async () => {
    await queryClient.invalidateQueries({
      queryKey: cashQueryKeys.expenseCategories.all,
    });
  };
}

export function useCreateExpenseCategory() {
  const invalidate = useExpenseCategoryInvalidation();
  return useMutation({
    mutationFn: (input: { name: string }) => createExpenseCategory(input),
    onSuccess: () => invalidate(),
  });
}

export function useUpdateExpenseCategory() {
  const invalidate = useExpenseCategoryInvalidation();
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      updateExpenseCategory(id, { name }),
    onSuccess: () => invalidate(),
  });
}

export function useDeactivateExpenseCategory() {
  const invalidate = useExpenseCategoryInvalidation();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      deactivateExpenseCategory(id, reason),
    onSuccess: () => invalidate(),
  });
}

export function useReactivateExpenseCategory() {
  const invalidate = useExpenseCategoryInvalidation();
  return useMutation({
    mutationFn: (id: string) => reactivateExpenseCategory(id),
    onSuccess: () => invalidate(),
  });
}

export function useCashPeriodSummary(query: CashPeriodSummaryQuery) {
  return useQuery({
    queryKey: cashQueryKeys.reports.periodSummary(query),
    queryFn: () => getCashPeriodSummary(query),
  });
}

export function useCashAccountStatement(
  cashAccountId: string | undefined,
  query: CashReportDateRangeQuery,
) {
  return useQuery({
    queryKey: cashQueryKeys.accounts.statement(cashAccountId ?? '', query),
    queryFn: () => getCashAccountStatement(cashAccountId!, query),
    enabled: Boolean(cashAccountId),
  });
}
