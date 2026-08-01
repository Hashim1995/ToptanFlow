import type {
  CashAccountListQuery,
  CashPeriodSummaryQuery,
  CashReportDateRangeQuery,
  CashTransactionListQuery,
} from './cash.api';

export const cashQueryKeys = {
  all: ['cash'] as const,
  accounts: {
    all: ['cash', 'accounts'] as const,
    list: (query: CashAccountListQuery) =>
      ['cash', 'accounts', 'list', query] as const,
    detail: (id: string) => ['cash', 'accounts', 'detail', id] as const,
    total: ['cash', 'accounts', 'total-company-cash'] as const,
    workspace: ['cash', 'accounts', 'workspace'] as const,
    statement: (id: string, query: CashReportDateRangeQuery) =>
      ['cash', 'accounts', 'statement', id, query] as const,
  },
  reports: {
    periodSummary: (query: CashPeriodSummaryQuery) =>
      ['cash', 'reports', 'period-summary', query] as const,
  },
  transactions: {
    all: ['cash', 'transactions'] as const,
    list: (query: CashTransactionListQuery) =>
      ['cash', 'transactions', 'list', query] as const,
    detail: (id: string) => ['cash', 'transactions', 'detail', id] as const,
  },
  expenseCategories: {
    all: ['cash', 'expense-categories'] as const,
    list: (query: Record<string, unknown>) =>
      ['cash', 'expense-categories', 'list', query] as const,
  },
};
