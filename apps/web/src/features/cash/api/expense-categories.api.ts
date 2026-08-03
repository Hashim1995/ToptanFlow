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

export type ExpenseCategory = {
  id: string;
  name: string;
  isActive: boolean;
  deactivatedAt: string | null;
  deactivationReason: string | null;
  createdAt: string;
  updatedAt: string;
  createdByUserId: string;
};

export type ExpenseCategoryListQuery = {
  page?: number;
  pageSize?: number;
  search?: string;
  isActive?: boolean;
  sortBy?: 'name' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
};

export async function listExpenseCategories(
  query: ExpenseCategoryListQuery = {},
): Promise<PaginatedResponse<ExpenseCategory>> {
  const { data } = await httpClient.get<PaginatedResponse<ExpenseCategory>>(
    '/expense-categories',
    { params: cleanQuery(query) },
  );
  return data;
}

export async function createExpenseCategory(input: {
  name: string;
}): Promise<ExpenseCategory> {
  const { data } = await httpClient.post<ExpenseCategory>(
    '/expense-categories',
    input,
  );
  return data;
}

export async function updateExpenseCategory(
  id: string,
  input: { name: string },
): Promise<ExpenseCategory> {
  const { data } = await httpClient.patch<ExpenseCategory>(
    `/expense-categories/${id}`,
    input,
  );
  return data;
}

export async function deactivateExpenseCategory(
  id: string,
  reason?: string,
): Promise<ExpenseCategory> {
  const { data } = await httpClient.post<ExpenseCategory>(
    `/expense-categories/${id}/deactivate`,
    { reason },
  );
  return data;
}

export async function reactivateExpenseCategory(
  id: string,
): Promise<ExpenseCategory> {
  const { data } = await httpClient.post<ExpenseCategory>(
    `/expense-categories/${id}/reactivate`,
  );
  return data;
}
