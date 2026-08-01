import { httpClient } from '../../../api/http-client';
import type { PaginatedResponse } from '../../master-data/api/master-data.types';

export type SaleStatus = 'DRAFT' | 'POSTED' | 'CANCELLED';
export type SaleSortBy =
  | 'documentNumber'
  | 'businessDate'
  | 'status'
  | 'totalAmount'
  | 'createdAt';

export type SaleListQuery = {
  page?: number;
  pageSize?: number;
  documentNumber?: string;
  partnerId?: string;
  status?: SaleStatus;
  businessDateFrom?: string;
  businessDateTo?: string;
  productId?: string;
  createdByUserId?: string;
  minTotal?: string;
  maxTotal?: string;
  sortBy?: SaleSortBy;
  sortOrder?: 'asc' | 'desc';
};

export type SaleListItem = {
  id: string;
  documentNumber: string;
  businessDate: string;
  status: SaleStatus;
  partnerId?: string;
  partnerName?: string;
  partnerCode?: string;
  partner?: SalePartner;
  itemCount: number;
  subtotalAmount: string;
  discountAmount: string | null;
  totalAmount: string;
  createdByUserId?: string;
  createdByName?: string;
  createdBy?: SaleUser;
  createdAt: string;
  updatedAt: string;
};

export type SaleUser = {
  id: string;
  username: string;
  fullName: string;
};

export type SalePartner = {
  id: string;
  code: string;
  name: string;
  currentDebtBalance: string;
  isCustomer: boolean;
  isActive: boolean;
};

export type SaleItem = {
  id: string;
  productId: string;
  unitId: string;
  productCodeSnapshot: string;
  productNameSnapshot: string;
  unitNameSnapshot: string;
  quantity: string;
  unitPrice: string;
  discountAmount: string;
  lineSubtotal: string;
  lineTotal: string;
  notes: string | null;
  costAtPosting: string | null;
};

export type SaleQuantityHistory = {
  id: string;
  productId: string;
  kind: string;
  quantityChange: string;
  quantityBefore: string;
  quantityAfter: string;
  reason: string | null;
  createdAt: string;
  createdByUserId?: string;
};

export type SaleDebtMovement = {
  id: string;
  kind: string;
  signedAmount: string;
  balanceBefore: string;
  balanceAfter: string;
  reason: string | null;
  reversalOfId: string | null;
  createdAt: string;
  createdByUserId?: string;
};

export type Sale = {
  id: string;
  documentNumber: string;
  partnerId?: string;
  partner: SalePartner;
  businessDate: string;
  status: SaleStatus;
  subtotalAmount: string;
  discountAmount: string | null;
  totalAmount: string;
  notes: string | null;
  negativeQuantityOverrideReason: string | null;
  postedAt: string | null;
  postedByUserId?: string | null;
  postedBy: SaleUser | null;
  cancelledAt: string | null;
  cancelledByUserId?: string | null;
  cancelledBy: SaleUser | null;
  cancelReason: string | null;
  createdAt: string;
  updatedAt: string;
  createdByUserId?: string;
  createdBy: SaleUser;
  items: SaleItem[];
  productQuantityHistory: SaleQuantityHistory[];
  partnerDebtMovements: SaleDebtMovement[];
};

export type SaleItemInput = {
  productId: string;
  quantity: string;
  unitPrice: string;
  discountAmount?: string;
  notes?: string;
};

export type SaleInput = {
  partnerId: string;
  businessDate: string;
  notes?: string;
  discountAmount?: string;
  items: SaleItemInput[];
};

export type PostSaleInput = {
  negativeQuantityReason?: string;
};

function cleanQuery(query: SaleListQuery) {
  return Object.fromEntries(
    Object.entries(query).filter(([, value]) => value !== undefined && value !== ''),
  );
}

export async function listSales(
  query: SaleListQuery = {},
): Promise<PaginatedResponse<SaleListItem>> {
  const { data } = await httpClient.get<PaginatedResponse<SaleListItem>>(
    '/sales',
    { params: cleanQuery(query) },
  );
  return data;
}

export async function getSale(id: string): Promise<Sale> {
  const { data } = await httpClient.get<Sale>(`/sales/${id}`);
  return data;
}

export async function createSale(input: SaleInput): Promise<Sale> {
  const { data } = await httpClient.post<Sale>('/sales', input);
  return data;
}

export async function updateSale(
  id: string,
  input: SaleInput,
): Promise<Sale> {
  const { data } = await httpClient.patch<Sale>(`/sales/${id}`, input);
  return data;
}

export async function removeSale(id: string): Promise<void> {
  await httpClient.delete(`/sales/${id}`);
}

export async function postSale(
  id: string,
  input: PostSaleInput = {},
): Promise<Sale> {
  const body = input.negativeQuantityReason
    ? { negativeQuantityReason: input.negativeQuantityReason }
    : undefined;
  const { data } = await httpClient.post<Sale>(`/sales/${id}/post`, body);
  return data;
}

export async function cancelSale(
  id: string,
  reason: string,
): Promise<Sale> {
  const { data } = await httpClient.post<Sale>(`/sales/${id}/cancel`, {
    reason,
  });
  return data;
}
