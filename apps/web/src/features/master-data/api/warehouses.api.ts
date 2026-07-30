import { httpClient } from '../../../api/http-client';
import { normalizeListQuery } from './normalize-list-query';
import type { MasterDataListQuery, PaginatedResponse } from './master-data.types';

export type WarehouseKind = 'GENERAL' | 'DAMAGED';

export type Warehouse = {
  id: string;
  code: string;
  name: string;
  kind: WarehouseKind;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type WarehouseListQuery = MasterDataListQuery & {
  kind?: WarehouseKind;
};

export type CreateWarehouseInput = {
  name: string;
  kind: WarehouseKind;
};

export type UpdateWarehouseInput = {
  name?: string;
  kind?: WarehouseKind;
  isActive?: boolean;
};

export async function listWarehouses(
  query: WarehouseListQuery = {},
): Promise<PaginatedResponse<Warehouse>> {
  const { data } = await httpClient.get<PaginatedResponse<Warehouse>>(
    '/warehouses',
    { params: normalizeListQuery(query) },
  );
  return data;
}

export async function getWarehouse(id: string): Promise<Warehouse> {
  const { data } = await httpClient.get<Warehouse>(`/warehouses/${id}`);
  return data;
}

export async function createWarehouse(
  input: CreateWarehouseInput,
): Promise<Warehouse> {
  const { data } = await httpClient.post<Warehouse>('/warehouses', input);
  return data;
}

export async function updateWarehouse(
  id: string,
  input: UpdateWarehouseInput,
): Promise<Warehouse> {
  const { data } = await httpClient.patch<Warehouse>(`/warehouses/${id}`, input);
  return data;
}

export async function deactivateWarehouse(id: string): Promise<Warehouse> {
  const { data } = await httpClient.delete<Warehouse>(`/warehouses/${id}`);
  return data;
}
