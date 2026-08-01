import { httpClient } from '../../../api/http-client';
import { normalizeListQuery } from './normalize-list-query';
import type { MasterDataListQuery, PaginatedResponse } from './master-data.types';

export type ProductType = 'FINISHED_GOOD' | 'RAW_MATERIAL' | 'MIXED_USE';

export type ProductUnitSummary = {
  id: string;
  code: string;
  name: string;
  allowsFractionalQuantity: boolean;
  isActive: boolean;
};

export type ProductCategorySummary = {
  id: string;
  name: string;
  isActive: boolean;
};

export type Product = {
  id: string;
  code: string;
  name: string;
  type: ProductType;
  categoryId: string | null;
  category: ProductCategorySummary | null;
  unitId: string;
  unit: ProductUnitSummary;
  standardSalePrice: string | null;
  latestPurchasePrice: string | null;
  currentQuantity: string;
  criticalStockThreshold: string | null;
  barcode: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ProductListQuery = MasterDataListQuery & {
  type?: ProductType;
  unitId?: string;
  categoryId?: string;
};

export type CreateProductInput = {
  name: string;
  type: ProductType;
  categoryId?: string | null;
  unitId: string;
  standardSalePrice?: string;
  latestPurchasePrice?: string;
  criticalStockThreshold?: string;
  barcode?: string;
  notes?: string;
};

export type UpdateProductInput = {
  name?: string;
  type?: ProductType;
  categoryId?: string | null;
  unitId?: string;
  standardSalePrice?: string | null;
  latestPurchasePrice?: string | null;
  criticalStockThreshold?: string | null;
  barcode?: string | null;
  notes?: string | null;
  isActive?: boolean;
};

export type ProductQuantityHistory = {
  id: string;
  productId: string;
  kind: string;
  quantityChange: string;
  quantityBefore: string;
  quantityAfter: string;
  reason: string | null;
  saleId: string | null;
  purchaseId: string | null;
  createdByUserId: string;
  createdAt: string;
};

export type AdjustProductQuantityInput = {
  quantityChange: string;
  reason: string;
};

export async function listProducts(
  query: ProductListQuery = {},
): Promise<PaginatedResponse<Product>> {
  const { data } = await httpClient.get<PaginatedResponse<Product>>(
    '/products',
    { params: normalizeListQuery(query) },
  );
  return data;
}

export async function getProduct(id: string): Promise<Product> {
  const { data } = await httpClient.get<Product>(`/products/${id}`);
  return data;
}

export async function createProduct(
  input: CreateProductInput,
): Promise<Product> {
  const { data } = await httpClient.post<Product>('/products', input);
  return data;
}

export async function updateProduct(
  id: string,
  input: UpdateProductInput,
): Promise<Product> {
  const { data } = await httpClient.patch<Product>(`/products/${id}`, input);
  return data;
}

export async function deactivateProduct(id: string): Promise<Product> {
  const { data } = await httpClient.delete<Product>(`/products/${id}`);
  return data;
}

export async function listProductQuantityHistory(
  productId: string,
  query: { page?: number; pageSize?: number } = {},
): Promise<PaginatedResponse<ProductQuantityHistory>> {
  const { data } = await httpClient.get<
    PaginatedResponse<ProductQuantityHistory>
  >(`/products/${productId}/quantity-history`, { params: query });
  return data;
}

export async function adjustProductQuantity(
  productId: string,
  input: AdjustProductQuantityInput,
): Promise<Product> {
  const { data } = await httpClient.post<Product>(
    `/products/${productId}/quantity-adjustments`,
    input,
  );
  return data;
}
