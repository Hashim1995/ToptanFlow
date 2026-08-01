import { httpClient } from '../../../api/http-client';
import { normalizeListQuery } from './normalize-list-query';
import type { MasterDataListQuery, PaginatedResponse } from './master-data.types';

export type Unit = {
  id: string;
  code: string;
  name: string;
  allowsFractionalQuantity: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateUnitInput = {
  code: string;
  name: string;
  allowsFractionalQuantity?: boolean;
};

export type UpdateUnitInput = {
  code?: string;
  name?: string;
  allowsFractionalQuantity?: boolean;
  isActive?: boolean;
};

export async function listUnits(
  query: MasterDataListQuery = {},
): Promise<PaginatedResponse<Unit>> {
  const { data } = await httpClient.get<PaginatedResponse<Unit>>('/units', {
    params: normalizeListQuery(query),
  });
  return data;
}

export async function getUnit(id: string): Promise<Unit> {
  const { data } = await httpClient.get<Unit>(`/units/${id}`);
  return data;
}

export async function createUnit(input: CreateUnitInput): Promise<Unit> {
  const { data } = await httpClient.post<Unit>('/units', input);
  return data;
}

export async function updateUnit(
  id: string,
  input: UpdateUnitInput,
): Promise<Unit> {
  const { data } = await httpClient.patch<Unit>(`/units/${id}`, input);
  return data;
}

export async function deactivateUnit(id: string): Promise<Unit> {
  const { data } = await httpClient.delete<Unit>(`/units/${id}`);
  return data;
}
