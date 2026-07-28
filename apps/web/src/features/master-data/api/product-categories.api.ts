import { httpClient } from '../../../api/http-client';
import { normalizeListQuery } from './normalize-list-query';
import type { MasterDataListQuery, PaginatedResponse } from './master-data.types';

export type ProductCategory = {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateProductCategoryInput = {
  name: string;
};

export type UpdateProductCategoryInput = {
  name?: string;
  isActive?: boolean;
};

export async function listProductCategories(
  query: MasterDataListQuery = {},
): Promise<PaginatedResponse<ProductCategory>> {
  const { data } = await httpClient.get<PaginatedResponse<ProductCategory>>(
    '/product-categories',
    { params: normalizeListQuery(query) },
  );
  return data;
}

export async function getProductCategory(id: string): Promise<ProductCategory> {
  const { data } = await httpClient.get<ProductCategory>(
    `/product-categories/${id}`,
  );
  return data;
}

export async function createProductCategory(
  input: CreateProductCategoryInput,
): Promise<ProductCategory> {
  const { data } = await httpClient.post<ProductCategory>(
    '/product-categories',
    input,
  );
  return data;
}

export async function updateProductCategory(
  id: string,
  input: UpdateProductCategoryInput,
): Promise<ProductCategory> {
  const { data } = await httpClient.patch<ProductCategory>(
    `/product-categories/${id}`,
    input,
  );
  return data;
}

export async function deactivateProductCategory(
  id: string,
): Promise<ProductCategory> {
  const { data } = await httpClient.delete<ProductCategory>(
    `/product-categories/${id}`,
  );
  return data;
}
