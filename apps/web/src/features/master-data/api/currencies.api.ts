import { httpClient } from '../../../api/http-client';
import { normalizeListQuery } from './normalize-list-query';
import type { MasterDataListQuery, PaginatedResponse } from './master-data.types';

export type Currency = {
  id: string;
  code: string;
  name: string;
  symbol: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateCurrencyInput = {
  code: string;
  name: string;
  symbol?: string | null;
};

export type UpdateCurrencyInput = {
  code?: string;
  name?: string;
  symbol?: string | null;
  isActive?: boolean;
};

export async function listCurrencies(
  query: MasterDataListQuery = {},
): Promise<PaginatedResponse<Currency>> {
  const { data } = await httpClient.get<PaginatedResponse<Currency>>(
    '/currencies',
    { params: normalizeListQuery(query) },
  );
  return data;
}

export async function getCurrency(id: string): Promise<Currency> {
  const { data } = await httpClient.get<Currency>(`/currencies/${id}`);
  return data;
}

export async function createCurrency(
  input: CreateCurrencyInput,
): Promise<Currency> {
  const { data } = await httpClient.post<Currency>('/currencies', input);
  return data;
}

export async function updateCurrency(
  id: string,
  input: UpdateCurrencyInput,
): Promise<Currency> {
  const { data } = await httpClient.patch<Currency>(`/currencies/${id}`, input);
  return data;
}

export async function deactivateCurrency(id: string): Promise<Currency> {
  const { data } = await httpClient.delete<Currency>(`/currencies/${id}`);
  return data;
}
